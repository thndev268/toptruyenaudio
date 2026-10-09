import fs from 'fs';

let content = fs.readFileSync('story-platform/frontend/src/types/admin.ts', 'utf8');
if (!content.includes('honoraryTitles?:')) {
  content = content.replace(/favoritesCount: number;/, "favoritesCount: number;\n  honoraryTitles?: import('./index').UserTitle[];");
  fs.writeFileSync('story-platform/frontend/src/types/admin.ts', content);
}
