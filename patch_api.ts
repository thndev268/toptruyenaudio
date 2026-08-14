import * as fs from 'fs';
let file = 'story-platform/frontend/src/services/api/progress.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/export async function saveProgress\(chapterId: string, progress: any\): Promise<void> \{/g, 'export async function saveProgress(chapterId: string, progress: any): Promise<ListeningProgress | null> {');
content = content.replace(/await apiRequest\(\`\/listening\/me\/progress\/\$\{chapterId\}\`, \{[\s\S]*?\}\);/, "return await apiRequest(`/listening/me/progress/${chapterId}`, {\n      method: 'PUT',\n      body: JSON.stringify(progress)\n    });");
content = content.replace(/console\.error\('Failed to save progress to API', e\);\s*\}/, "console.error('Failed to save progress to API', e);\n    return null;\n  }");

fs.writeFileSync(file, content);
