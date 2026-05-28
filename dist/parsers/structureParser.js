"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDocumentStructure = parseDocumentStructure;
const gradeRegex = /(?:classe|grade|niveau|ann[eé]e)\s*[:\-]?\s*(.+)/i;
const subjectRegex = /(?:mati[eè]re|discipline|subject)\s*[:\-]?\s*(.+)/i;
const chapterRegex = /^(?:chapitre|chap\.?|chapter)\s*(\d+)?\s*[:\-.]?\s*(.+)$/i;
const lessonRegex = /^(?:le[çc]on|lesson|section|unit)\s*(\d+)?\s*[:\-.]?\s*(.+)$/i;
const objectivesRegex = /^(?:objectifs?|objectif|goals?|but|skills?)\s*[:\-]?\s*$/i;
const exercisesRegex = /^(?:exercices?|exercise[s]?)\s*[:\-]?\s*$/i;
const quizRegex = /^(?:quiz|test|contr[oô]le)\s*[:\-]?\s*$/i;
const resourcesRegex = /^(?:ressources|resources|documents?)\s*[:\-]?\s*$/i;
function parseDocumentStructure(rawText) {
    const lines = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    const result = { chapters: [] };
    let currentChapter = null;
    let currentLesson = null;
    let currentSection = null;
    function pushLesson() {
        if (!currentLesson)
            return;
        if (!currentChapter) {
            currentChapter = { title: 'Programme', lessons: [] };
            result.chapters.push(currentChapter);
        }
        currentChapter.lessons.push(currentLesson);
        currentLesson = null;
    }
    function pushChapter() {
        if (!currentChapter)
            return;
        if (currentLesson) {
            pushLesson();
        }
        currentChapter = null;
    }
    function startLesson(title) {
        if (currentLesson) {
            pushLesson();
        }
        currentSection = 'content';
        currentLesson = {
            title: title.trim(),
            objectives: [],
            content: '',
            exercises: [],
            quizItems: [],
            resources: []
        };
    }
    function startChapter(title) {
        if (currentLesson) {
            pushLesson();
        }
        if (currentChapter) {
            result.chapters.push(currentChapter);
        }
        currentChapter = { title: title.trim(), lessons: [] };
        currentSection = null;
    }
    function appendToCurrentLesson(text) {
        if (!currentLesson)
            return;
        if (currentSection === 'objectives') {
            parseBulletText(text).forEach((item) => currentLesson.objectives.push(item));
        }
        else if (currentSection === 'exercises') {
            parseBulletText(text).forEach((item) => currentLesson.exercises.push(item));
        }
        else if (currentSection === 'quiz') {
            parseBulletText(text).forEach((item) => currentLesson.quizItems.push(item));
        }
        else if (currentSection === 'resources') {
            parseBulletText(text).forEach((item) => currentLesson.resources.push(item));
        }
        else {
            currentLesson.content += (currentLesson.content.length ? '\n' : '') + text;
        }
    }
    for (const line of lines) {
        if (!result.gradeLevel) {
            const gradeMatch = line.match(gradeRegex);
            if (gradeMatch) {
                result.gradeLevel = gradeMatch[1].trim();
                continue;
            }
        }
        if (!result.subject) {
            const subjectMatch = line.match(subjectRegex);
            if (subjectMatch) {
                result.subject = subjectMatch[1].trim();
                continue;
            }
        }
        const chapterMatch = line.match(chapterRegex);
        if (chapterMatch) {
            startChapter(chapterMatch[2] || `Chapitre ${chapterMatch[1] ?? ''}`);
            continue;
        }
        const lessonMatch = line.match(lessonRegex);
        if (lessonMatch) {
            if (!currentChapter) {
                currentChapter = { title: 'Programme', lessons: [] };
            }
            startLesson(lessonMatch[2] || `Leçon ${lessonMatch[1] ?? ''}`);
            continue;
        }
        if (objectivesRegex.test(line)) {
            currentSection = 'objectives';
            continue;
        }
        if (exercisesRegex.test(line)) {
            currentSection = 'exercises';
            continue;
        }
        if (quizRegex.test(line)) {
            currentSection = 'quiz';
            continue;
        }
        if (resourcesRegex.test(line)) {
            currentSection = 'resources';
            continue;
        }
        if (currentLesson) {
            appendToCurrentLesson(line);
            continue;
        }
        const impliedTitle = tryExtractTitle(line);
        if (impliedTitle && !result.subject) {
            result.subject = impliedTitle;
        }
    }
    if (currentLesson) {
        pushLesson();
    }
    if (currentChapter) {
        result.chapters.push(currentChapter);
    }
    if (!result.gradeLevel) {
        result.gradeLevel = 'Niveau non détecté';
    }
    if (!result.subject) {
        result.subject = 'Matière inconnue';
    }
    if (result.chapters.length === 0) {
        result.chapters.push({ title: 'Programme', lessons: [] });
    }
    result.chapters = result.chapters.map((chapter, chapterIndex) => ({
        title: chapter.title,
        lessons: chapter.lessons.map((lesson, lessonIndex) => ({
            ...lesson,
            title: lesson.title || `Leçon ${lessonIndex + 1}`,
            objectives: lesson.objectives.length ? lesson.objectives : ['Objectifs à définir'],
            exercises: lesson.exercises,
            quizItems: lesson.quizItems.length ? lesson.quizItems : ['Question de validation à générer']
        }))
    }));
    return result;
}
function parseBulletText(text) {
    const items = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => line.replace(/^[\-\*•\d\.\)]+\s*/, ''));
    if (items.length > 0) {
        return items;
    }
    return [text];
}
function tryExtractTitle(line) {
    const candidate = line.trim();
    if (/^[A-Z][\w\s]{3,}$/.test(candidate) && candidate.length < 80) {
        return candidate;
    }
    return null;
}
