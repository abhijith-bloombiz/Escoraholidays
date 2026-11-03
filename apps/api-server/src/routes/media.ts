import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
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
import { logger } from "../lib/logger";

const router: IRouter = Router();

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit for videos and images

export interface StorageConfig {
  uploadsDir: string;
  defaultUploadsDir: string;
  source: "RAILWAY_VOLUME_MOUNT_PATH" | "UPLOADS_DIR" | "default";
  isVolume: boolean;
}

/**
 * Resolves the uploads directory with priority:
 * 1. RAILWAY_VOLUME_MOUNT_PATH (Railway persistent volume)
 * 2. UPLOADS_DIR (Local dev or custom container mount)
 * 3. Default fallback: apps/api-server/uploads
 *
 * Absolute paths are preserved as-is and never resolved relative to workspaceRoot.
 */
function findWorkspaceRoot(): string {
  let curr = path.resolve(process.cwd());
  while (true) {
    if (fs.existsSync(path.join(curr, "pnpm-workspace.yaml"))) {
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  try {
    const fileDir = typeof __dirname !== "undefined"
      ? __dirname
      : path.dirname(fileURLToPath(import.meta.url));
    curr = path.resolve(fileDir);
    while (true) {
      if (fs.existsSync(path.join(curr, "pnpm-workspace.yaml"))) {
        return curr;
      }
      const parent = path.dirname(curr);
      if (parent === curr) break;
      curr = parent;
    }
  } catch {}
  return process.cwd();
}

export function resolveUploadsDirectory(): StorageConfig {
  const workspaceRoot = findWorkspaceRoot();

  const defaultUploadsDir = path.resolve(workspaceRoot, "apps/api-server/uploads");

  const railwayMount =
    process.env.RAILWAY_VOLUME_MOUNT_PATH?.trim() ||
    (Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_ID) && fs.existsSync("/data") ? "/data" : undefined);
  const envUploads = process.env.UPLOADS_DIR?.trim();

  // Priority 1: Railway persistent volume mount path
  if (railwayMount) {
    const uploadsDir = path.isAbsolute(railwayMount)
      ? path.normalize(railwayMount)
      : path.resolve(workspaceRoot, railwayMount);
    return {
      uploadsDir,
      defaultUploadsDir,
      source: "RAILWAY_VOLUME_MOUNT_PATH",
      isVolume: true,
    };
  }

  // Priority 2: Custom UPLOADS_DIR configuration (e.g., local development)
  if (envUploads) {
    const uploadsDir = path.isAbsolute(envUploads)
      ? path.normalize(envUploads)
      : path.resolve(workspaceRoot, envUploads);
    return {
      uploadsDir,
      defaultUploadsDir,
      source: "UPLOADS_DIR",
      isVolume: false,
    };
  }

  // Priority 3: Default workspace uploads directory
  return {
    uploadsDir: defaultUploadsDir,
    defaultUploadsDir,
    source: "default",
    isVolume: false,
  };
}

/**
 * Verifies that the persistent storage directory exists and is writable.
 */
export function checkUploadsDirectoryWritable(dirPath: string): { writable: boolean; error?: string } {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.accessSync(dirPath, fs.constants.R_OK | fs.constants.W_OK);
    // Probe actual disk write
    const probeFile = path.join(dirPath, `.write-probe-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.writeFileSync(probeFile, "probe");
    fs.unlinkSync(probeFile);
    return { writable: true };
  } catch (err: any) {
    return { writable: false, error: err?.message || String(err) };
  }
}

/**
 * Safely copies any bundled uploads from the application package into the
 * persistent volume if they are not already present. This ensures zero data loss
 * or missing stock images when a fresh volume is first mounted on Railway.
 */
export function syncLegacyFilesToVolume(): { copied: number; skipped: number; errors: number } {
  const { uploadsDir, defaultUploadsDir } = resolveUploadsDirectory();
  if (uploadsDir === defaultUploadsDir || !fs.existsSync(defaultUploadsDir)) {
    return { copied: 0, skipped: 0, errors: 0 };
  }

  let copied = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const files = fs.readdirSync(defaultUploadsDir);
    for (const file of files) {
      if (file.startsWith(".") || file.includes("..")) continue;
      const srcFile = path.join(defaultUploadsDir, file);
      const dstFile = path.join(uploadsDir, file);
      try {
        const stat = fs.statSync(srcFile);
        if (!stat.isFile()) continue;
        if (fs.existsSync(dstFile)) {
          skipped++;
          continue;
        }
        fs.copyFileSync(srcFile, dstFile);
        copied++;
      } catch (err: any) {
        errors++;
        logger.warn({ file, error: err?.message }, "[media] Failed to copy legacy file to volume");
      }
    }
    if (copied > 0) {
      logger.info(
        { copied, skipped, errors, target: uploadsDir },
        "[media] Successfully auto-seeded legacy bundled uploads into persistent volume"
      );
    }
  } catch (err: any) {
    logger.warn({ error: err?.message }, "[media] Failed to scan default uploads directory for auto-seed");
  }

  return { copied, skipped, errors };
}

/**
 * Initializes the media storage subsystem on startup and logs the resolved directory and status.
 */
export function initMediaStorage(): StorageConfig {
  const config = resolveUploadsDirectory();
  const { uploadsDir, defaultUploadsDir, source } = config;

  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (err: any) {
    logger.error(
      { uploadsDir, source, error: err?.message },
      "[media] Failed to create uploads directory on initialization"
    );
  }

  const probe = checkUploadsDirectoryWritable(uploadsDir);
  if (!probe.writable) {
    logger.error(
      { uploadsDir, source, error: probe.error },
      `[media] Persistent storage directory (${uploadsDir}) is NOT WRITABLE or UNAVAILABLE!`
    );
  } else {
    logger.info(
      { uploadsDir, source, defaultUploadsDir },
      `[media] Upload storage directory initialized successfully from ${source}: ${uploadsDir}`
    );
  }

  // Non-destructive copy of any legacy bundled files to the persistent volume
  if (probe.writable) {
    syncLegacyFilesToVolume();
  }

  return config;
}

// Module-level initial check ensuring directory exists upon import
initMediaStorage();

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
  const { uploadsDir, defaultUploadsDir } = resolveUploadsDirectory();
  const dirs = [uploadsDir];
  if (defaultUploadsDir !== uploadsDir && fs.existsSync(defaultUploadsDir)) {
    dirs.push(defaultUploadsDir);
  }

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const filename of files) {
        if (filename.startsWith(".") || filename.includes("..")) continue;
        const fileUrl = `/api/media/files/${filename}`;
        const existing = await MediaModel.findOne({ url: fileUrl }).lean();
        if (!existing) {
          const fullPath = path.join(dir, filename);
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
      logger.warn({ dir, err: err instanceof Error ? err.message : String(err) }, "[media] Error syncing disk uploads");
    }
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
    const { uploadsDir, defaultUploadsDir } = resolveUploadsDirectory();
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
      let fileExists =
        filePath.startsWith(normalizedUploadsDir + path.sep) && fs.existsSync(filePath);

      if (!fileExists && defaultUploadsDir !== uploadsDir) {
        const legacyPath = path.resolve(defaultUploadsDir, savedName);
        const normalizedDefaultDir = path.resolve(defaultUploadsDir);
        if (
          legacyPath.startsWith(normalizedDefaultDir + path.sep) &&
          fs.existsSync(legacyPath)
        ) {
          fileExists = true;
        }
      }

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
        let fileExists = fs.existsSync(filePath);
        if (!fileExists && defaultUploadsDir !== uploadsDir) {
          const legacyPath = path.resolve(defaultUploadsDir, savedName);
          if (fs.existsSync(legacyPath)) {
            fileExists = true;
          }
        }
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
    const { uploadsDir } = resolveUploadsDirectory();
    const declaredLength = parseInt(req.headers["content-length"] || "0", 10);
    if (declaredLength > MAX_FILE_SIZE) {
      res.status(413).json({ error: "File exceeds maximum size limit of 100MB" });
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
      res.status(413).json({ error: "File exceeds maximum size limit of 100MB" });
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

    // Sanitize user-provided filename safely supporting URL-encoded Unicode filenames
    let rawHeaderFilename = (req.headers["x-filename"] as string) || "";
    try {
      rawHeaderFilename = decodeURIComponent(rawHeaderFilename);
    } catch {
      // already plain text or invalid encoding
    }
    const baseNameOnly = rawHeaderFilename.replace(/^.*[\\\/]/, "").replace(/\0/g, "");
    const sanitizedBase = baseNameOnly.replace(/[^a-zA-Z0-9.\-_]/g, "_").trim();
    const originalFilename = sanitizedBase || `upload-${Date.now()}${detected.extension}`;

    // Generate safe, server-controlled storage filename
    const savedName = `${Date.now()}-${Math.random().toString(36).slice(2)}${detected.extension}`;
    const filePath = path.join(uploadsDir, savedName);

    // Verify directory exists and is writable with graceful error handling
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(filePath, buffer);
    } catch (writeErr: any) {
      logger.error(
        { filePath, uploadsDir, error: writeErr?.message },
        "[media] Persistent volume storage write failure"
      );
      res.status(500).json({
        error: "Persistent file storage is currently unavailable or not writable. Please check volume mount and permissions.",
      });
      return;
    }

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
  const { uploadsDir, defaultUploadsDir } = resolveUploadsDirectory();
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
  let filePath = path.resolve(uploadsDir, name);
  const normalizedUploadsDir = path.resolve(uploadsDir);
  if (!filePath.startsWith(normalizedUploadsDir + path.sep)) {
    res.status(400).json({ error: "Invalid filename path" });
    return;
  }

  // Fallback to bundled legacy uploads if file is not found in volume directory
  if (!fs.existsSync(filePath) && defaultUploadsDir !== uploadsDir) {
    const legacyPath = path.resolve(defaultUploadsDir, name);
    const normalizedDefaultDir = path.resolve(defaultUploadsDir);
    if (
      legacyPath.startsWith(normalizedDefaultDir + path.sep) &&
      fs.existsSync(legacyPath)
    ) {
      filePath = legacyPath;
    }
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
  if (name.endsWith(".heic") || name.endsWith(".heif")) {
    res.setHeader("Content-Type", "image/heic");
  } else if (name.endsWith(".webp")) {
    res.setHeader("Content-Type", "image/webp");
  } else if (name.endsWith(".avif")) {
    res.setHeader("Content-Type", "image/avif");
  }
  res.sendFile(filePath, (err) => {
    if (err && !res.headersSent) {
      logger.error({ filePath, name, error: err.message }, "[media] Error delivering media file");
      res.status(500).json({ error: "Failed to deliver media file" });
    }
  });
});

router.delete("/media/:id", async (req, res): Promise<void> => {
  const { uploadsDir, defaultUploadsDir } = resolveUploadsDirectory();
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
    try {
      fs.unlinkSync(filePath);
    } catch (err: any) {
      logger.warn({ filePath, err: err?.message }, "[media] Failed to unlink file from persistent volume");
    }
  }

  if (defaultUploadsDir !== uploadsDir) {
    const legacyPath = path.resolve(defaultUploadsDir, savedName);
    const normalizedDefault = path.resolve(defaultUploadsDir);
    if (legacyPath.startsWith(normalizedDefault + path.sep) && fs.existsSync(legacyPath)) {
      try {
        fs.unlinkSync(legacyPath);
      } catch (err: any) {
        logger.warn({ legacyPath, err: err?.message }, "[media] Failed to unlink file from legacy default uploads");
      }
    }
  }

  res.sendStatus(204);
});

export default router;
