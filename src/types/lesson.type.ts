export type LessonCategory = 'Safety' | 'Catching' | 'FirstAid';

export interface LessonItem {
  id: string;
  title: string;
  content: string;
  category: LessonCategory | string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonUpsertPayload {
  title: string;
  content: string;
  category: LessonCategory;
  isPublished: boolean;
}
