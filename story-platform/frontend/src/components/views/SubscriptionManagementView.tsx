import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { premiumRepository } from '../../services/repositories/PremiumRepository';
import { Crown, Calendar, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SubscriptionManagementView: React.FC = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await premiumRepository.getUserSubscription();
        if (response.success) {
          setSubscription(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscription();
  }, []);

  const handleToggleAutoRenew = async () => {
    if (!subscription) return;
    setUpdating(true);
    try {
      const response = await premiumRepository.updateAutoRenew(!subscription.autoRenew);
      if (response.success) {
        setSubscription({ ...subscription, autoRenew: !subscription.autoRenew });
      }
    } catch (error) {
      console.error('Failed to update auto-renewal:', error);
      alert('Không thể cập nhật tự động gia hạn. Vui lòng thử lại.');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <p>Đang tải thông tin gói...</p>
      </div>
    );
  }

  const isActive = subscription?.isActive && subscription?.status === 'ACTIVE';
  const isPremium = subscription?.plan && isActive;

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
              {isPremium ? (
                <span className="px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 rounded-full font-bold text-sm flex items-center gap-1.5">
                  <Crown className="w-4 h-4" /> Premium
                </span>
              ) : (
                <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full font-bold text-sm">
                  Miễn phí (FREE)
                </span>
              )}

              {isActive && (
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đang Hoạt Động
                </span>
              )}
              {subscription?.status === 'EXPIRED' && (
                <span className="text-rose-400 text-xs font-bold flex items-center gap-1 bg-rose-500/10 px-2 py-1 rounded">
                  <AlertCircle className="w-3.5 h-3.5" /> Đã Hết Hạn
                </span>
              )}
            </div>
          </div>

          <div>
            {!isPremium ? (
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

        {isPremium && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800 pt-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Ngày bắt đầu</p>
                <p className="text-sm font-semibold text-white">{formatDate(subscription.startAt)}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Hết hạn vào</p>
                <p className="text-sm font-semibold text-white">{formatDate(subscription.endAt)}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <Percent className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Thời gian còn lại</p>
                <p className="text-sm font-semibold text-white">{subscription.daysRemaining} ngày ({subscription.percentageRemaining}%)</p>
              </div>
            </div>

            <div className="sm:col-span-3 flex items-start gap-3 mt-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                <RefreshCw className={`w-4 h-4 ${subscription.autoRenew ? 'text-amber-400' : 'text-slate-500'}`} />
              </div>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Tự động gia hạn</p>
                  <p className="text-sm font-semibold text-white">
                    {subscription.autoRenew ? 'Đang Bật' : 'Đã Tắt'}
                  </p>
                  {subscription.shouldNotify && (
                    <p className="text-[10px] text-amber-400 mt-1">
                      Gói sắp hết hạn
                    </p>
                  )}
                </div>
                
                <button 
                  onClick={handleToggleAutoRenew}
                  disabled={updating}
                  className={`text-xs font-semibold px-4 py-2 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-nowrap ${
                    subscription.autoRenew 
                      ? "text-rose-400 hover:text-rose-300 border-rose-500/30 hover:bg-rose-500/10"
                      : "text-emerald-400 hover:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                  }`}
                >
                  {updating ? 'Đang cập nhật...' : (subscription.autoRenew ? 'Hủy Gia Hạn' : 'Bật Gia Hạn')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4">Thông Tin Gói</h3>
        {isPremium && subscription?.plan ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
              <span className="text-sm text-slate-400">Tên gói</span>
              <span className="text-sm font-semibold text-white">{subscription.plan.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
              <span className="text-sm text-slate-400">Giá</span>
              <span className="text-sm font-semibold text-white">{subscription.plan.price.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
              <span className="text-sm text-slate-400">Thời hạn</span>
              <span className="text-sm font-semibold text-white">{subscription.plan.durationDays} ngày</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-400">Trạng thái</span>
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs font-semibold">Hoạt động</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic text-center py-6">Bạn chưa có gói Premium nào.</p>
        )}
      </div>
    </div>
  );
};
