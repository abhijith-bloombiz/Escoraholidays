import { useEffect } from "react";

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown>;
}

const SITE_NAME = "Escora";
const DEFAULT_DESCRIPTION =
  "Escora is a boutique destination management studio crafting private journeys through Kerala for travellers who seek meaning over itineraries.";
const DEFAULT_IMAGE = "https://www.escoraholidays.com/opengraph.jpg";

export function useSeo({ title, description, image, url, type = "website", jsonLd }: SeoProps = {}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Private Kerala Journeys for Discerning Travellers`;
  const metaDesc = description ?? DEFAULT_DESCRIPTION;
  const metaImg = image ?? DEFAULT_IMAGE;
  const metaUrl = url ?? (typeof window !== "undefined" ? window.location.href : "https://www.escoraholidays.com");

  useEffect(() => {
    document.title = fullTitle;

    function setMeta(name: string, content: string, attr = "name") {
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    }

    function setCanonical(href: string) {
      let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!el) {
        el = document.createElement("link");
        el.rel = "canonical";
        document.head.appendChild(el);
      }
      el.href = href;
    }

    setMeta("description", metaDesc);
    setCanonical(metaUrl);

    // Open Graph
    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", metaDesc, "property");
    setMeta("og:image", metaImg, "property");
    setMeta("og:image:alt", `${title ?? SITE_NAME} — Escora`, "property");
    setMeta("og:url", metaUrl, "property");
    setMeta("og:type", type, "property");
    setMeta("og:site_name", SITE_NAME, "property");

    // Twitter
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", metaDesc);
    setMeta("twitter:image", metaImg);

    // JSON-LD
    if (jsonLd) {
      const id = "seo-json-ld";
      let script = document.getElementById(id) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = id;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    }
  }, [fullTitle, metaDesc, metaImg, metaUrl, type, jsonLd]);
}
