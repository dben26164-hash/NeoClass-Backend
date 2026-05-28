export type ImportParseResult = {
  gradeLevel?: string;
  subject?: string;
  chapters: ParsedChapter[];
};

export type ParsedChapter = {
  title: string;
  lessons: ParsedLesson[];
};

export type ParsedLesson = {
  title: string;
  subtitle?: string;
  objectives: string[];
  content: string;
  exercises: string[];
  quizItems: string[];
  resources: string[];
};

export type DocumentImportResult = {
  gradeLevel: string;
  subject: string;
  curriculumName: string;
  parseResult: ImportParseResult;
};
