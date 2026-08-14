import * as fs from 'fs';
const file = 'story-platform/frontend/src/components/views/HistoryView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<div className="text-xs text-slate-500 bg-slate-900\/50 p-4 rounded-xl border border-slate-800\/50">\s*Đồng bộ nhiều thiết bị sẽ khả dụng sau khi hệ thống tài khoản được kết nối backend\.\s*<\/div>/,
  '<div className="text-xs text-slate-500 bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">Lịch sử nghe đã được đồng bộ hóa an toàn và bảo mật trên mọi thiết bị khi bạn đăng nhập.</div>'
);

fs.writeFileSync(file, content);
