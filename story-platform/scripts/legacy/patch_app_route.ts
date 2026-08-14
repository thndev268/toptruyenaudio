import fs from 'fs';

let content = fs.readFileSync('story-platform/frontend/src/App.tsx', 'utf8');

if (!content.includes('AdminHonoraryTitlesPage')) {
  // Add to import
  content = content.replace(/AdminProfilePage,/, "AdminProfilePage,\n  AdminHonoraryTitlesPage,");
  
  // Add to routes (around AdminUsersPage)
  content = content.replace(/<Route path="users" element={<AdminUsersPage \/>} \/>/, 
  `<Route path="users" element={<AdminUsersPage />} />\n                <Route path="honorary-titles" element={<AdminHonoraryTitlesPage />} />`);
  
  fs.writeFileSync('story-platform/frontend/src/App.tsx', content);
}
