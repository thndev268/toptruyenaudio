import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, AlertCircle, HelpCircle, Mail, Bug } from 'lucide-react';

export type LegalDocType =
  | 'terms'
  | 'privacy'
  | 'copyright'
  | 'copyright-takedown'
  | 'payment-policy'
  | 'withdrawal-policy'
  | 'help'
  | 'contact'
  | 'report-bug';

interface LegalDocConfig {
  title: string;
  updatedAt: string;
  icon: React.FC<{ className?: string }>;
  sections: { id: string; title: string; content: string }[];
}

const LEGAL_DOCS: Record<LegalDocType, LegalDocConfig> = {
  terms: {
    title: 'Điều Khoản Dịch Vụ TOP TRUYỆN AUDIO',
    updatedAt: '15/02/2026',
    icon: FileText,
    sections: [
      { id: 'sec-1', title: '1. Quy định chung', content: 'TOP TRUYỆN AUDIO cung cấp dịch vụ nghe truyện audio và podcast trực tuyến. Khi truy cập và sử dụng nền tảng, bạn đồng ý tuân thủ toàn bộ các điều khoản này.' },
      { id: 'sec-2', title: '2. Tài khoản & Bảo mật', content: 'Người dùng có trách nhiệm bảo mật thông tin đăng nhập. Mọi hoạt động phát sinh từ tài khoản của bạn sẽ do bạn chịu trách nhiệm.' },
      { id: 'sec-3', title: '3. Bản quyền nội dung', content: 'Tất cả tác phẩm audio, giọng đọc, hình ảnh trên TOP TRUYỆN AUDIO thuộc bản quyền của Tác giả, MC sáng tạo hoặc đã được cấp phép hợp pháp. Nghiêm cấm mọi hành vi sao chép, thu âm lại và phát tán trái phép.' },
      { id: 'sec-4', title: '4. Giao dịch & Thanh toán', content: 'Các giao dịch mua gói Premium trên nền tảng hiện tại chỉ là dữ liệu mô phỏng. Sẽ cập nhật chính sách thanh toán khi tính năng thương mại chính thức hoạt động.' },
    ],
  },
  privacy: {
    title: 'Chính Sách Bảo Mật Quyền Riêng Tư',
    updatedAt: '15/02/2026',
    icon: ShieldCheck,
    sections: [
      { id: 'sec-1', title: '1. Dữ liệu thu thập', content: 'Chúng tôi chỉ lưu trữ thông tin cần thiết như Lịch sử nghe, Danh sách yêu thích và Tiến độ phát audio trong local storage trình duyệt hoặc tài khoản của bạn.' },
      { id: 'sec-2', title: '2. Mục đích sử dụng', content: 'Dữ liệu được dùng để khôi phục vị trí nghe dở dang, đề xuất truyện phù hợp và cải thiện trải nghiệm nghe audio.' },
      { id: 'sec-3', title: '3. Cam kết không chia sẻ', content: 'TOP TRUYỆN AUDIO cam kết không bán hoặc chia sẻ dữ liệu cá nhân của người dùng cho bên thứ ba vì mục đích thương mại.' },
    ],
  },
  copyright: {
    title: 'Chính Sách Bản Quyền & Sở Hữu Trí Tuệ',
    updatedAt: '15/02/2026',
    icon: FileText,
    sections: [
      { id: 'sec-1', title: '1. Tôn trọng bản quyền tác giả', content: 'TOP TRUYỆN AUDIO cam kết tôn trọng quyền sở hữu trí tuệ của các tác giả truyện, dịch giả và giọng đọc MC.' },
      { id: 'sec-2', title: '2. Quy trình gỡ bỏ nội dung', content: 'Nếu phát hiện nội dung vi phạm bản quyền trên nền tảng, chủ sở hữu tác quyền có thể gửi yêu cầu gỡ bỏ theo mẫu Yêu Cầu Gỡ Nội Dung (DMCA Takedown).' },
    ],
  },
  'copyright-takedown': {
    title: 'Yêu Cầu Gỡ Nội Dung Vi Phạm Bản Quyền',
    updatedAt: '15/02/2026',
    icon: AlertCircle,
    sections: [
      { id: 'sec-1', title: '1. Thông tin người gửi', content: 'Vui lòng cung cấp họ tên đầy đủ, đơn vị sở hữu bản quyền, email liên hệ và giấy tờ chứng minh tác quyền hợp pháp.' },
      { id: 'sec-2', title: '2. Liên kết tác phẩm vi phạm', content: 'Cung cấp chính xác đường dẫn (URL) tác phẩm trên TOP TRUYỆN AUDIO bị nghi ngờ vi phạm.' },
      { id: 'sec-3', title: '3. Thời hạn xử lý', content: 'Bộ phận Pháp lý TOP TRUYỆN AUDIO sẽ xem xét và phản hồi trong vòng 24 - 48 giờ làm việc.' },
    ],
  },
  'payment-policy': {
    title: 'Chính Sách Thanh Toán & Đăng Ký Premium',
    updatedAt: '15/02/2026',
    icon: FileText,
    sections: [
      { id: 'sec-1', title: '1. Phương thức thanh toán', content: 'Hỗ trợ thanh toán các gói Premium qua ví điện tử MoMo, VNPAY, ZaloPay và thẻ ngân hàng nội địa/quốc tế (tính năng sẽ sớm ra mắt).' },
      { id: 'sec-2', title: '2. Chu kỳ thanh toán', content: 'Các gói đăng ký có chu kỳ hàng tháng, 3 tháng, 6 tháng và hàng năm. Hệ thống sẽ có tính năng tự động gia hạn.' },
      { id: 'sec-3', title: '3. Hủy và hoàn tiền', content: 'Người dùng có thể hủy tự động gia hạn bất kỳ lúc nào. Nền tảng không áp dụng chính sách hoàn tiền cho thời gian chưa sử dụng của chu kỳ hiện tại.' },
    ],
  },
  'withdrawal-policy': {
    title: 'Chính Sách Rút Tiền Doanh Số Creator',
    updatedAt: '15/02/2026',
    icon: FileText,
    sections: [
      { id: 'sec-1', title: '1. Hạn mức rút tối thiểu', content: 'Creator và Partner được tạo lệnh rút tiền khi số dư tích lũy đạt tối thiểu 500.000 VNĐ.' },
      { id: 'sec-2', title: '2. Lịch chi trả', content: 'Lệnh rút tiền được tổng hợp vào ngày 05 và 20 hằng tháng. Tiền sẽ chuyển vào tài khoản ngân hàng trong 1-3 ngày làm việc.' },
    ],
  },
  help: {
    title: 'Trung Tâm Trợ Giúp TOP TRUYỆN AUDIO',
    updatedAt: '15/02/2026',
    icon: HelpCircle,
    sections: [
      { id: 'sec-1', title: '1. Làm sao để nghe tiếp bài đang dở?', content: 'Bạn chỉ cần truy cập Thư viện > Đang nghe hoặc nhấn vào Mini Audio Player ở cuối màn hình.' },
      { id: 'sec-2', title: '2. Hẹn giờ tắt audio hoạt động như thế nào?', content: 'Trong giao diện nghe nhạc, nhấn biểu tượng Hẹn giờ và chọn khoảng thời gian (15, 30, 45, 60 phút hoặc hết tập).' },
    ],
  },
  contact: {
    title: 'Liên Hệ Bộ Phận Hỗ Trợ TOP TRUYỆN AUDIO',
    updatedAt: '15/02/2026',
    icon: Mail,
    sections: [
      { id: 'sec-1', title: '1. Thông tin liên hệ chính thức', content: 'Email: support@toptruyenaudio.com | Hotline: 1900 8888 | Địa chỉ: Tầng 12, Tòa nhà Audio Tower, Hà Nội.' },
      { id: 'sec-2', title: '2. Giờ làm việc', content: 'Thứ Hai - Thứ Bảy: 08:00 - 20:00 (GMT+7).' },
    ],
  },
  'report-bug': {
    title: 'Báo Cáo Lỗi & Đóng Góp Ý Kiến',
    updatedAt: '15/02/2026',
    icon: Bug,
    sections: [
      { id: 'sec-1', title: '1. Phản hồi lỗi kỹ thuật', content: 'Nếu gặp lỗi không phát được audio, đứng hình hoặc sai vị trí nghe, vui lòng gửi mô tả thiết bị và trình duyệt bạn đang sử dụng.' },
      { id: 'sec-2', title: '2. Đóng góp tính năng', content: 'Chúng tôi trân trọng mọi ý kiến đóng góp nhằm nâng cao trải nghiệm ứng dụng nghe truyện.' },
    ],
  },
};

