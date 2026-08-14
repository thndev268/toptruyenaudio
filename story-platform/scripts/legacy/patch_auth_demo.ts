import fs from 'fs';

let content = fs.readFileSync('story-platform/frontend/src/context/AuthContext.tsx', 'utf8');

if (!content.includes('honoraryTitles: [')) {
  // Add a title to the mock user fallback
  content = content.replace(/avatarUrl: 'https:\/\/images.unsplash.com\/photo-1534528741775-53994a69daeb\?w=150',/, 
    "avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',\n        honoraryTitles: [{ titleId: 'title-1', name: 'Fan Cứng Đời Đầu', assignedAt: new Date().toISOString(), effects: [{ type: 'TEXT_COLOR', color: 'text-amber-500' }, { type: 'GLOW', color: 'shadow-amber-500/50' }] }],");
  
  content = content.replace(/role: newRole as UserRole,/, 
    "role: newRole as UserRole,\n      honoraryTitles: [{ titleId: 'title-2', name: 'Nhà Tài Trợ Vàng', assignedAt: new Date().toISOString(), effects: [{ type: 'TEXT_COLOR', color: 'text-yellow-400' }, { type: 'ICON', iconName: 'Crown' }] }],");

  fs.writeFileSync('story-platform/frontend/src/context/AuthContext.tsx', content);
}
