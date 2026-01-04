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
  image?: string; // Base64 string for the example image
  createdAt: number;
  userId?: string;
  isPublic: boolean;
}

export type ViewMode = 'grid' | 'list';
