export interface Movie {
  title: string;
  year: number;
  summary: string;
  genres: string[];
  posterUrl: string;
  youtubeVideoId: string | null;
}