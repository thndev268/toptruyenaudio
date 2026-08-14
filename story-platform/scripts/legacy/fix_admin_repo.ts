import fs from 'fs';
let content = fs.readFileSync('story-platform/frontend/src/services/repositories/AdminRepository.ts', 'utf8');
content = content.replace("import { AudioChapter }  HonoraryTitle, TitleEffect, UserTitle } from '../../types';", "import { AudioChapter, HonoraryTitle, TitleEffect, UserTitle } from '../../types';");
fs.writeFileSync('story-platform/frontend/src/services/repositories/AdminRepository.ts', content);
