const fs = require('fs');
const path = './story-platform/frontend/src/components/views/PremiumView.tsx';
let content = fs.readFileSync(path, 'utf8');

// Need to update the type of MOCK_PLANS items because they might not match PremiumPlan interface
// Just use any or add isBestDeal to PremiumPlan in types
content = content.replace(/type: any/g, ""); // Dummy
fs.writeFileSync(path, content, 'utf8');

const typePath = './story-platform/frontend/src/types/index.ts';
let typeContent = fs.readFileSync(typePath, 'utf8');
typeContent = typeContent.replace(/isPopular\?: boolean;/g, "isPopular?: boolean;\n  isBestDeal?: boolean;");
fs.writeFileSync(typePath, typeContent, 'utf8');
