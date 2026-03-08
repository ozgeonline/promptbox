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

export interface Profile {
  id: string;
  username: string | null;
  birthdate: string | null;
  created_at?: string;
}

export interface Comment {
  id: string;
  prompt_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile | null;
}
