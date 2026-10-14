import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Learn: undefined;
  Tasks: undefined;
  Progress: undefined;
  Profile: undefined;
  // Keep legacy for backward compat
  MyLearning: undefined;
  Bookmarks: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Learn: undefined;
  Tasks: undefined;
  Progress: undefined;
  Profile: undefined;
  // Legacy screens (still accessible via navigation)
  MyLearning: undefined;
  Bookmarks: undefined;
  MainTabs?: NavigatorScreenParams<MainTabParamList> | undefined;
  ClassSubjects: { classId: string };
  SubjectIndex: { classId: string; subjectId: string };
  ChapterDetails: { classId: string; subjectId: string; chapterId: string };
  SectionDetails: { classId: string; subjectId: string; chapterId: string; sectionId: string };
  Quiz: { quizId: string; classId?: string; subjectId?: string; chapterId?: string };
  QuizResult: {
    quizId: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    timeTaken: number;
    passed: boolean;
  };
  Notifications: undefined;
  NotificationDetail: { notificationId: string };
  ExamSchedule: undefined;
  ExamResults: undefined;
};
