const fs = require('fs');
const path = './story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(path, 'utf8');

// The file has a missing '}' somewhere because of the replacement
// Let's just fix the end of the file. No, wait, if the error is "Unexpected }", it means there's an extra }.
content = content.replace(/  };\n\n  export const useAudioPlayer = \(\) => {/, "export const useAudioPlayer = () => {");
fs.writeFileSync(path, content, 'utf8');
