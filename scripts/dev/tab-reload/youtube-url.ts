export const YOUTUBE_ORIGIN = "https://www.youtube.com/" as const;

export function isYouTubeUrl(url: string) {
  return url.startsWith(YOUTUBE_ORIGIN);
}
