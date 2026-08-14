const fs = require('fs');
const path = './story-platform/frontend/src/data/mockAudioData.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/accessLevel: true/g, "accessLevel: 'FREE'");
content = content.replace(/accessLevel: false/g, "accessLevel: 'PREMIUM'");
content = content.replace(/isFree: true/g, "accessLevel: 'FREE'");
content = content.replace(/isFree: false/g, "accessLevel: 'PREMIUM'");
content = content.replace(/priceXu:\s*[0-9]+,/g, "isEarlyAccess: false,");

fs.writeFileSync(path, content, 'utf8');
