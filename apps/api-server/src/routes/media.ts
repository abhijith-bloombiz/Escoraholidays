import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import path from "path";
import fs from "fs";
import {
  MediaModel,
  DestinationModel,
  PackageModel,
  JournalPostModel,
  ItineraryModel,
  TravelCategoryModel,
  getNextSequence,
} from "@workspace/db";
import {
  ListMediaResponse,
  ListMediaQueryParams,
  GetMediaFileParams,
  DeleteMediaParams,
} from "@workspace/api-zod";
import { detectMediaMimeType } from "../lib/auth-crypto";

const router: IRouter = Router();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

const workspaceRoot = process.cwd().endsWith(path.join("apps", "api-server"))
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();

const uploadsDir = path.resolve(workspaceRoot, "apps/api-server/uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

interface MediaReferenceItem {
  type: string;
  id: number;
  title: string;
  field: string;
}

/**
 * Safely scans the server's uploads directory and registers any existing
 * files that are missing from the MediaModel collection.
 */
async function syncDiskUploads(): Promise<void> {
  if (!fs.existsSync(uploadsDir)) return;
  try {
    const files = fs.readdirSync(uploadsDir);
    for (const filename of files) {
      if (filename.startsWith(".") || filename.includes("..")) continue;
      const fileUrl = `/api/media/files/${filename}`;
      const existing = await MediaModel.findOne({ url: fileUrl }).lean();
      if (!existing) {
        const fullPath = path.join(uploadsDir, filename);
        let stat: fs.Stats;
        try {
          stat = fs.statSync(fullPath);
        } catch {
          continue;
        }
        if (!stat.isFile()) continue;

        let mimeType = "application/octet-stream";
        try {
          const fd = fs.openSync(fullPath, "r");
          const headBuffer = Buffer.alloc(Math.min(stat.size, 4096));
          fs.readSync(fd, headBuffer, 0, headBuffer.length, 0);
          fs.closeSync(fd);
          const detected = detectMediaMimeType(headBuffer);
          if (detected) {
            mimeType = detected.mimeType;
          }
        } catch {
          // ignore read error
        }

        const id = await getNextSequence("media");
        await MediaModel.create({
          id,
          filename,
          url: fileUrl,
          mimeType,
          sizeBytes: stat.size,
          createdAt: stat.birthtime || stat.mtime || new Date(),
        });
      }
    }
  } catch (err) {
    console.warn("[media] Error syncing disk uploads:", err);
  }
}

/**
 * Scans all database collections that reference media (Destinations, Packages,
 * Journal posts, Itineraries, and Travel Categories) and aggregates references by URL.
 */
async function collectAllContentReferences(): Promise<Map<string, MediaReferenceItem[]>> {
  const urlMap = new Map<string, MediaReferenceItem[]>();

  function recordRef(rawUrl: string | null | undefined, ref: MediaReferenceItem) {
    if (!rawUrl || typeof rawUrl !== "string") return;
    const trimmed = rawUrl.trim();
    if (!trimmed) return;
    const existing = urlMap.get(trimmed) || [];
    const duplicate = existing.some(
      (e) => e.type === ref.type && e.id === ref.id && e.field === ref.field
    );
    if (!duplicate) {
      existing.push(ref);
      urlMap.set(trimmed, existing);
    }
  }

  function parseGalleryImages(raw: string | null | undefined, type: string, id: number, title: string) {
    if (!raw || typeof raw !== "string") return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((u, i) => {
          recordRef(u, { type, id, title, field: `Gallery Image ${i + 1}` });
        });
        return;
      }
    } catch {
      // maybe comma-separated
    }
    raw.split(",").forEach((u, i) => {
      recordRef(u.trim(), { type, id, title, field: `Gallery Image ${i + 1}` });
    });
  }

  const [destinations, packages, journals, itineraries, categories] = await Promise.all([
    DestinationModel.find().lean(),
    PackageModel.find().lean(),
    JournalPostModel.find().lean(),
    ItineraryModel.find().lean(),
    TravelCategoryModel.find().lean(),
  ]);

  for (const dest of destinations) {
    recordRef(dest.imageUrl, {
      type: "destination",
      id: dest.id,
      title: dest.name,
      field: "Cover Image",
    });
    parseGalleryImages(dest.galleryImages, "destination", dest.id, dest.name);
  }

  for (const pkg of packages) {
    recordRef(pkg.heroImageUrl, {
      type: "package",
      id: pkg.id,
      title: pkg.name,
      field: "Hero Image",
    });
    parseGalleryImages(pkg.galleryImages, "package", pkg.id, pkg.name);
  }

  for (const j of journals) {
    recordRef(j.imageUrl, {
      type: "journal",
      id: j.id,
      title: j.title,
      field: "Cover Image",
    });
    recordRef(j.authorImageUrl, {
      type: "journal",
      id: j.id,
      title: j.title,
      field: "Author Photo",
    });
  }

  for (const itin of itineraries) {
    recordRef(itin.coverImageUrl, {
      type: "itinerary",
      id: itin.id,
      title: itin.title,
      field: "Cover Photo",
    });
    if (itin.days && typeof itin.days === "string") {
      try {
        const days = JSON.parse(itin.days);
        if (Array.isArray(days)) {
          days.forEach((day: any, idx: number) => {
            const dayImg = day?.imageUrl || day?.photoUrl;
            recordRef(dayImg, {
              type: "itinerary",
              id: itin.id,
              title: `${itin.title} (Day ${day?.day || idx + 1})`,
              field: "Day Photo",
            });
          });
        }
      } catch {
        // ignore JSON parse error
      }
    }
  }

  for (const cat of categories) {
    recordRef(cat.imageUrl, {
      type: "travel-category",
      id: cat.id,
      title: cat.label,
      field: "Category Image",
    });
  }

  return urlMap;
}

