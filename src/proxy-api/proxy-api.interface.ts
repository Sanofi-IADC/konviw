type ContentType = 'page' | 'blogpost' | 'comment' | 'attachment';

export interface KonviwContent {
  docId: string;
  title: string;
  type: ContentType;
  url: string;
  createdAt: string;
  createdAtFriendly?: string;
  createdBy: string;
  createdByAvatar: string;
  createdByEmail: string;
  labels: KonviwLabel[];
  imgblog: string;
  summary: string;
  space: string;
  lastModified: string;
  excerptBlog: string;
  body: string;
  readTime: number;
}

export interface KonviwLabel {
  tag: string;
}

export interface KonviwResults {
  meta: MetadataSearch;
  results: KonviwContent[];
}

export interface MetadataSearch {
  limit: number;
  size: number;
  totalSize: number;
  query: string;
  next: string;
  prev: string;
}

export type RadarContent = {
  name: string;
  ring: 'hold' | 'assess' | 'trial' | 'adopt';
  quadrant: 'techniques' | 'tools' | 'languages & frameworks' | 'platforms';
  isNew: 'TRUE' | 'FALSE';
  description: string;
}

export type RadarContentPeriod = {
  period: string;
} & RadarContent
