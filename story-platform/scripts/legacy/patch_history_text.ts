import * as fs from 'fs';
const file = 'story-platform/frontend/src/components/views/HistoryView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /Lịch sử nghe đã được đồng bộ hóa an toàn và bảo mật trên mọi thiết bị khi bạn đăng nhập\./,
  'Tiến độ hiện đang được lưu cục bộ trên thiết bị của bạn (Cache). Chức năng đồng bộ đa thiết bị sẽ sớm ra mắt sau khi hệ thống Database được kết nối chính thức.'
);

fs.writeFileSync(file, content);
