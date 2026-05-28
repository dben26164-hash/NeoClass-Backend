import { ParsedLesson } from '../types';

type GeneratedQuizQuestion = {
  prompt: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points?: number;
  order?: number;
};

type GeneratedAIContent = {
  shortSummary: string;
  longSummary: string;
  keyPoints: string[];
  definitions: string[];
  formulas: string[];
  examples: string[];
  keywords: string[];
  flashcards: { question: string; answer: string }[];
  quizQuestions: GeneratedQuizQuestion[];
};

export function generateAIContent(lesson: ParsedLesson): GeneratedAIContent {
  const text = [lesson.title, lesson.subtitle, lesson.content, lesson.objectives.join('. ')].filter(Boolean).join(' ');
  const keyPoints = lesson.objectives.length ? lesson.objectives : extractKeyPointsFromText(text);
  const definitions = extractDefinitionsFromText(text);
  const formulas = extractFormulas(text);
  const examples = extractExamples(text);
  const keywords = extractKeywords(lesson);
  const flashcards = generateFlashcards(lesson, definitions);
  const quizQuestions = generateQuizQuestions(lesson, keyPoints, definitions, examples);

  return {
    shortSummary: generateShortSummary(lesson),
    longSummary: generateLongSummary(lesson),
    keyPoints,
    definitions,
    formulas,
    examples,
    keywords,
    flashcards,
    quizQuestions
  };
}

function generateShortSummary(lesson: ParsedLesson): string {
  const sentences = extractSentences(lesson.content);
  const summary = sentences.slice(0, 4).join(' ');
  return summary || `Résumé rapide disponible pour la leçon ${lesson.title}.`;
}

function generateLongSummary(lesson: ParsedLesson): string {
  const objectives = lesson.objectives.map((obj) => `- ${obj}`).join('\n');
  const content = lesson.content || '';
  return `Objectifs :\n${objectives}\n\nContenu :\n${content}`;
}

function extractSentences(text: string): string[] {
  return text
    .split(/[\.\!\?]\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 10);
}

function extractKeyPointsFromText(text: string): string[] {
  const candidates = new Set<string>();
  extractSentences(text)
    .filter((sentence) => sentence.length < 120)
    .slice(0, 10)
    .forEach((sentence) => candidates.add(sentence));
  return Array.from(candidates).slice(0, 10);
}

function extractDefinitionsFromText(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /\b(définition|désigne|sont|est|signifie)\b/i.test(line))
    .slice(0, 6);
}

function extractFormulas(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /[=×÷\+\-]/.test(line) || /\b(formule|équation|ratio|pourcentage)\b/i.test(line))
    .slice(0, 6);
}

function extractExamples(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /\b(exemple|par exemple|exemples)\b/i.test(line))
    .slice(0, 6);
}

function extractKeywords(lesson: ParsedLesson): string[] {
  const tokens = [lesson.title, lesson.subtitle, ...lesson.objectives, lesson.content]
    .join(' ')
    .toLowerCase()
    .replace(/[^\p{L}\d\s]+/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 3 && token.length < 20);
  return Array.from(new Set(tokens)).slice(0, 15);
}

function generateFlashcards(lesson: ParsedLesson, definitions: string[]): { question: string; answer: string }[] {
  const cards: { question: string; answer: string }[] = [];
  lesson.objectives.slice(0, 5).forEach((objective) => {
    cards.push({
      question: `Quel est l'objectif: ${objective}?`,
      answer: objective
    });
  });
  definitions.slice(0, 5).forEach((definition, index) => {
    cards.push({
      question: `Expliquez le concept ${index + 1}.`,
      answer: definition
    });
  });
  return cards.slice(0, 8);
}

function generateQuizQuestions(
  lesson: ParsedLesson,
  keyPoints: string[],
  definitions: string[],
  examples: string[]
): GeneratedQuizQuestion[] {
  const questions: GeneratedQuizQuestion[] = [];

  keyPoints.slice(0, 4).forEach((point, index) => {
    questions.push({
      prompt: `Lequel des éléments suivants correspond à la notion suivante : ${point}?`,
      questionType: 'multiple_choice',
      options: [point, 'Une notion différente', 'Une règle générale', 'Un exemple lié'],
      correctAnswer: point,
      explanation: `La réponse correcte est ${point}.`,
      points: 2,
      order: index
    });
  });

  definitions.slice(0, 3).forEach((definition, index) => {
    questions.push({
      prompt: `Vrai ou faux : ${definition}`,
      questionType: 'true_false',
      options: ['Vrai', 'Faux'],
      correctAnswer: 'Vrai',
      explanation: definition,
      points: 1,
      order: questions.length
    });
  });

  examples.slice(0, 3).forEach((example, index) => {
    questions.push({
      prompt: `Décrivez brièvement cet exemple : ${example}`,
      questionType: 'short_answer',
      correctAnswer: example,
      explanation: `Réponse attendue : ${example}`,
      points: 3,
      order: questions.length
    });
  });

  while (questions.length < 10) {
    const fallback = lesson.objectives[questions.length % lesson.objectives.length] || lesson.title;
    questions.push({
      prompt: `Expliquez le concept suivant : ${fallback}`,
      questionType: 'short_answer',
      correctAnswer: fallback,
      explanation: `Contenu de référence : ${fallback}`,
      points: 2,
      order: questions.length
    });
  }

  return questions.slice(0, 15);
}

export type { GeneratedAIContent, GeneratedQuizQuestion };