import prisma from '../prisma';

export async function initiateCurriculumSync(curriculumId: string, schoolIds: string[], syncedBy: string) {
  const curriculum = await prisma.curriculum.findUnique({ where: { id: curriculumId } });
  if (!curriculum) {
    throw new Error('Curriculum not found');
  }

  const uniqueSchoolIds = Array.from(new Set(schoolIds));
  const results = [] as any[];

  for (const schoolId of uniqueSchoolIds) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      throw new Error(`School not found: ${schoolId}`);
    }
    const sync = await prisma.curriculumSync.upsert({
      where: {
        curriculumId_schoolId: {
          curriculumId,
          schoolId
        }
      },
      update: {
        status: 'PENDING',
        syncedBy,
        syncedAt: null,
        errorMessage: null,
        attemptCount: 0,
        nextRetryAt: null
      },
      create: {
        curriculumId,
        schoolId,
        status: 'PENDING',
        syncedBy,
        metadata: { initiatedBy: syncedBy, timestamp: new Date().toISOString() }
      }
    });
    results.push(sync);
  }

  return results;
}

export async function getSyncStatus(curriculumId: string) {
  return prisma.curriculumSync.findMany({
    where: { curriculumId },
    orderBy: { createdAt: 'desc' }
  });
}
