const fs = require('fs');
const path = './story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/const \[ setUserXuBalance\].*;\n/, "");
content = content.replace(/setUserXuBalance\(\(prev\) => \{[\s\S]*?\}\);\n/, "");
content = content.replace(/if \(!chapter\.isFree.*\{[\s\S]*?return;\n    \}/, `if (chapter.accessLevel === 'PREMIUM') {
      // Premium check should be handled in View layer before calling playChapter
      // But if it slips through without access, we can block it here if we had auth context.
      // For now, we trust the view layer.
    }`);
content = content.replace(/chapter\.priceXu/g, 'chapter.accessLevel');
content = content.replace(/isFree/g, "accessLevel === 'FREE'");

fs.writeFileSync(path, content, 'utf8');
