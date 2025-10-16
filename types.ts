export enum GameState {
  CLASS_SELECTION,
  TOPIC_SELECTION,
  PLAYING,
  FINISHED,
  REVIEW,
}

export interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export enum Subject {
  PHYSICS = "Vật Lý",
  CHEMISTRY = "Hóa Học",
  BIOLOGY = "Sinh Học",
}

export enum GameMode {
    PRACTICE = "Luyện tập",
    COMPETITION = "Thi đấu",
    HSG = "HSG",
    ONE_VS_ONE = "1 VS 1",
    TEAM = "Đồng đội",
}

export enum DifficultyLevel {
    EASY = "Dễ",
    MEDIUM = "Trung bình",
    HARD = "Khó",
    VERY_HARD = "Rất khó",
}

export enum QuestionFormat {
    MULTIPLE_CHOICE = "Trắc nghiệm nhiều lựa chọn",
    TRUE_FALSE = "Trắc nghiệm đúng sai",
    FILL_IN_THE_BLANK = "Điền vào chỗ trống",
}

export interface UserAnswer {
    question: Question;
    selectedAnswerIndex: number | null; // null if timed out
    isCorrect: boolean;
}

export interface CompetitionResult {
    name: string;
    score: number;
    time: number;
}