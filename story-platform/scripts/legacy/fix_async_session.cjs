const fs = require('fs');
const file = 'story-platform/frontend/src/context/AudioPlayerContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const playChapterRegex = /if \(mode === 'API' && isAuthenticated\) \{\s+try \{\s+const session = await apiRequest<\{\s*_id: string\s*\}>\([\s\S]*?setSessionId\(null\);\s+\}\s+\} else \{\s+setSessionId\(null\);\s+\}/;

const nonBlockingSession = `if (mode === 'API' && isAuthenticated) {
      // Fire session creation asynchronously to not block the play() user gesture
      apiRequest<{ _id: string }>(
        '/listening/sessions',
        {
          method: 'POST',
          body: JSON.stringify({
            storySlug: story.slug,
            chapterSlug: chapter.slug,
            startPosition: 0,
            playbackRate: playbackRate
          })
        }
      ).then(session => {
        setSessionId(session._id);
      }).catch(err => {
        console.warn('Failed to start listening session:', err);
        setSessionId(null);
      });
    } else {
      setSessionId(null);
    }`;

content = content.replace(playChapterRegex, nonBlockingSession);
fs.writeFileSync(file, content);
