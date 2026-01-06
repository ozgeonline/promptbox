export interface Folder {
  id: string;
  name: string;
  userId?: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  folderId: string;
  image?: string;
  createdAt: number;
  userId?: string;
  isPublic: boolean;
  folders?: {
    id: string;
    name: string;
  } | null;
}

export type ViewMode = 'grid' | 'list';
