const fs = require('fs');

function fixBecomeCreator() {
  const path = './story-platform/frontend/src/components/views/BecomeCreatorView.tsx';
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/doanh số Xu lượt nghe./g, "doanh thu chia sẻ lượt nghe Premium.");
  fs.writeFileSync(path, content, 'utf8');
}

function fixLegal() {
  const path = './story-platform/frontend/src/components/views/LegalPageView.tsx';
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/4\. Nạp Xu và Giao dịch/g, "4. Giao dịch & Thanh toán");
  content = content.replace(/Xu là đơn vị ảo được sử dụng để mở khóa các tập truyện trả phí\. Xu đã nạp không có giá trị quy đổi ngược ra tiền mặt ngoại trừ các chính sách hoàn tiền áp dụng riêng\./g, "Các giao dịch mua gói Premium trên nền tảng hiện tại chỉ là dữ liệu mô phỏng. Sẽ cập nhật chính sách thanh toán khi tính năng thương mại chính thức hoạt động.");
  
  content = content.replace(/Chính Sách Thanh Toán & Nạp Xu/g, "Chính Sách Thanh Toán & Đăng Ký Premium");
  
  content = content.replace(/Hỗ trợ nạp Xu qua các ví điện tử MoMo, VNPAY, ZaloPay và thẻ ngân hàng nội địa\/quốc tế\./g, "Hỗ trợ thanh toán các gói Premium qua ví điện tử MoMo, VNPAY, ZaloPay và thẻ ngân hàng nội địa/quốc tế (tính năng sẽ sớm ra mắt).");
  
  content = content.replace(/2\. Quy đổi Xu/g, "2. Chu kỳ thanh toán");
  content = content.replace(/Tỷ lệ quy đổi tiêu chuẩn: 10\.000 VNĐ = 100 Xu\. Các gói nạp lớn được tặng thêm phần trăm Xu thưởng\./g, "Các gói đăng ký có chu kỳ hàng tháng, 3 tháng, 6 tháng và hàng năm. Hệ thống sẽ có tính năng tự động gia hạn.");
  
  content = content.replace(/3\. Sự cố nạp Xu/g, "3. Hủy và hoàn tiền");
  content = content.replace(/Trong trường hợp đã trừ tiền nhưng chưa nhận Xu, vui lòng gửi mã giao dịch tới hỗ trợ để được cộng Xu thủ công\./g, "Người dùng có thể hủy tự động gia hạn bất kỳ lúc nào. Nền tảng không áp dụng chính sách hoàn tiền cho thời gian chưa sử dụng của chu kỳ hiện tại.");
  
  fs.writeFileSync(path, content, 'utf8');
}

function fixComments() {
  const path = './story-platform/frontend/src/services/repositories/CommentRepository.ts';
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/bán bằng Xu/g, "yêu cầu Premium");
  content = content.replace(/mở khóa bằng 5 Xu/g, "cần tài khoản Premium");
  fs.writeFileSync(path, content, 'utf8');
}

function fixApp() {
  const path = './story-platform/frontend/src/App.tsx';
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/import \{ AccountWalletView \} from '\.\/components\/views\/AccountWalletView';/g, "import { SubscriptionManagementView } from './components/views/SubscriptionManagementView';");
  content = content.replace(/path="\/wallet"/g, 'path="/account/subscription"');
  content = content.replace(/<AccountWalletView \/>/g, '<SubscriptionManagementView />');
  fs.writeFileSync(path, content, 'utf8');
}

fixBecomeCreator();
fixLegal();
fixComments();
fixApp();

