export interface DailyPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  caption: string | null;
  taken_at: string;
  created_at: string;
}

export interface MemoryCardData {
  id: string;
  date: string;
  title: string;
  note: string;
  mood: string;
  tags: string[];
  photo: string;
}