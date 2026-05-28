import { useEffect } from "react";

/**
 * Per-route SEO helper for a Vite SPA. Sets the document title and a handful
 * of head tags that Google reads for each crawled URL. Vite's static index.html
 * provides the baseline; this hook overrides per route at runtime.
 *
 * The hook updates:
 *   <title>
 *   <meta name="description">
 *   <link rel="canonical">
 *   <meta property="og:title">
 *   <meta property="og:description">
 *   <meta property="og:url">
 *
 * On unmount, the hook restores the previous values so back-navigation does
 * not leave a stale title.
 */
export interface DocumentMeta {
  /** Full <title> for this route. Keep under 60 characters for SERP display. */
  title: string;
  /** Meta description. Keep between 120 and 160 characters for SERP display. */
  description: string;
  /** Canonical URL relative to the site root, e.g. "/constituency/GBA-1". */
  path: string;
}

const SITE = "https://www.gbelections.com";

function ensureMeta(name: string, content: string, attribute: "name" | "property" = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${name}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attribute, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  return el;
}

function ensureCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  return el;
}

export function useDocumentMeta({ title, description, path }: DocumentMeta) {
  useEffect(() => {
    const prev = {
      title: document.title,
      description:
        document.head
          .querySelector<HTMLMetaElement>('meta[name="description"]')
          ?.getAttribute("content") ?? "",
      canonical:
        document.head
          .querySelector<HTMLLinkElement>('link[rel="canonical"]')
          ?.getAttribute("href") ?? `${SITE}/`,
      ogTitle:
        document.head
          .querySelector<HTMLMetaElement>('meta[property="og:title"]')
          ?.getAttribute("content") ?? "",
      ogDescription:
        document.head
          .querySelector<HTMLMetaElement>('meta[property="og:description"]')
          ?.getAttribute("content") ?? "",
      ogUrl:
        document.head
          .querySelector<HTMLMetaElement>('meta[property="og:url"]')
          ?.getAttribute("content") ?? `${SITE}/`,
    };

    const canonical = `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
    document.title = title;
    ensureMeta("description", description);
    ensureCanonical(canonical);
    ensureMeta("og:title", title, "property");
    ensureMeta("og:description", description, "property");
    ensureMeta("og:url", canonical, "property");

    return () => {
      document.title = prev.title;
      ensureMeta("description", prev.description);
      ensureCanonical(prev.canonical);
      ensureMeta("og:title", prev.ogTitle, "property");
      ensureMeta("og:description", prev.ogDescription, "property");
      ensureMeta("og:url", prev.ogUrl, "property");
    };
  }, [title, description, path]);
}
