import React, { useState } from 'react';
import { Sparkles, Check, AlertCircle, Headphones, LifeBuoy, X } from 'lucide-react';
import { PremiumPlan, SubscriptionPlanId } from '../../types';
import { subscriptionRepository } from '../../services/repositories/SubscriptionRepository';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { Portal } from '../common/filter/Portal';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

const PLANS: PremiumPlan[] = [
  {
    code: 'PREMIUM_MONTHLY',
    name: 'Premium 1 tháng',
    priceVnd: 59000,
    durationDays: 30,
  },
  {
    code: 'PREMIUM_QUARTERLY',
    name: 'Premium 3 tháng',
    priceVnd: 150000,
    durationDays: 90,
    originalPriceVnd: 177000,
    savingsVnd: 27000,
  },
  {
    code: 'PREMIUM_SEMI_ANNUAL',
    name: 'Premium 6 tháng',
    priceVnd: 270000,
    durationDays: 180,
    originalPriceVnd: 354000,
    savingsVnd: 84000,
    isPopular: true,
  },
  {
    code: 'PREMIUM_ANNUAL',
    name: 'Premium 1 năm',
    priceVnd: 480000,
    durationDays: 365,
    originalPriceVnd: 708000,
    savingsVnd: 228000,
    isBestDeal: true,
  },
];

const PRIVILEGES = [
  'Không quảng cáo thương mại.',
  'Âm thanh tối đa 320 kbps, tùy nguồn audio.',
  'Nghe toàn bộ nội dung thuộc danh mục TOP TRUYỆN AUDIO Premium.',
  'Nghe sớm một số tập được Creator/nền tảng cho phép.',
  'Tạo danh sách phát cá nhân không giới hạn.',
  'Huy hiệu Premium trong hồ sơ và khu vực đánh giá.',
  'Tiếp nhận yêu cầu hỗ trợ 24/7.',
  'Đồng bộ lịch sử, tiến độ và danh sách phát sau khi có backend.',
  'Ít banner quảng bá hơn.',
  'Quyền truy cập các tính năng Premium mới khi được phát triển.',
];

