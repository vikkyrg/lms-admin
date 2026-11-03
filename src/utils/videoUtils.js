/**
 * Helper to resolve media URLs (images, uploads, videos) against backend host or CDN
 */
export const resolveMediaUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed) || /^blob:/i.test(trimmed)) {
    return trimmed;
  }
  const mediaOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/api\/v1\/?$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${mediaOrigin}${cleanPath}`;
};

/**
 * Converts any YouTube URL variant (watch, short, embed) into an embed URL
 */
export const getEmbedVideoUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();

  // YouTube match
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
  }

  // Vimeo match
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  return resolveMediaUrl(trimmed);
};

export const isEmbedVideo = (url) => {
  if (!url) return false;
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
};

