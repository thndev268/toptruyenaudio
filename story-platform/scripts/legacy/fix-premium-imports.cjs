const fs = require('fs');
const path = './story-platform/frontend/src/components/views/PremiumView.tsx';
let content = fs.readFileSync(path, 'utf8');

// I already added subscriptionRepository in an earlier script, but I might have made a typo
content = content.replace(/import \{ PremiumPlan \} from '\.\.\/\.\.\/types';/g, "import { PremiumPlan } from '../../types';\nimport { subscriptionRepository } from '../../services/repositories/SubscriptionRepository';");

// Check if it already has subscriptionRepository, if not, add it
if (!content.includes('subscriptionRepository')) {
  content = content.replace(/import \{ PremiumPlan \} from '\.\.\/\.\.\/types';/, "import { PremiumPlan } from '../../types';\nimport { subscriptionRepository } from '../../services/repositories/SubscriptionRepository';");
}
fs.writeFileSync(path, content, 'utf8');
