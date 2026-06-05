export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'other';

export interface MediaSource {
  url: string;
  mimeType: string;
  quality?: string; // e.g. 1080p, 720p, high, low
}

export interface TextTrack {
  src: string;
  srclang: string;
  label: string;
  kind: 'subtitles' | 'captions' | 'descriptions';
}

export interface MediaAssetContract {
  id: string;
  type: MediaType;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  sources: MediaSource[];
  tracks?: TextTrack[];
  durationSeconds?: number | null;
  fileSizeBytes?: number | null;
}
