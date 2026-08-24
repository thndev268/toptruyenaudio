import React, { useState, useEffect } from 'react';
import {
  Crown,
  Search,
  CreditCard,
  CheckCircle2,
  TrendingUp,
  Coins,
  ArrowUpRight,
} from 'lucide-react';
import { AdminSubscriptionRecord } from '../../../types/admin';
import { apiRequest } from '../../../services/apiClient';

interface PremiumScreenProps {
  subscriptions?: AdminSubscriptionRecord[];
}

export const PremiumScreen: React.FC<PremiumScreenProps> = ({ subscriptions: propSubscriptions }) => {
  const [search, setSearch] = useState('');
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionRecord[]>(propSubscriptions || []);
  const [loading, setLoading] = useState(!propSubscriptions);
  const [totalRevenue, setTotalRevenue] = useState(0);

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
    </div>
  );
};
