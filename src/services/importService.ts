import path from 'path';
import prisma from '../prisma';
import { ImportStatus } from '@prisma/client';
import { parseDocument } from '../parsers/documentParser';
import { parseDocumentStructure } from '../parsers/structureParser';
import { generateAIContent } from '../ai/aiGenerator';
import { slugify } from '../utils/stringUtils';

async function createImportJob(fileName: string, fileType: string) {
  return prisma.importJob.create({
    data: {
      fileName,
      fileType,
      status: ImportStatus.PENDING,
      progress: 0,
      errorCount: 0
    }
  });
}

async function logJob(jobId: string, message: string, level: string = 'info', metadata?: object) {
  await prisma.importLog.create({
    data: {
      jobId,
      level,
      message,
      metadata: metadata ? metadata : undefined
    }
  });
}

async function updateJob(jobId: string, updates: { status?: ImportStatus; progress?: number; errorCount?: number; summary?: object }) {
  return prisma.importJob.update({
    where: { id: jobId },
    data: {
      ...(updates.status ? { status: updates.status } : {}),
      ...(updates.progress !== undefined ? { progress: updates.progress } : {}),
      ...(updates.errorCount !== undefined ? { errorCount: updates.errorCount } : {}),
      ...(updates.summary ? { summary: updates.summary } : {})
    }
  });
}

async function processImportJob(jobId: string, filePath: string, fileType: 'docx' | 'pdf' | 'txt') {
  try {
    await updateJob(jobId, { status: 'PROCESSING', progress: 5 });
    await logJob(jobId, 'Starting import process');

    const rawText = await parseDocument(filePath, fileType);
    await updateJob(jobId, { progress: 15 });

    const parseResult = parseDocumentStructure(rawText);
    await logJob(jobId, 'Document parsed', 'info', { gradeLevel: parseResult.gradeLevel, subject: parseResult.subject });
    await updateJob(jobId, { progress: 30 });

    validateParseResult(parseResult);
    await updateJob(jobId, { progress: 35 });

    const school = await getCurriculumLibrarySchool();
    await updateJob(jobId, { progress: 40 });

    const curriculum = await saveCurriculumToDatabase(school.id, parseResult);
    await updateJob(jobId, { progress: 70 });

    await createSequentialDependencies(curriculum.id);
    await updateJob(jobId, { progress: 90 });

    await updateJob(jobId, {
      status: 'COMPLETED',
      progress: 100,
      summary: {
        curriculumId: curriculum.id,
        chapters: parseResult.chapters.length,
        lessons: parseResult.chapters.reduce((count, chapter) => count + chapter.lessons.length, 0)
      }
    });
    await logJob(jobId, 'Import completed successfully', 'info', { curriculumId: curriculum.id });
  } catch (error) {
    console.error('Import failed', error);
    await logJob(jobId, 'Import failed', 'error', { error: error instanceof Error ? error.message : String(error) });
    await updateJob(jobId, { status: 'FAILED', errorCount: 1, progress: 100 });
  }
}

function validateParseResult(parseResult: { gradeLevel?: string; subject?: string; chapters: unknown[] }) {
  if (!parseResult.gradeLevel || parseResult.gradeLevel === 'Niveau non détecté') {
    throw new Error('Impossible de détecter le niveau scolaire dans le document.');
  }
  if (!parseResult.subject || parseResult.subject === 'Matière inconnue') {
    throw new Error('Impossible de détecter la matière dans le document.');
  }
  if (!parseResult.chapters.length || parseResult.chapters.every((chapter) => !(chapter as { lessons: unknown[] }).lessons?.length)) {
    throw new Error('Aucun chapitre ou leçon détecté dans le document.');
  }
}

async function getCurriculumLibrarySchool() {
  return prisma.school.upsert({
    where: { code: 'GN_NATIONAL_CURRICULUM' },
    create: {
      code: 'GN_NATIONAL_CURRICULUM',
      name: 'Guinea National Curriculum Library'
    },
    update: {
      name: 'Guinea National Curriculum Library'
    }
  });
}

