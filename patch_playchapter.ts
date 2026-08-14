import * as fs from 'fs';
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update type definition
content = content.replace(
  /playChapter: \(story: AudioStory, chapter: AudioChapter\) => Promise<boolean>;/,
  'playChapter: (story: AudioStory, chapter: AudioChapter, startPosition?: number) => Promise<boolean>;'
);

// Update implementation signature
content = content.replace(
  /const playChapter = async \(story: AudioStory, chapter: AudioChapter\): Promise<boolean> => \{/,
  'const playChapter = async (story: AudioStory, chapter: AudioChapter, startPosition?: number): Promise<boolean> => {'
);

// We need to inject the startPosition logic for audio engine
const audioStartLogic = `
      if (audioRef.current) {
        ensureSoundBeforePlay();
        audioRef.current.src = finalAudioUrl;
        
        let startPos = startPosition || 0;
        if (startPosition === undefined) {
          const prog = listeningProgressMap[story.id];
          if (prog && prog.chapterId === chapter.id && !prog.completed && prog.positionSeconds > 5) {
            startPos = prog.positionSeconds;
          }
        }
        
        const onLoadedMetadata = () => {
          if (startPos > 0 && audioRef.current) {
             audioRef.current.currentTime = startPos;
          }
          audioRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
        audioRef.current.addEventListener('loadedmetadata', onLoadedMetadata);

        try {
`;
content = content.replace(/if \(audioRef\.current\) \{\s*ensureSoundBeforePlay\(\);\s*audioRef\.current\.src = finalAudioUrl;\s*audioRef\.current\.currentTime = 0;\s*try \{/, audioStartLogic);

// We need to inject the startPosition logic for youtube engine
const ytStartLogic = `
      if (ytReadyRef.current && ytPlayerRef.current) {
        try {
          if (isMuted) ytPlayerRef.current.mute();
          else ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(isMuted ? 0 : volume * 100);
          ytPlayerRef.current.setPlaybackRate(playbackRate);
          
          let startPos = startPosition || 0;
          if (startPosition === undefined) {
            const prog = listeningProgressMap[story.id];
            if (prog && prog.chapterId === chapter.id && !prog.completed && prog.positionSeconds > 5) {
              startPos = prog.positionSeconds;
            }
          }
          
          ytPlayerRef.current.loadVideoById(ytId, startPos);
          setIsPlaying(true);
          return true;
`;
content = content.replace(/if \(ytReadyRef\.current && ytPlayerRef\.current\) \{\s*try \{\s*if \(isMuted\) ytPlayerRef\.current\.mute\(\);\s*else ytPlayerRef\.current\.unMute\(\);\s*ytPlayerRef\.current\.setVolume\(isMuted \? 0 : volume \* 100\);\s*ytPlayerRef\.current\.setPlaybackRate\(playbackRate\);\s*ytPlayerRef\.current\.loadVideoById\(ytId\);\s*setIsPlaying\(true\);\s*return true;/, ytStartLogic);

// Session creation startPosition
content = content.replace(
  /startPosition: 0,/,
  'startPosition: startPosition || 0,'
);

fs.writeFileSync(file, content);