export const PremiumView: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useBodyScrollLock(isModalOpen);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const handleSelectPlan = (plan: PremiumPlan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
    setIsSuccess(false);
  };

  const handleSaveInterest = () => {
    if (selectedPlan && user) {
      const interestData = {
        userId: user.id,
        planCode: selectedPlan.code,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('toptruyenaudio:premium-interest:v1', JSON.stringify(interestData));
      
      subscriptionRepository.activateMockSubscription(user.id, selectedPlan.code as SubscriptionPlanId);
      
      // Update AuthContext user state immediately for instant feedback
      updateUser({
        membership: {
          tier: 'PREMIUM',
          subscriptionStatus: 'ACTIVE',
          planId: selectedPlan.code as SubscriptionPlanId,
          startedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000 * selectedPlan.durationDays).toISOString()
        }
      });
    }
    setIsSuccess(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn min-h-[calc(100vh-10rem)] flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-4 h-4" />
            Nâng cấp trải nghiệm
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            TOP TRUYỆN AUDIO <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Premium</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Chức năng thanh toán đang được chuẩn bị và chưa phát sinh giao dịch thật. Tham gia đăng ký nhận thông báo ngay hôm nay.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6 lg:gap-4 mb-16">
          {PLANS.map((plan) => (
            <div
              key={plan.code}
              className={`relative bg-white dark:bg-slate-900 rounded-3xl border ${
                plan.isPopular ? 'border-amber-500/50 shadow-2xl shadow-amber-500/10' : 'border-slate-200 dark:border-slate-800'
              } p-6 sm:p-8 flex flex-col shadow-lg`}
            >
              {(plan.isPopular || plan.isBestDeal) && (
                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-black uppercase tracking-wider rounded-full shadow-lg ${plan.isPopular ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950' : 'bg-cyan-500 text-slate-950'}`}>
                  {plan.isPopular ? 'Được đề xuất' : (plan.isBestDeal ? 'Tiết kiệm nhất' : '')}
                </div>
              )}

              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h2>
              
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">{formatCurrency(plan.priceVnd)}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">/ {plan.durationDays} ngày</span>
                </div>
                {plan.originalPriceVnd && plan.savingsVnd && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-slate-400 dark:text-slate-500 line-through">{formatCurrency(plan.originalPriceVnd)}</span>
                    <span className="text-xs font-bold text-green-700 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md">
                      Tiết kiệm {formatCurrency(plan.savingsVnd)}
                    </span>
                  </div>
                )}
                {plan.code === 'PREMIUM_SEMI_ANNUAL' && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-medium">Chỉ 45.000đ/tháng</p>
                )}
                {plan.code === 'PREMIUM_ANNUAL' && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-medium">Chỉ 40.000đ/tháng</p>
                )}
                {plan.code === 'PREMIUM_QUARTERLY' && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-medium">Chỉ 50.000đ/tháng</p>
                )}
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all mb-8 shadow-md ${
                  plan.isPopular
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:opacity-90'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Chọn gói {plan.durationDays / 30} tháng
              </button>

              <ul className="space-y-4 flex-1">
                {PRIVILEGES.map((privilege, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{privilege}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Support Section */}
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <LifeBuoy className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Tiếp nhận yêu cầu hỗ trợ 24/7</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Bạn có thể gửi yêu cầu bất cứ lúc nào. Thời gian phản hồi phụ thuộc mức độ ưu tiên và khả năng hỗ trợ thực tế. 
              (Tính năng đang được mô phỏng).
            </p>
          </div>
          <button 
            onClick={() => alert('Form hỗ trợ đang được phát triển.')}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-xl transition-colors whitespace-nowrap min-h-[44px]"
          >
            Gửi yêu cầu
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedPlan && (
        <Portal>
          <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-6 overflow-hidden" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUpAndFade z-10 my-auto">
              
              <div className="p-6 sm:p-8">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
                  {isSuccess ? <Check className="w-6 h-6 text-green-500 dark:text-green-400" /> : <AlertCircle className="w-6 h-6 text-amber-500 dark:text-amber-400" />}
                </div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {isSuccess ? 'Đã lưu lựa chọn!' : 'Thanh toán Premium đang được chuẩn bị'}
                </h2>
                
                {!isSuccess ? (
                  <>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                      Bạn đã chọn gói <strong className="text-slate-900 dark:text-white">{selectedPlan.name}</strong> với giá <strong className="text-slate-900 dark:text-white">{formatCurrency(selectedPlan.priceVnd)}</strong>.
                      Chức năng thanh toán sẽ được bổ sung trong giai đoạn phát triển tiếp theo.
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={handleSaveInterest}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl transition-colors min-h-[44px]"
                      >
                        Nhận thông báo khi mở thanh toán
                      </button>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-xl transition-colors min-h-[44px]"
                      >
                        Đóng
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                      Chúng tôi đã ghi nhận sự quan tâm của bạn với gói {selectedPlan.name}. Bạn sẽ nhận được thông báo ngay khi chức năng thanh toán chính thức ra mắt.
                    </p>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-xl transition-colors min-h-[44px]"
                    >
                      Đóng
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
      <div className="mt-12 pb-12 border-t border-slate-200 dark:border-slate-800 pt-8">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed max-w-xl mx-auto px-4">
          * Cam kết "Không quảng cáo" áp dụng cho các quảng cáo từ hệ thống TOP TRUYỆN AUDIO. 
          Các quảng cáo nằm trong nội dung gốc (ví dụ: MC đọc quảng cáo trong file audio) hoặc quảng cáo từ nền tảng thứ ba 
          phát sinh do giới hạn kỹ thuật (ví dụ: YouTube) không nằm trong phạm vi cam kết này.
        </p>
      </div>
    </div>
  );
};
