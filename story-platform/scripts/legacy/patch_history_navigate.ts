import * as fs from 'fs';
const file = 'story-platform/frontend/src/components/views/HistoryView.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useNavigate')) {
  content = content.replace(/import \{ useState, useMemo \} from 'react';/, "import { useState, useMemo } from 'react';\nimport { useNavigate } from 'react-router-dom';");
  content = content.replace(/const \{ listeningHistory, allStories, removeHistoryItem, clearHistory \} = useAudioPlayer\(\);/, "const { listeningHistory, allStories, removeHistoryItem, clearHistory, playChapter } = useAudioPlayer();\n  const navigate = useNavigate();");
  fs.writeFileSync(file, content);
}
