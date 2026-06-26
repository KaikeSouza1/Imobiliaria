
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;

  const regExp = /(\?v=|&v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);

  if (match && match[2]) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }

  return null;
}
