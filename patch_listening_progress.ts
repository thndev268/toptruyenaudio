import * as fs from 'fs';
const file = 'story-platform/frontend/src/types/index.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/updatedAt: string;/g, "updatedAt: string;\n  lastPlayedAt?: string;");
fs.writeFileSync(file, content);