async function saveCurriculumToDatabase(schoolId: string, parseResult: { gradeLevel?: string; subject?: string; chapters: any[] }) {
  const assetName = `${parseResult.gradeLevel} • ${parseResult.subject}`;
  const gradeCode = slugify(parseResult.gradeLevel ?? 'grade');
  const subjectCode = slugify(parseResult.subject ?? 'subject');
  const curriculumCode = slugify(`${parseResult.gradeLevel ?? 'niveau'}-${parseResult.subject ?? 'matiere'}`);

  const gradeLevel = await prisma.gradeLevel.upsert({
    where: { schoolId_code: { schoolId, code: gradeCode } },
    create: {
      schoolId,
      code: gradeCode,
      name: parseResult.gradeLevel ?? 'Niveau inconnu',
      description: `Niveau importé pour ${parseResult.gradeLevel}`
    },
    update: {
      name: parseResult.gradeLevel ?? 'Niveau inconnu'
    }
  });

  const subject = await prisma.subject.upsert({
    where: { schoolId_code: { schoolId, code: subjectCode } },
    create: {
      schoolId,
      code: subjectCode,
      name: parseResult.subject ?? 'Matière inconnue'
    },
    update: {
      name: parseResult.subject ?? 'Matière inconnue'
    }
  });

  const curriculum = await prisma.curriculum.create({
    data: {
      schoolId,
      gradeLevelId: gradeLevel.id,
      code: curriculumCode,
      name: assetName,
      level: parseResult.gradeLevel ?? 'Niveau',
      cycle: parseResult.gradeLevel,
      description: `Curriculum importé pour ${assetName}`,
      country: 'GN',
      isPublished: true,
      subjects: {
        create: [
          {
            name: subject.name,
            code: subject.code,
            schoolId,
            chapters: {
              create: parseResult.chapters.map((chapter, chapterIndex) => ({
                title: chapter.title,
                summary: chapter.title,
                order: chapterIndex,
                lessons: {
                  create: chapter.lessons.map((lesson: any, lessonIndex: number) => {
                    const aiData = generateAIContent(lesson);
                    return {
                      title: lesson.title,
                      subtitle: lesson.subtitle,
                      description: lesson.content,
                      order: lessonIndex,
                      learningObjectives: {
                        create: lesson.objectives.map((objective: string, objectiveIndex: number) => ({
                          description: objective,
                          order: objectiveIndex
                        }))
                      },
                      lessonContents: {
                        create: lesson.content
                          .split(/\n\n|\r\n\r\n/)
                          .filter((chunk: string) => chunk.trim().length > 0)
                          .map((chunk: string, contentIndex: number) => ({
                            contentType: 'text',
                            title: contentIndex === 0 ? 'Contenu principal' : `Section ${contentIndex + 1}`,
                            body: chunk,
                            order: contentIndex
                          }))
                      },
                      exercises: {
                        create: lesson.exercises.map((exercise: string, exerciseIndex: number) => ({
                          title: `Exercice ${exerciseIndex + 1}`,
                          instructions: exercise,
                          difficulty: exerciseIndex === 0 ? 'facile' : exerciseIndex === 1 ? 'moyen' : 'difficile',
                          order: exerciseIndex
                        }))
                      },
                      aiContents: {
                        create: {
                          shortSummary: aiData.shortSummary,
                          longSummary: aiData.longSummary,
                          keyPoints: aiData.keyPoints,
                          definitions: aiData.definitions,
                          formulas: aiData.formulas,
                          examples: aiData.examples,
                          keywords: aiData.keywords,
                          generatedAt: new Date()
                        }
                      },
                      flashcards: {
                        create: aiData.flashcards.map((flashcard) => ({
                          question: flashcard.question,
                          answer: flashcard.answer
                        }))
                      },
                      quizzes: {
                        create: [
                          {
                            title: `Quiz de validation - ${lesson.title}`,
                            type: 'FORMATIVE',
                            passingScore: 70,
                            questions: {
                              create: aiData.quizQuestions.map((question) => ({
                                prompt: question.prompt,
                                questionType: question.questionType,
                                options: question.options ? question.options : undefined,
                                correctAnswer: question.correctAnswer,
                                explanation: question.explanation,
                                points: question.points,
                                order: question.order ?? 0
                              }))
                            }
                          }
                        ]
                      }
                    };
                  })
                }
              }))
            }
          }
        ]
      }
    }
  });

  return curriculum;
}

async function createSequentialDependencies(curriculumId: string) {
  const lessons = await prisma.curriculumLesson.findMany({
    where: {
      chapter: {
        subject: {
          curriculumId
        }
      }
    },
    orderBy: [{ chapter: { order: 'asc' } }, { order: 'asc' }]
  });

  const createPromises = [];
  for (let index = 1; index < lessons.length; index += 1) {
    const previous = lessons[index - 1];
    const current = lessons[index];
    if (previous.chapterId === current.chapterId) {
      createPromises.push(
        prisma.lessonDependency.create({
          data: {
            lessonId: current.id,
            requiredLessonId: previous.id,
            rule: 'completed',
            minimumScore: 70
          }
        })
      );
    }
  }
  await Promise.all(createPromises);
}

export default {
  createImportJob,
  processImportJob
};
