export interface ReviewItem {
  id: number;
  english: string;
  chinese: string;
  type: 'phrase' | 'usage';
}

export interface User {
  username: string;
  score: number;
  streak: number;
  bestStreak: number;
  avatarId: number;
  mistakes: number[]; // Array of ReviewItem IDs that the user got wrong
}

export interface Question {
  type: 'multiple-choice';
  reviewId: number; // The ID of the original ReviewItem
  questionText: string;
  contextSentence: string; // The sentence with the blank
  fullSentence: string; // The complete correct sentence for TTS
  targetAnswer: string;
  options: string[]; // 4 options including the answer
  hint: string;
}

export interface LeaderboardEntry {
  username: string;
  score: number;
  date: string;
  avatarId: number;
}