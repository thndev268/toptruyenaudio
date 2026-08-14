import fs from 'fs';

let content = fs.readFileSync('story-platform/frontend/src/components/admin/pages/AdminPages.tsx', 'utf8');

if (!content.includes('HonoraryTitlesScreen')) {
  // Import
  const importStr = "import { HonoraryTitlesScreen } from '../screens/HonoraryTitlesScreen';\n";
  content = importStr + content;
  
  // Export
  content = content + "\nexport const AdminHonoraryTitlesPage = () => <AdminPageContainer><HonoraryTitlesScreen /></AdminPageContainer>;\n";
  
  fs.writeFileSync('story-platform/frontend/src/components/admin/pages/AdminPages.tsx', content);
}
