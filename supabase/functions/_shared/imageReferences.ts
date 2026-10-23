export const DEFAULT_IMAGE_URL =
  'https://9gdj1dewg7.ufs.sh/f/MzCIEEnlPGFDqLuejTAO6xTMuqHPGhbIk5NKF8ARWaVQnU1J';

const DEFAULT_FILE_KEY = 'MzCIEEnlPGFDqLuejTAO6xTMuqHPGhbIk5NKF8ARWaVQnU1J';

export type ImageReference =
  | { provider: 'uploadthing'; key: string }
  | { provider: 'supabase'; key: string };

// Only recognize supported providers. Never send arbitrary image URLs to a server.
export function getImageReference(image: string | null | undefined, projectUrl: string): ImageReference | null {
  if (!image) return null;
  try {
    const url = new URL(image);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const uploadthingHost = /^[a-z0-9-]+\.ufs\.sh$/.test(url.hostname)
      || url.hostname === 'utfs.io' || url.hostname === 'uploadthing.com';
    if (uploadthingHost) {
      const match = /^\/f\/([A-Za-z0-9_.-]+)$/.exec(url.pathname);
      if (!match || match[1] === DEFAULT_FILE_KEY) return null;
      return { provider: 'uploadthing', key: match[1] };
    }
    const prefix = '/storage/v1/object/public/prompt-images/';
    if (url.origin !== new URL(projectUrl).origin || !url.pathname.startsWith(prefix)) return null;
    const key = decodeURIComponent(url.pathname.slice(prefix.length));
    if (!key || key.includes('\\') || key.split('/').some(part => !part || part === '.' || part === '..')) return null;
    return { provider: 'supabase', key };
  } catch {
    return null;
  }
}

export function sameImage(a: ImageReference | null, b: ImageReference | null): boolean {
  return Boolean(a && b && a.provider === b.provider && a.key === b.key);
}
