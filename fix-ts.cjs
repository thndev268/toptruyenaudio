const fs = require('fs');

function replaceInFile(path, search, replace) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(path, content, 'utf8');
}

replaceInFile('./story-platform/frontend/src/context/AuthContext.tsx', 
  "export interface UserProfile", 
  "export { UserRole };\nexport interface UserProfile");

replaceInFile('./story-platform/frontend/src/components/views/AudioPlayerView.tsx', 
  /case 'AUTO':\n\s*return 'Tự động';/g, "");
replaceInFile('./story-platform/frontend/src/components/views/AudioPlayerView.tsx', 
  /case 'VERY_HIGH':\n\s*return 'Rất Cao \(320 kbps\)';/g, "");
replaceInFile('./story-platform/frontend/src/components/views/AudioPlayerView.tsx', 
  /quality === 'VERY_HIGH'/g, "quality === 'HIGH'");

replaceInFile('./story-platform/frontend/src/components/views/ExploreView.tsx', 
  /isFree: c\.isFree,/g, "accessLevel: c.accessLevel,");
replaceInFile('./story-platform/frontend/src/components/views/ExploreView.tsx', 
  /!c\.isFree/g, "c.accessLevel === 'PREMIUM'");

replaceInFile('./story-platform/frontend/src/components/views/StoryDetailView.tsx', 
  /c\.isFree/g, "c.accessLevel === 'FREE'");

replaceInFile('./story-platform/frontend/src/components/views/SubscriptionManagementView.tsx', 
  /AlertCircle \} from 'lucide-react';/g, "AlertCircle, RefreshCw } from 'lucide-react';");

let types = fs.readFileSync('./story-platform/frontend/src/types/index.ts', 'utf8');
types = types.replace(/export interface SubscriptionPlan/g, "export interface PremiumPlan {\n  code: string;\n  name: string;\n  priceVnd: number;\n  durationDays: number;\n  originalPriceVnd?: number;\n  savingsVnd?: number;\n  isPopular?: boolean;\n  isBestDeal?: boolean;\n}\n\nexport interface SubscriptionPlan");
fs.writeFileSync('./story-platform/frontend/src/types/index.ts', types, 'utf8');

