import React, { useState, useEffect } from 'react';
import {
  Crown,
  Search,
  CreditCard,
  CheckCircle2,
  TrendingUp,
  Coins,
  ArrowUpRight,
  ChevronDown,
  X,
  Send,
} from 'lucide-react';
import { AdminSubscriptionRecord } from '../../../types/admin';
import { apiRequest } from '../../../services/apiClient';

interface PremiumScreenProps {
  subscriptions?: AdminSubscriptionRecord[];
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const PremiumScreen: React.FC<PremiumScreenProps> = ({ subscriptions: propSubscriptions }) => {
  const [search, setSearch] = useState('');
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionRecord[]>(propSubscriptions || []);
  const [loading, setLoading] = useState(!propSubscriptions);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportEmail, setSupportEmail] = useState('');

  const faqs: FAQItem[] = [
    {
      id: '1',
      question: 'Làm thế nào để đăng ký gói Premium?',
      answer: 'Bạn có thể đăng ký gói Premium bằng cách chọn gói phù hợp trong trang đăng ký và thanh toán qua VietQR hoặc các phương thức thanh toán khác. Sau khi thanh toán thành công, tài khoản của bạn sẽ được nâng cấp ngay lập tức.',
    },
    {
      id: '2',
      question: 'Gói Premium có những quyền lợi gì?',
      answer: 'Gói Premium cho phép bạn nghe tất cả các truyện audio và video không giới hạn, truy cập nội dung độc quyền, tải về để nghe offline, và không có quảng cáo.',
    },
    {
      id: '3',
      question: 'Tôi có thể hủy đăng ký Premium bất cứ lúc nào không?',
      answer: 'Có, bạn có thể hủy đăng ký Premium bất cứ lúc nào. Sau khi hủy, bạn vẫn có thể sử dụng gói Premium cho đến hết kỳ đăng ký hiện tại.',
    },
    {
      id: '4',
      question: 'Làm sao để khôi phục lại gói Premium sau khi hủy?',
      answer: 'Bạn có thể đăng ký lại gói Premium bất cứ lúc nào. Chỉ cần chọn gói phù hợp và thanh toán, tài khoản của bạn sẽ được kích hoạt lại ngay lập tức.',
    },
    {
      id: '5',
      question: 'Phương thức thanh toán được hỗ trợ?',
      answer: 'Chúng tôi hỗ trợ thanh toán qua VietQR, thẻ tín dụng/thẻ ghi nợ, và ví điện tử. Tất cả giao dịch đều được bảo mật và an toàn.',
    },
  ];

  useEffect(() => {
    if (!propSubscriptions) {
      fetchSubscriptions();
    } else {
      setSubscriptions(propSubscriptions);
      setTotalRevenue(propSubscriptions.reduce((sum, s) => sum + s.amountVnd, 0));
    }
  }, [propSubscriptions]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await apiRequest<{ success: boolean; data: AdminSubscriptionRecord[] }>('/admin/subscriptions');
      if (response?.data && Array.isArray(response.data)) {
        setSubscriptions(response.data);
        setTotalRevenue(response.data.reduce((sum, s) => sum + s.amountVnd, 0));
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = subscriptions.filter(
    (s) =>
      s.userName.toLowerCase().includes(search.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      s.planName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/admin/support', {
        method: 'POST',
        body: JSON.stringify({
          question: selectedQuestion,
          message: supportMessage,
          email: supportEmail,
        }),
      });
      alert('Đã gửi yêu cầu hỗ trợ thành công!');
      setShowSupportForm(false);
      setSelectedQuestion('');
      setSupportMessage('');
      setSupportEmail('');
    } catch (error) {
      alert('Lỗi khi gửi yêu cầu hỗ trợ. Vui lòng thử lại.');
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Crown className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Doanh Số & Thành Viên VIP
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Quản Trị Doanh Thu Gói Cước Premium
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Theo dõi dòng tiền thuê bao, giao dịch ngân hàng VietQR và danh sách thành viên trả phí
          </p>
        </div>

        <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-3 px-4 flex items-center gap-3">
          <Coins className="w-6 h-6 text-amber-400" />
          <div>
            <div className="text-[10px] text-amber-400/90 font-mono font-bold uppercase tracking-wider">
              Doanh Thu Thực Tế
            </div>
            <div className="text-lg font-black text-amber-300 font-mono">
              {loading ? '...' : totalRevenue.toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-400" />
          Câu Hỏi Thường Gặp & Hỗ Trợ
        </h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.id} className="group [&_summary::-webkit-details-marker]:hidden">
              <summary
                className="flex cursor-pointer items-center justify-between gap-4 border-2 border-slate-700 bg-slate-950 px-4 py-3 font-medium text-gray-200 hover:bg-slate-800 focus:bg-slate-800 focus:outline-none rounded-xl"
              >
                <span className="font-semibold">{faq.question}</span>
                <ChevronDown className="size-5 shrink-0 group-open:-rotate-180 text-slate-400" />
              </summary>
              <div className="p-4 bg-slate-950/50 rounded-b-xl border-x-2 border-b-2 border-slate-700">
                <p className="text-slate-300">{faq.answer}</p>
                <button
                  onClick={() => {
                    setSelectedQuestion(faq.question);
                    setShowSupportForm(true);
                  }}
                  className="mt-3 text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  Cần hỗ trợ thêm?
                </button>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên thành viên, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 min-h-[42px] disabled:opacity-50"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {loading ? 'Đang tải...' : `${filtered.length} giao dịch ghi nhận`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3.5 px-4">Thành Viên</th>
                <th className="py-3.5 px-4">Gói Đăng Ký</th>
                <th className="py-3.5 px-4">Số Tiền (VND)</th>
                <th className="py-3.5 px-4">Phương Thức</th>
                <th className="py-3.5 px-4">Thời Hạn</th>
                <th className="py-3.5 px-4 text-right">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Không tìm thấy subscription nào.
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-white">{sub.userName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{sub.userEmail}</div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-amber-300 whitespace-nowrap">
                      {sub.planName}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                      {sub.amountVnd.toLocaleString('vi-VN')} đ
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                      {sub.paymentMethod}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-400 font-mono whitespace-nowrap">
                      {sub.startedAt} → <span className="text-white font-bold">{sub.expiresAt}</span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span
                        title="Giao dịch thanh toán thành công qua cổng VietQR"
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span>{sub.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Support Form Modal */}
      {showSupportForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-400" />
                Gửi Yêu Cầu Hỗ Trợ
              </h3>
              <button
                onClick={() => setShowSupportForm(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSupportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Câu hỏi</label>
                <input
                  type="text"
                  value={selectedQuestion}
                  readOnly
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email liên hệ</label>
                <input
                  type="email"
                  required
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nội dung hỗ trợ</label>
                <textarea
                  required
                  rows={4}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Mô tả chi tiết vấn đề bạn cần hỗ trợ..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupportForm(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl min-h-[40px] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 min-h-[40px] cursor-pointer"
                >
                  Gửi Yêu Cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
