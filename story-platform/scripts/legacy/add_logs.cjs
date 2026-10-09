const fs = require('fs');

// 1. Update AudioPlayerContext
const contextFile = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let contextContent = fs.readFileSync(contextFile, 'utf8');

const onReadyRegex = /onReady: \(event: any\) => \{\s+ytReadyRef\.current = true;\s+if \(activeEngineRef\.current === 'audio'\) \{\s+event\.target\.mute\(\);\s+event\.target\.setVolume\(0\);\s+\} else \{\s+if \(isMuted\) event\.target\.mute\(\);\s+else event\.target\.unMute\(\);\s+event\.target\.setVolume\(isMuted \? 0 : volume \* 100\);\s+\}/;

const newOnReady = `onReady: (event: any) => {
              ytReadyRef.current = true;
              console.log('[AudioPlayerContext] YouTube player ready. Engine:', activeEngineRef.current);
              if (activeEngineRef.current === 'audio') {
                console.log('[AudioPlayerContext] Muting YouTube iframe in favor of HTML5 audio.');
                event.target.mute();
                event.target.setVolume(0);
              } else {
                console.log('[AudioPlayerContext] Using YouTube as primary engine. Setting volume to:', isMuted ? 0 : volume * 100);
                if (isMuted) event.target.mute();
                else event.target.unMute();
                event.target.setVolume(isMuted ? 0 : volume * 100);
              }`;

contextContent = contextContent.replace(onReadyRegex, newOnReady);

// Add logs to playChapter as well
const playChapterHasWebAudioRegex = /if \(hasWebAudio\) \{\s+\/\/ Play via Standard HTML5 Audio Engine\s+activeEngineRef\.current = 'audio';/;
const newPlayChapterHasWebAudio = `if (hasWebAudio) {
      console.log('[AudioPlayerContext] Primary player assigned: HTML5 Audio');
      // Play via Standard HTML5 Audio Engine
      activeEngineRef.current = 'audio';`;
contextContent = contextContent.replace(playChapterHasWebAudioRegex, newPlayChapterHasWebAudio);

const playChapterYtEngineRegex = /\} else if \(ytId\) \{\s+\/\/ Play via YouTube Engine\s+activeEngineRef\.current = 'youtube';/;
const newPlayChapterYtEngine = `} else if (ytId) {
      console.log('[AudioPlayerContext] Primary player assigned: YouTube IFrame API');
      // Play via YouTube Engine
      activeEngineRef.current = 'youtube';`;
contextContent = contextContent.replace(playChapterYtEngineRegex, newPlayChapterYtEngine);

fs.writeFileSync(contextFile, contextContent);

// 2. Update AudioPlayerView
const viewFile = 'story-platform/frontend/src/components/views/AudioPlayerView.tsx';
let viewContent = fs.readFileSync(viewFile, 'utf8');

const applyMuteContentRegex = /const applyMute = \(\) => \{\s+try \{\s+if \(videoIframeRef\.current\?\.contentWindow\) \{/;
const newApplyMuteContent = `const applyMute = () => {
        try {
          if (videoIframeRef.current?.contentWindow) {
            console.log('[AudioPlayerView] Sending postMessage to mute iframe visual video.');`;
viewContent = viewContent.replace(applyMuteContentRegex, newApplyMuteContent);

const onReadyViewRegex = /onReady: \(event: any\) => \{\s+try \{\s+event\.target\.setVolume\(0\);\s+event\.target\.mute\(\);\s+\} catch \(e\) \{\}\s+\},/;
const newOnReadyView = `onReady: (event: any) => {
                    try {
                      console.log('[AudioPlayerView] YT visual player onReady - forcing mute.');
                      event.target.setVolume(0);
                      event.target.mute();
                    } catch (e) {}
                  },`;
viewContent = viewContent.replace(onReadyViewRegex, newOnReadyView);

const existingVolumeRegex = /\} else if \(typeof ytVideoPlayerRef\.current\.setVolume === 'function'\) \{\s+ytVideoPlayerRef\.current\.setVolume\(0\);\s+ytVideoPlayerRef\.current\.mute\?\.\(\);\s+\}/;
const newExistingVolume = `} else if (typeof ytVideoPlayerRef.current.setVolume === 'function') {
              console.log('[AudioPlayerView] YT visual player exists - forcing mute.');
              ytVideoPlayerRef.current.setVolume(0);
              ytVideoPlayerRef.current.mute?.();
            }`;
viewContent = viewContent.replace(existingVolumeRegex, newExistingVolume);

fs.writeFileSync(viewFile, viewContent);
