import { useEffect } from 'react';

export const SITE_URL = 'https://estate.flowcheq.com';
export const SITE_NAME = 'Flowcheq Estate';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export interface SeoOptions {
  /** Page title. " | Flowcheq Estate" is appended automatically unless includeSiteName is false. */
  title?: string;
  description?: string;
  /** Absolute URL or path (e.g. "/house/123"). Used for canonical + og:url. */
  url?: string;
  /** Absolute URL or path to an image. Falls back to the branded OG banner. */
  image?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  keywords?: string;
  noindex?: boolean;
  includeSiteName?: boolean;
}

const toAbsolute = (value: string | undefined, fallbackPath = true) => {
  if (!value) {
    return fallbackPath ? `${SITE_URL}${window.location.pathname}` : undefined;
  }
  if (value.startsWith('http')) return value;
  return `${SITE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
};

const upsertMeta = (attr: 'name' | 'property', key: string, content?: string) => {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

/**
 * Dependency-free per-page SEO. Sets <title>, description, canonical and the
 * Open Graph / Twitter tags. Social scrapers (WhatsApp/Facebook/LinkedIn/X) read the
 * static tags in index.html, while search engines that render JS pick up these
 * per-page values for unique titles/descriptions.
 */
export function useSeo(options: SeoOptions) {
  const {
    title,
    description,
    url,
    image,
    type = 'website',
    keywords,
    noindex,
    includeSiteName = true,
  } = options;

  useEffect(() => {
    const fullTitle = title
      ? includeSiteName
        ? `${title} | ${SITE_NAME}`
        : title
      : document.title;
    document.title = fullTitle;

    const absUrl = toAbsolute(url) as string;
    const absImg = toAbsolute(image, false) || DEFAULT_OG_IMAGE;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'keywords', keywords);

    upsertMeta('property', 'og:title', title ? fullTitle : undefined);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:url', absUrl);
    upsertMeta('property', 'og:image', absImg);
    upsertMeta('property', 'og:image:secure_url', absImg);
    upsertMeta('property', 'og:site_name', SITE_NAME);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title ? fullTitle : undefined);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', absImg);

    upsertMeta(
      'name',
      'robots',
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1',
    );

    upsertLink('canonical', absUrl);
  }, [title, description, url, image, type, keywords, noindex, includeSiteName]);
}
