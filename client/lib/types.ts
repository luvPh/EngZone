export interface McqQuestion {
  type: "mcq";
  q: string;
  options: string[];
  correct: number; // index into options
  explain?: string;
}

export interface FillQuestion {
  type: "fill";
  q: string;
  correct: string;
  explain?: string;
}

export type QuizQuestion = McqQuestion | FillQuestion;

export interface Quiz {
  questions: QuizQuestion[];
}

export interface Flashcard {
  word: string;
  ipa?: string;
  meaning: string;
  example?: string;
  note?: string;
}

export interface FlashSet {
  cards: Flashcard[];
}

export interface VocabItem {
  word: string;
  meaning: string;
  pos?: string;
  ipa?: string;
  example?: string;
}

export interface FamilyMemberItem {
  word: string;
  pos: string;
  meaning?: string;
}

export interface Essay {
  essay: string;
  vocab: VocabItem[];
  families?: { root: string; members: FamilyMemberItem[] }[];
}

export interface ExamQuestion {
  q: string;
  options: string[];
  correct: number;
  explain?: string;
}

export interface ExamSection {
  instruction: string;
  passage?: string;
  questions: ExamQuestion[];
}

export interface Exam {
  title?: string;
  sections: ExamSection[];
}