export const LegalPageView: React.FC<{ type?: LegalDocType }> = ({ type }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Deduce type from URL if not passed explicitly
  const path = location.pathname.replace('/', '');
  const activeType: LegalDocType = type || (path as LegalDocType) || 'terms';
  const doc = LEGAL_DOCS[activeType] || LEGAL_DOCS.terms;
  const IconComponent = doc.icon;

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-800 flex items-center gap-2 transition-all min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" /> Quay Lại
      </button>

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 text-cyan-400">
            <div className="p-2.5 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Văn Bản Pháp Lý & Quy Định</span>
              <h1 className="text-xl sm:text-3xl font-black text-white">{doc.title}</h1>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold rounded-lg shrink-0">
            Bản Dự Thảo Chính Thức
          </span>
        </div>

        <p className="text-xs text-slate-400 font-mono">Ngày cập nhật gần nhất: {doc.updatedAt}</p>
      </div>

      {/* Table of Contents */}
      {doc.sections.length > 1 && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Mục Lục Văn Bản</h4>
          <div className="flex flex-wrap gap-2 text-xs">
            {doc.sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-3 py-1 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 rounded-lg transition-colors"
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Content Sections */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl leading-relaxed text-xs sm:text-sm text-slate-300">
        {doc.sections.map((sec) => (
          <div key={sec.id} id={sec.id} className="space-y-2 scroll-mt-20">
            <h3 className="text-base font-bold text-white border-b border-slate-800/80 pb-2">{sec.title}</h3>
            <p className="text-slate-300">{sec.content}</p>
          </div>
        ))}
      </div>

      {/* Related Legal Links Footer */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
        <Link to="/terms" className="hover:text-cyan-400 transition-colors">Điều khoản</Link>
        <span>•</span>
        <Link to="/privacy" className="hover:text-cyan-400 transition-colors">Bảo mật</Link>
        <span>•</span>
        <Link to="/copyright" className="hover:text-cyan-400 transition-colors">Bản quyền</Link>
        <span>•</span>
        <Link to="/payment-policy" className="hover:text-cyan-400 transition-colors">Thanh toán</Link>
        <span>•</span>
        <Link to="/withdrawal-policy" className="hover:text-cyan-400 transition-colors">Rút tiền</Link>
      </div>

    </div>
  );
};
