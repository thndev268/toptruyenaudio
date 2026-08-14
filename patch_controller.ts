import * as fs from 'fs';
const file = 'story-platform/backend/src/modules/listening/listening.controller.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/this\.listeningService\.deleteListeningProgress\(user\.id\);/g, 'this.listeningService.clearListeningProgress(user.id);');

fs.writeFileSync(file, content);
