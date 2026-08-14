const fs = require('fs');
const path = './story-platform/frontend/src/components/views/PremiumView.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the hardcoded string
content = content.replace(/{plan\.code === 'PREMIUM_QUARTERLY' && \([\s\S]*?\)}/g, 
`{plan.code === 'PREMIUM_SEMI_ANNUAL' && (
                <p className="text-sm text-amber-400 mt-1 font-medium">Chỉ 45.000đ/tháng</p>
              )}
              {plan.code === 'PREMIUM_ANNUAL' && (
                <p className="text-sm text-amber-400 mt-1 font-medium">Chỉ 40.000đ/tháng</p>
              )}
              {plan.code === 'PREMIUM_QUARTERLY' && (
                <p className="text-sm text-amber-400 mt-1 font-medium">Chỉ 50.000đ/tháng</p>
              )}`);

// Replace the Popular badge with Recommended or Best Deal
content = content.replace(/Phổ biến/g, "{plan.isPopular ? 'Được đề xuất' : (plan.isBestDeal ? 'Tiết kiệm nhất' : '')}");
content = content.replace(/plan.isPopular && \(/g, "(plan.isPopular || plan.isBestDeal) && (");

content = content.replace(/import \{ PremiumPlan \} from '\.\.\/\.\.\/types';/g, "import { PremiumPlan } from '../../types';\nimport { subscriptionRepository } from '../../services/repositories/SubscriptionRepository';");
content = content.replace(/<div className="absolute -top-3.5 left-1\/2 -translate-x-1\/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black uppercase tracking-wider rounded-full shadow-lg">/g, 
`<div className={\`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-black uppercase tracking-wider rounded-full shadow-lg \${plan.isPopular ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950' : 'bg-cyan-500 text-slate-950'}\`}>`);

// Add logic to activate mock subscription
content = content.replace(/setIsSuccess\(true\);/g, 
`if (user) {
          subscriptionRepository.activateMockSubscription(user.id, selectedPlan.code);
        }
        setIsSuccess(true);`);

fs.writeFileSync(path, content, 'utf8');