router.get("/media", async (req, res, next): Promise<void> => {
  try {
    const query = ListMediaQueryParams.safeParse(req.query);
    const filterType = query.success && query.data?.type ? query.data.type : "all";

    // 1. Sync any uncatalogued files physically on disk
    await syncDiskUploads();

    // 2. Discover all content references across the platform
    const urlReferences = await collectAllContentReferences();

    // 3. Retrieve all stored media from database
    const storedMedia = await MediaModel.find().sort({ createdAt: -1 }).lean();

    const resultItems: any[] = [];
    const seenUrls = new Set<string>();

    for (const m of storedMedia) {
      seenUrls.add(m.url);
      const savedName = path.basename(m.url);
      const filePath = path.resolve(uploadsDir, savedName);
      const normalizedUploadsDir = path.resolve(uploadsDir);
      const fileExists =
        filePath.startsWith(normalizedUploadsDir + path.sep) && fs.existsSync(filePath);

      const refs = urlReferences.get(m.url) || [];

      resultItems.push({
        id: m.id,
        filename: m.filename,
        url: m.url,
        mimeType: m.mimeType,
        sizeBytes: m.sizeBytes ?? null,
        createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
        storageType: "upload",
        fileExists,
        usageCount: refs.length,
        references: refs,
      });
    }

    // 4. Check for referenced uploaded files that may be missing from the Media collection
    for (const [url, refs] of urlReferences.entries()) {
      if (url.startsWith("/api/media/files/") && !seenUrls.has(url)) {
        seenUrls.add(url);
        const savedName = path.basename(url);
        const filePath = path.resolve(uploadsDir, savedName);
        const fileExists = fs.existsSync(filePath);
        resultItems.push({
          id: -(resultItems.length + 1000),
          filename: savedName,
          url,
          mimeType: "image/unknown",
          sizeBytes: null,
          createdAt: new Date().toISOString(),
          storageType: "upload",
          fileExists,
          usageCount: refs.length,
          references: refs,
        });
      }
    }

    // 5. External image references (included when filter is 'all' or 'external')
    if (filterType === "all" || filterType === "external") {
      let extId = -1;
      for (const [url, refs] of urlReferences.entries()) {
        if (!url.startsWith("/api/media/files/") && !seenUrls.has(url)) {
          seenUrls.add(url);
          let hostname = "";
          let label = "";
          try {
            const parsed = new URL(url);
            hostname = parsed.hostname;
            const pathname = parsed.pathname;
            label = path.basename(pathname) || hostname;
          } catch {
            hostname = "external";
            label = url.slice(0, 32);
          }

          const cleanFilename = label.length > 5 ? `${label} (${hostname})` : `${hostname} reference`;

          resultItems.push({
            id: extId--,
            filename: cleanFilename,
            url,
            mimeType: "image/external",
            sizeBytes: null,
            createdAt: new Date().toISOString(),
            storageType: "external",
            fileExists: true,
            usageCount: refs.length,
            references: refs,
          });
        }
      }
    }

    // Apply storageType filter if specified
    let filtered = resultItems;
    if (filterType === "uploads") {
      filtered = resultItems.filter((i) => i.storageType === "upload");
    } else if (filterType === "external") {
      filtered = resultItems.filter((i) => i.storageType === "external");
    }

    res.json(ListMediaResponse.parse(filtered));
  } catch (err) {
    next(err);
  }
});

const handleUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const declaredLength = parseInt(req.headers["content-length"] || "0", 10);
    if (declaredLength > MAX_FILE_SIZE) {
      res.status(413).json({ error: "File exceeds maximum size limit of 10MB" });
      return;
    }

    const chunks: Buffer[] = [];
    let receivedBytes = 0;
    let exceeded = false;

    for await (const chunk of req) {
      const buf = chunk as Buffer;
      receivedBytes += buf.length;
      if (receivedBytes > MAX_FILE_SIZE) {
        exceeded = true;
        break;
      }
      chunks.push(buf);
    }

    if (exceeded) {
      req.resume();
      res.status(413).json({ error: "File exceeds maximum size limit of 10MB" });
      return;
    }

    const buffer = Buffer.concat(chunks);
    if (buffer.length === 0) {
      res.status(400).json({ error: "Empty file upload is not allowed" });
      return;
    }

    const detected = detectMediaMimeType(buffer);
    if (!detected) {
      res.status(400).json({
        error: "Unsupported file type. Only valid image files (JPEG, PNG, GIF, WebP, AVIF, SVG) and web videos (MP4, WebM) are permitted.",
      });
      return;
    }

    // Sanitize user-provided filename
    const rawHeaderFilename = (req.headers["x-filename"] as string) || "";
    const baseNameOnly = rawHeaderFilename.replace(/^.*[\\\/]/, "").replace(/\0/g, "");
    const sanitizedBase = baseNameOnly.replace(/[^a-zA-Z0-9.\-_]/g, "_").trim();
    const originalFilename = sanitizedBase || `upload-${Date.now()}${detected.extension}`;

    // Generate safe, server-controlled storage filename
    const savedName = `${Date.now()}-${Math.random().toString(36).slice(2)}${detected.extension}`;
    const filePath = path.join(uploadsDir, savedName);

    fs.writeFileSync(filePath, buffer);

    const id = await getNextSequence("media");
    const media = await MediaModel.create({
      id,
      filename: originalFilename,
      url: `/api/media/files/${savedName}`,
      mimeType: detected.mimeType,
      sizeBytes: buffer.length,
      createdAt: new Date(),
    });

    res.status(201).json({
      ...media.toObject(),
      createdAt: media.createdAt.toISOString(),
      storageType: "upload",
      fileExists: true,
      usageCount: 0,
      references: [],
    });
  } catch (err) {
    next(err);
  }
};

router.post("/media/upload", handleUpload);
router.post("/media", handleUpload);

router.options("/media/files/:name", (_req, res): void => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.status(204).end();
});

router.get("/media/files/:name", (req, res): void => {
  const parsed = GetMediaFileParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const name = parsed.data.name;
  if (!name || /[^a-zA-Z0-9.\-_]/.test(name) || name.includes("..")) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }
  const filePath = path.resolve(uploadsDir, name);
  const normalizedUploadsDir = path.resolve(uploadsDir);
  if (!filePath.startsWith(normalizedUploadsDir + path.sep)) {
    res.status(400).json({ error: "Invalid filename path" });
    return;
  }
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  // Security and CORS headers to prevent MIME-sniffing or cross-origin blocking
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.sendFile(filePath);
});

router.delete("/media/:id", async (req, res): Promise<void> => {
  const params = DeleteMediaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (params.data.id < 0) {
    res.status(400).json({
      error: "External references cannot be deleted directly from the media library. Update or remove the image link in the referencing destination, package, journal article, or itinerary.",
    });
    return;
  }

  const media = await MediaModel.findOne({ id: params.data.id }).lean();
  if (!media) {
    res.status(404).json({ error: "Media not found" });
    return;
  }

  // Prevent deleting assets currently referenced anywhere across all modules
  const allRefs = await collectAllContentReferences();
  const refs = allRefs.get(media.url) || [];

  if (refs.length > 0) {
    const summary = refs
      .map((r) => `${r.type} "${r.title}" (${r.field})`)
      .slice(0, 3)
      .join(", ");
    const andMore = refs.length > 3 ? ` and ${refs.length - 3} other record(s)` : "";
    res.status(409).json({
      error: `Cannot delete asset "${media.filename}" because it is currently used in ${summary}${andMore}.`,
    });
    return;
  }

  await MediaModel.deleteOne({ id: params.data.id });

  const savedName = path.basename(media.url);
  const filePath = path.resolve(uploadsDir, savedName);
  const normalizedUploadsDir = path.resolve(uploadsDir);
  if (filePath.startsWith(normalizedUploadsDir + path.sep) && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  res.sendStatus(204);
});

export default router;
