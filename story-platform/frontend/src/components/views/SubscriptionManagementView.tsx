import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subscriptionRepository } from '../../services/repositories/SubscriptionRepository';
import { Crown, Calendar, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SubscriptionManagementView: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <p>Vui lòng đăng nhập để xem thông tin gói.</p>
        <Link to="/login" className="mt-4 px-6 py-2 bg-cyan-500 text-slate-900 font-bold rounded-full">
          Đăng nhập
        </Link>
      </div>
    );
  }

  const sub = subscriptionRepository.getCurrentSubscription(user.id);
  const [subscription, setSubscription] = useState(sub);

  const handleCancelRenewal = () => {
    if (window.confirm('Bạn có chắc chắn muốn hủy tự động gia hạn? Bạn vẫn có thể sử dụng Premium đến hết chu kỳ hiện tại.')) {
      const updated = subscriptionRepository.cancelMockRenewal(user.id);
      setSubscription(updated);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Crown className="text-amber-400 w-6 h-6" /> Quản Lý Gói Premium
      </h1>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-200">Gói Hiện Tại</h2>
            <div className="flex items-center gap-2 mt-2">
              {subscription.membershipTier === 'PREMIUM' ? (
                <span className="px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 rounded-full font-bold text-sm flex items-center gap-1.5">
                  <Crown className="w-4 h-4" /> Premium
                </span>
              ) : (
                <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full font-bold text-sm">
                  Miễn phí (FREE)
                </span>
              )}

              {subscription.status === 'ACTIVE' && (
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đang Hoạt Động
                </span>
              )}
              {subscription.status === 'EXPIRED' && (
                <span className="text-rose-400 text-xs font-bold flex items-center gap-1 bg-rose-500/10 px-2 py-1 rounded">
                  <AlertCircle className="w-3.5 h-3.5" /> Đã Hết Hạn
                </span>
              )}
            </div>
          </div>

          <div>
            {subscription.membershipTier === 'FREE' || subscription.status === 'EXPIRED' ? (
              <Link to="/premium" className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-xl shadow-lg hover:shadow-amber-500/25 transition-all inline-block text-center">
                Khám Phá Gói Premium
              </Link>
            ) : (
              <Link to="/premium" className="px-6 py-2 text-slate-300 border border-slate-700 hover:bg-slate-800 font-bold rounded-xl transition-all inline-block text-center">
                Đổi Gói Khác
              </Link>
            )}
          </div>
        </div>

        {subscription.membershipTier === 'PREMIUM' && subscription.status === 'ACTIVE' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Ngày bắt đầu</p>
                <p className="text-sm font-semibold text-white">{formatDate(subscription.startedAt)}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Hết hạn vào</p>
                <p className="text-sm font-semibold text-white">{formatDate(subscription.expiresAt)}</p>
              </div>
            </div>
            
            <div className="sm:col-span-2 flex items-start gap-3 mt-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <RefreshCw className={`w-4 h-4 ${subscription.autoRenew ? 'text-amber-400' : 'text-slate-500'}`} />
              </div>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Tự động gia hạn</p>
                  <p className="text-sm font-semibold text-white">
                    {subscription.autoRenew ? 'Đang Bật' : 'Đã Tắt'}
                  </p>
                  {subscription.cancelledAt && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Đã hủy vào: {formatDate(subscription.cancelledAt)}
                    </p>
                  )}
                </div>
                
                {subscription.autoRenew && (
                  <button 
                    onClick={handleCancelRenewal}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-4 py-2 border border-rose-500/30 rounded-lg hover:bg-rose-500/10 transition-colors"
                  >
                    Hủy Gia Hạn
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4">Lịch Sử Đăng Ký</h3>
        {subscription.membershipTier === 'PREMIUM' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Ngày</th>
                  <th className="px-4 py-3">Gói</th>
                  <th className="px-4 py-3">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800/50">
                  <td className="px-4 py-3">{formatDate(subscription.startedAt)}</td>
                  <td className="px-4 py-3 text-white font-medium">{subscription.planId}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs">Thành công</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic text-center py-6">Chưa có giao dịch đăng ký nào.</p>
        )}
        
        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-xs text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            Lưu ý: Các gói và quy trình thanh toán hiện chỉ là dữ liệu mô phỏng frontend. Chưa phát sinh giao dịch thật. Tính năng thanh toán sẽ được phát triển ở giai đoạn sau.
          </p>
        </div>
      </div>
    </div>
  );
};
