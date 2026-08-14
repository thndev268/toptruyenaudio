import * as fs from 'fs';
let file = 'story-platform/frontend/src/components/views/HistoryView.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { useNavigate }')) {
  content = content.replace(
    /import React, \{ useState, useMemo \} from 'react';/,
    "import React, { useState, useMemo } from 'react';\nimport { useNavigate } from 'react-router-dom';"
  );
  content = content.replace(
    /const \{ playChapter, listeningHistory, removeHistoryItem, clearHistory \} = useAudioPlayer\(\);/,
    "const { playChapter, listeningHistory, removeHistoryItem, clearHistory } = useAudioPlayer();\n  const navigate = useNavigate();"
  );
  fs.writeFileSync(file, content);
}

file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
content = fs.readFileSync(file, 'utf8');
content = content.replace(/p\.lastPlayedAt/g, "p.updatedAt");
content = content.replace(/savedProg\.lastPlayedAt/g, "savedProg.updatedAt");
content = content.replace(/isVideoEnabled \? 'VIDEO' : 'AUDIO'/g, "activeEngineRef.current === 'youtube' ? 'VIDEO' : 'AUDIO'");

// syncStatus: 'LOCAL_ONLY' as const
content = content.replace(/syncStatus: 'LOCAL_ONLY',/g, "syncStatus: 'LOCAL_ONLY' as const,");

fs.writeFileSync(file, content);
