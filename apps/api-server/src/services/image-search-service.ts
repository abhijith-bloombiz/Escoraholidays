import { config } from "../config/env";
import { logger } from "../lib/logger";
import {
  getStockPhotosForDay,
  getStockCoverPhoto,
  identifyStockCategory,
} from "./stock-photos";

interface CacheEntry {
  urls: string[];
  timestamp: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache
const photoCache = new Map<string, CacheEntry>();

/**
 * Filter out non-photo files from search results (e.g., SVG flags, coats of arms, map icons).
 */
function isEligiblePhotoUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  if (lower.endsWith(".svg")) return false;
  if (lower.includes("flag_of_") || lower.includes("coat_of_arms") || lower.includes("emblem")) return false;
  if (lower.includes("commons-logo") || lower.includes("wiki_logo")) return false;
  return lower.startsWith("http://") || lower.startsWith("https://");
}

export class ImageSearchService {
  /**
   * Search for high-quality, verified landscape travel photos matching a query.
   * Uses Unsplash (if key configured) -> Pexels (if key configured) -> Wikimedia Commons Search -> Curated Stock Library.
   *
   * ALWAYS returns `count` valid, high-resolution direct image URLs (never empty or local relative paths).
   *
   * @param query Search keywords (e.g. "Munnar tea plantation misty morning", "Alleppey backwaters luxury houseboat")
   * @param count Number of photo URLs to return (1 to 3)
   * @param fallbackUrl Optional fallback URL to return if no photo is found
   * @param dayIndex Day index used to cycle distinct photos across days
   */
  async searchPhotos(
    query: string,
    count = 1,
    fallbackUrl = "",
    dayIndex = 0
  ): Promise<string[]> {
    const cleanQuery = query.trim().replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ");
    const cacheKey = `${cleanQuery.toLowerCase()}_${count}_${dayIndex}`;
    const cached = photoCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.urls;
    }

    let results: string[] = [];

    // 1. Unsplash API (if configured)
    if (config.unsplashAccessKey && cleanQuery) {
      try {
        results = await this.queryUnsplash(cleanQuery, count);
      } catch (err: any) {
        logger.warn({ query: cleanQuery, error: err?.message }, "[ImageSearchService] Unsplash search failed, falling back");
      }
    }

    // 2. Pexels API (if configured and no Unsplash results)
    if (results.length === 0 && config.pexelsApiKey && cleanQuery) {
      try {
        results = await this.queryPexels(cleanQuery, count);
      } catch (err: any) {
        logger.warn({ query: cleanQuery, error: err?.message }, "[ImageSearchService] Pexels search failed, falling back");
      }
    }

    // 3. Wikimedia Commons Open Knowledge Search
    if (results.length === 0 && cleanQuery) {
      try {
        results = await this.queryWikimedia(cleanQuery, count);
      } catch (err: any) {
        logger.warn({ query: cleanQuery, error: err?.message }, "[ImageSearchService] Wikimedia search failed, using stock catalog");
      }
    }

    // 4. Fill any remaining slots up to `count` from our curated Unsplash Stock Photo library!
    // This GUARANTEES that every day has `count` (e.g. 3) matching, magnificent photos!
    if (results.length < count) {
      const stockPhotos = getStockPhotosForDay(cleanQuery || fallbackUrl, count, dayIndex);
      for (const stockUrl of stockPhotos) {
        if (!results.includes(stockUrl)) {
          results.push(stockUrl);
          if (results.length >= count) break;
        }
      }
    }

    // If still short and a valid external fallback was provided, include it
    if (results.length === 0 && fallbackUrl && fallbackUrl.startsWith("http")) {
      results.push(fallbackUrl);
    }

    // Ultimate safeguard: default slow luxury stock photo
    if (results.length === 0) {
      results = [getStockCoverPhoto(cleanQuery)];
    }

    photoCache.set(cacheKey, { urls: results, timestamp: Date.now() });
    return results;
  }

  /**
   * Convenience method to fetch a single matching photo URL.
   */
  async searchSinglePhoto(query: string, fallbackUrl = ""): Promise<string> {
    const photos = await this.searchPhotos(query, 1, fallbackUrl);
    return photos[0] || getStockCoverPhoto(query);
  }

  private async queryUnsplash(query: string, count: number): Promise<string[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=${count}&content_filter=high`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Client-ID ${config.unsplashAccessKey}`,
          "Accept-Version": "v1",
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        return [];
      }

      const data: any = await res.json();
      if (!Array.isArray(data?.results)) {
        return [];
      }

      return data.results
        .map((r: any) => r?.urls?.regular || r?.urls?.small)
        .filter(isEligiblePhotoUrl)
        .slice(0, count);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async queryPexels(query: string, count: number): Promise<string[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    try {
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=${count}`;
      const res = await fetch(url, {
        headers: {
          Authorization: config.pexelsApiKey!,
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        return [];
      }

      const data: any = await res.json();
      if (!Array.isArray(data?.photos)) {
        return [];
      }

      return data.photos
        .map((p: any) => p?.src?.large || p?.src?.medium)
        .filter(isEligiblePhotoUrl)
        .slice(0, count);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async queryWikimedia(query: string, count: number): Promise<string[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    try {
      const searchTerms = query.toLowerCase().includes("kerala") ? query : `${query} Kerala`;
      const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchTerms)}&gsrlimit=${Math.max(count * 3, 6)}&prop=pageimages&piprop=original|thumbnail&pithumbsize=1200&format=json`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "EscoraHolidays/1.0 (contact@escoraholidays.com)",
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        return [];
      }

      const data: any = await res.json();
      let pages = data?.query?.pages ? Object.values(data.query.pages) : [];

      // If specific search had 0 pages, try with extracted destination keyword
      if (pages.length === 0) {
        const cat = identifyStockCategory(query);
        if (cat && cat !== "default") {
          const fallbackUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(`${cat} Kerala`)}&gsrlimit=6&prop=pageimages&piprop=original|thumbnail&pithumbsize=1200&format=json`;
          const fallbackRes = await fetch(fallbackUrl, {
            headers: { "User-Agent": "EscoraHolidays/1.0 (contact@escoraholidays.com)" },
            signal: controller.signal,
          });
          if (fallbackRes.ok) {
            const fallbackData: any = await fallbackRes.json();
            pages = fallbackData?.query?.pages ? Object.values(fallbackData.query.pages) : [];
          }
        }
      }

      const urls: string[] = [];
      for (const page of pages as any[]) {
        const imgUrl = page?.original?.source || page?.thumbnail?.source;
        if (imgUrl && isEligiblePhotoUrl(imgUrl)) {
          urls.push(imgUrl);
          if (urls.length >= count) break;
        }
      }

      return urls;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const imageSearchService = new ImageSearchService();
