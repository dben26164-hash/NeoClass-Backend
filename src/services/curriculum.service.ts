import prisma from '../prisma';

export async function listCurriculums(schoolId: string) {
  return prisma.curriculum.findMany({
    where: {
      schoolId,
      deletedAt: null
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getCurriculumById(id: string) {
  return prisma.curriculum.findUnique({
    where: { id },
    include: {
      versions: true,
      subjects: true
    }
  });
}

export async function createCurriculum(data: {
  schoolId: string;
  name: string;
  level: string;
  code: string;
  country: string;
  type: string;
  description?: string;
  gradeLevelId?: string;
}) {
  return prisma.curriculum.create({
    data: {
      schoolId: data.schoolId,
      name: data.name,
      level: data.level,
      code: data.code,
      country: data.country,
      type: data.type as any,
      description: data.description,
      gradeLevelId: data.gradeLevelId
    }
  });
}

export async function updateCurriculum(id: string, updates: Partial<{
  name: string;
  level: string;
  code: string;
  country: string;
  type: string;
  description: string;
  gradeLevelId: string;
  isPublished: boolean;
}>) {
  return prisma.curriculum.update({
    where: { id },
    data: updates as any
  });
}
