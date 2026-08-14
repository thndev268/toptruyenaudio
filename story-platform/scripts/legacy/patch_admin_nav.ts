import fs from 'fs';

let content = fs.readFileSync('story-platform/frontend/src/components/admin/layout/AdminNavigation.tsx', 'utf8');

if (!content.includes('honorary-titles')) {
  // We'll look for the Users item in navigation config
  content = content.replace(/name: 'Người dùng', href: '\/admin\/users', icon: Users, id: 'users' },/, 
    "name: 'Người dùng', href: '/admin/users', icon: Users, id: 'users' },\n      { name: 'Danh hiệu', href: '/admin/honorary-titles', icon: Award, id: 'honorary-titles' },");
  
  if (!content.includes('Award')) {
    content = content.replace(/import {([^}]+)} from 'lucide-react';/, "import { Award, $1 } from 'lucide-react';");
  }

  fs.writeFileSync('story-platform/frontend/src/components/admin/layout/AdminNavigation.tsx', content);
}
