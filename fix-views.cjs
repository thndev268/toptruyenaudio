const fs = require('fs');

function replaceInFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\{ch\.priceXu\} Xu/g, "{ch.accessLevel === 'PREMIUM' ? 'Premium' : ''}");
  content = content.replace(/\{currentChapter\.isFree \? 'Miễn phí' : `\$\{currentChapter\.priceXu\} Xu`\}/g, "{currentChapter.accessLevel === 'FREE' ? 'Miễn phí' : 'Premium'}");
  content = content.replace(/\{currentChapter\.isFree \? 'Miễn Phí' : `\$\{currentChapter\.priceXu\} Xu`\}/g, "{currentChapter.accessLevel === 'FREE' ? 'Miễn Phí' : 'Premium'}");
  content = content.replace(/\{chapter\.priceXu\} Xu/g, "{chapter.accessLevel === 'PREMIUM' ? 'Premium' : ''}");
  content = content.replace(/Mở khóa \{chapter\.priceXu\} Xu/g, "Nâng cấp Premium");
  content = content.replace(/<Lock className="w-3.5 h-3.5" \/> Mở khóa/g, '<Crown className="w-3.5 h-3.5" /> Nâng cấp Premium');
  fs.writeFileSync(path, content, 'utf8');
}

replaceInFile('./story-platform/frontend/src/components/player/FullAudioPlayerModal.tsx');
replaceInFile('./story-platform/frontend/src/components/views/AudioPlayerView.tsx');
replaceInFile('./story-platform/frontend/src/components/views/StoryDetailView.tsx');

