const fs = require('fs');

function fixPremiumView() {
  const path = './story-platform/frontend/src/components/views/PremiumView.tsx';
  let content = fs.readFileSync(path, 'utf8');

  // Replace mock plans to match new requirements
  content = content.replace(/const MOCK_PLANS: PremiumPlan\[\] = \[[\s\S]*?\];/g, 
`const MOCK_PLANS = [
  {
    code: 'PREMIUM_MONTHLY',
    name: 'Premium Tháng',
    priceVnd: 59000,
    durationDays: 30,
    isPopular: false,
  },
  {
    code: 'PREMIUM_QUARTERLY',
    name: 'Premium 3 Tháng',
    priceVnd: 150000,
    durationDays: 90,
    savingsVnd: 27000,
    originalPriceVnd: 177000,
    isPopular: false,
  },
  {
    code: 'PREMIUM_SEMI_ANNUAL',
    name: 'Premium 6 Tháng',
    priceVnd: 270000,
    durationDays: 180,
    savingsVnd: 84000,
    originalPriceVnd: 354000,
    isPopular: true,
  },
  {
    code: 'PREMIUM_ANNUAL',
    name: 'Premium 12 Tháng',
    priceVnd: 480000,
    durationDays: 365,
    savingsVnd: 228000,
    originalPriceVnd: 708000,
    isPopular: false,
    isBestDeal: true,
  }
];`);

  fs.writeFileSync(path, content, 'utf8');
}

fixPremiumView();
