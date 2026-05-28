from pathlib import Path
from itertools import groupby
import re
path = Path('prisma/schema.prisma')
text = path.read_text(encoding='utf8')
lines = text.splitlines()
models = []
current = None
for line in lines:
    m = re.match(r'^model\s+(\w+)', line)
    if m:
        if current:
            models.append(current)
        current = {'name': m.group(1), 'lines': [line]}
    elif current is not None:
        current['lines'].append(line)
if current:
    models.append(current)

changed = False
patched_models = []
for model in models:
    name = model['name']
    body = model['lines']
    has_created = any(re.match(r'\s*createdAt\s+', l) for l in body)
    has_updated = any(re.match(r'\s*updatedAt\s+', l) for l in body)
    has_deleted = any(re.match(r'\s*deletedAt\s+', l) for l in body)
    if name == 'AIContent':
        if not has_created:
            idx = next((i for i,l in enumerate(body) if re.match(r'\s*updatedAt\s+', l)), len(body)-1)
            body.insert(idx, '  createdAt DateTime @default(now())')
            has_created = True
            changed = True
        if not has_deleted:
            idx = next((i for i,l in enumerate(body) if re.match(r'\s*updatedAt\s+', l)), len(body)-1)
            body.insert(idx, '  deletedAt DateTime?')
            has_deleted = True
            changed = True
    if name == 'StudentParent':
        if not has_created:
            idx = next((i for i,l in enumerate(body) if l.strip().startswith('@@')), len(body)-1)
            body.insert(idx, '  createdAt DateTime @default(now())')
            changed = True
        if not has_updated:
            idx = next((i for i,l in enumerate(body) if l.strip().startswith('@@')), len(body)-1)
            body.insert(idx, '  updatedAt DateTime @updatedAt')
            changed = True
        if not has_deleted:
            idx = next((i for i,l in enumerate(body) if l.strip().startswith('@@')), len(body)-1)
            body.insert(idx, '  deletedAt DateTime?')
            changed = True
    if name == 'CurriculumPublicationLog':
        if not has_updated:
            idx = next((i for i,l in enumerate(body) if l.strip().startswith('@@')), len(body)-1)
            body.insert(idx, '  updatedAt DateTime @updatedAt')
            has_updated = True
            changed = True
        if not has_deleted:
            idx = next((i for i,l in enumerate(body) if l.strip().startswith('@@')), len(body)-1)
            body.insert(idx, '  deletedAt DateTime?')
            has_deleted = True
            changed = True
    if name == 'CurriculumUpdateLog':
        if not has_created:
            idx = next((i for i,l in enumerate(body) if l.strip().startswith('@@')), len(body)-1)
            body.insert(idx, '  createdAt DateTime @default(now())')
            changed = True
        if not has_updated:
            idx = next((i for i,l in enumerate(body) if l.strip().startswith('@@')), len(body)-1)
            body.insert(idx, '  updatedAt DateTime @updatedAt')
            changed = True
        if not has_deleted:
            idx = next((i for i,l in enumerate(body) if l.strip().startswith('@@')), len(body)-1)
            body.insert(idx, '  deletedAt DateTime?')
            changed = True
    if has_deleted and not any('@@index([deletedAt])' in l.replace(' ', '') for l in body):
        idx = next((i for i,l in enumerate(body) if l.strip().startswith('@@') and not l.strip().startswith('@@map')), len(body)-1)
        if idx == len(body)-1 and body[-1].strip() == '}':
            body.insert(-1, '  @@index([deletedAt])')
        else:
            body.insert(idx, '  @@index([deletedAt])')
        changed = True
    # Insert general deletedAt in models with createdAt and updatedAt but missing deletedAt
    if not has_deleted and has_created and has_updated and name not in ('AIContent','StudentParent','CurriculumPublicationLog','CurriculumUpdateLog'):
        idx = next((i for i,l in enumerate(body) if re.match(r'\s*createdAt\s+', l)), len(body)-1)
        body.insert(idx, '  deletedAt DateTime?')
        if not any('@@index([deletedAt])' in l.replace(' ', '') for l in body):
            idx2 = next((i for i,l in enumerate(body) if l.strip().startswith('@@') and not l.strip().startswith('@@map')), len(body)-1)
            if idx2 == len(body)-1 and body[-1].strip() == '}':
                body.insert(-1, '  @@index([deletedAt])')
            else:
                body.insert(idx2, '  @@index([deletedAt])')
        changed = True
    patched_models.append({'name': name, 'lines': body})

if changed:
    out = []
    for m in patched_models:
        out.extend(m['lines'])
    path.write_text('\n'.join(out) + '\n', encoding='utf8')
    print('Schema patched successfully.')
else:
    print('No changes needed.')
