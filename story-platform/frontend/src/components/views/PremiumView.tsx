import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Check, AlertCircle, Headphones, LifeBuoy, X, Loader2, RefreshCw, Crown, Calendar, Percent, ChevronDown, Send } from 'lucide-react';
import { PremiumPlan, SubscriptionPlanId } from '../../types';
import { subscriptionRepository } from '../../services/repositories/SubscriptionRepository';
import { premiumRepository } from '../../services/repositories/PremiumRepository';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { Portal } from '../common/filter/Portal';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { PaymentQrCode } from '../common/PaymentQrCode';

const PLANS: PremiumPlan[] = [
  {
    code: 'PREMIUM_MONTHLY',
    name: 'Premium Tháng',
    priceVnd: 59000,
    durationDays: 30,
  },
  {
    code: 'PREMIUM_QUARTERLY',
    name: 'Premium 3 Tháng',
    priceVnd: 150000,
    durationDays: 90,
    originalPriceVnd: 177000,
    savingsVnd: 27000,
  },
  {
    code: 'PREMIUM_SEMIANNUAL',
    name: 'Premium 6 Tháng',
    priceVnd: 270000,
    durationDays: 180,
    originalPriceVnd: 354000,
    savingsVnd: 84000,
    isPopular: true,
  },
  {
    code: 'PREMIUM_ANNUAL',
    name: 'Premium 12 Tháng',
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
  const { user, updateUser, refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('PENDING');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [autoRenew, setAutoRenew] = useState(false);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const faqs = [
    {
      id: '1',
      question: 'Làm thế nào để đăng ký gói Premium?',
      answer: 'Bạn có thể đăng ký gói Premium bằng cách chọn gói phù hợp trong trang này và thanh toán qua cổng PayOS hoặc VietQR. Sau khi thanh toán thành công, tài khoản của bạn sẽ được nâng cấp ngay lập tức.',
    },
    {
      id: '2',
      question: 'Gói Premium có những quyền lợi gì?',
      answer: 'Gói Premium cho phép bạn nghe tất cả các truyện audio không giới hạn, truy cập nội dung độc quyền, tải về để nghe offline, không có quảng cáo, và hỗ trợ 24/7.',
    },
    {
      id: '3',
      question: 'Tôi có thể hủy đăng ký Premium bất cứ lúc nào không?',
      answer: 'Có, bạn có thể hủy đăng ký Premium bất cứ lúc nào. Sau khi hủy, bạn vẫn có thể sử dụng gói Premium cho đến hết kỳ đăng ký hiện tại.',
    },
    {
      id: '4',
      question: 'Phương thức thanh toán được hỗ trợ?',
      answer: 'Chúng tôi hỗ trợ thanh toán qua VietQR, thẻ tín dụng/thẻ ghi nợ, và ví điện tử qua cổng PayOS. Tất cả giao dịch đều được bảo mật và an toàn.',
    },
  ];

  useBodyScrollLock(isModalOpen);

  // Fetch user subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await premiumRepository.getUserSubscription();
        if (response.success && response.data) {
          setUserSubscription(response.data);
          setAutoRenew(response.data.autoRenew || false);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
    };
    fetchSubscription();
  }, [isSuccess]);

  const applyPaidMembership = useCallback(async () => {
    setPaymentStatus('PAID');
    try {
      await refreshUser();
    } catch (error) {
      console.error('Refresh user after payment failed:', error);
      if (selectedPlan) {
        await updateUser({
          membership: {
            tier: 'PREMIUM',
            subscriptionStatus: 'ACTIVE',
            planId: selectedPlan.code as SubscriptionPlanId,
            startedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000 * selectedPlan.durationDays).toISOString(),
          },
        });
      }
    }

    setTimeout(() => {
      setIsModalOpen(false);
    }, 2000);
  }, [selectedPlan, updateUser, refreshUser]);

  useEffect(() => {
    const orderCode = paymentResponse?.orderCode;
    if (!isModalOpen || !orderCode || paymentStatus === 'PAID') {
      return;
    }

    let cancelled = false;
    const POLL_INTERVAL_MS = 8000;

    const checkStatus = async () => {
      if (cancelled) return;

      try {
        setCheckingStatus(true);
        const response = await premiumRepository.checkPaymentStatus(orderCode);
        if (cancelled || !response.success) return;

        setPaymentStatus(response.data.status);

        if (response.data.status === 'PAID') {
          await applyPaidMembership();
        }
      } catch (error) {
        console.error('Payment status check error:', error);
      } finally {
        if (!cancelled) {
          setCheckingStatus(false);
        }
      }
    };

    const initialCheck = setTimeout(checkStatus, 2000);
    const interval = setInterval(checkStatus, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [isModalOpen, paymentResponse?.orderCode, paymentStatus, applyPaidMembership]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const handleSelectPlan = (plan: PremiumPlan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
    setIsSuccess(false);
    setPaymentResponse(null);
    setPaymentStatus('PENDING');
  };

  const handleCreatePayment = async () => {
    if (!selectedPlan || !user) return;

    setPaymentLoading(true);
    try {
      const response = await premiumRepository.createPayment(selectedPlan.code, autoRenew);
      if (response.success) {
        setPaymentResponse(response.data);
        setPaymentStatus('PENDING');
        setIsSuccess(true);
      } else {
        alert(response.message || 'Không thể tạo thanh toán. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error('Payment creation error:', error);
      const errorCode = error?.code;
      const errorMessage = error?.message;
      if (errorCode === 'PAYOS_NOT_CONFIGURED' || errorCode === 'PAYOS_TOKEN_NOT_CONFIGURED') {
        alert('Hệ thống thanh toán chưa được cấu hình. Vui lòng liên hệ quản trị viên.');
      } else if (errorCode === 'PAYOS_TOKEN_INVALID') {
        alert('Token thanh toán đã hết hạn. Admin cần cập nhật Gateway Token mới.');
      } else {
        alert(errorMessage || 'Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại.');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    try {
      const response = await premiumRepository.updateAutoRenew(!autoRenew);
      if (response.success) {
        setAutoRenew(!autoRenew);
        alert(response.message);
      }
    } catch (error) {
      console.error('Failed to update auto-renewal:', error);
      alert('Không thể cập nhật tự động gia hạn. Vui lòng thử lại.');
    }
  };

  const handleRetryStatusCheck = async () => {
    if (!paymentResponse) return;

    setCheckingStatus(true);
    try {
      const response = await premiumRepository.checkPaymentStatus(paymentResponse.orderCode);
      if (response.success) {
        setPaymentStatus(response.data.status);

        if (response.data.status === 'PAID') {
          await applyPaidMembership();
        }
      }
    } catch (error) {
      console.error('Payment status check error:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
    <>
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

        {/* Current Subscription Status */}
        {userSubscription && userSubscription.isActive && (
          <div className="max-w-4xl mx-auto mb-12 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gói Premium hiện tại</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Ngày còn lại</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{userSubscription.daysRemaining} ngày</p>
              </div>
              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Tiến độ</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{userSubscription.percentageRemaining}%</p>
              </div>
              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Gói</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{userSubscription.plan?.name || 'Premium'}</p>
              </div>
            </div>
            {userSubscription.endAt && (
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Ngày hết hạn: <span className="font-semibold text-slate-900 dark:text-white">
                  {new Date(userSubscription.endAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-renew"
                  checked={autoRenew}
                  onChange={handleToggleAutoRenew}
                  className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
                />
                <label htmlFor="auto-renew" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  Tự động gia hạn khi hết hạn
                </label>
              </div>
              {userSubscription.shouldNotify && (
                <div className="px-3 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold">
                  Sắp hết hạn
                </div>
              )}
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6 lg:gap-4 mb-16">
          {PLANS.map((plan) => (
            <div
              key={plan.code}
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col shadow-lg ${plan.isPopular ? 'scale-105' : ''}`}
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
                {plan.code === 'PREMIUM_SEMIANNUAL' && (
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
                className={`py-3.5 rounded-xl text-sm font-bold transition-all mb-8 shadow-md ${
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
            onClick={() => setShowSupportForm(true)}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-xl transition-colors whitespace-nowrap min-h-[44px]"
          >
            Gửi yêu cầu
          </button>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">Câu Hỏi Thường Gặp</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[4px_4px_0_0] shadow-slate-300 dark:shadow-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                  className="w-full flex cursor-pointer items-center justify-between gap-4 px-4 py-3 font-medium text-slate-900 dark:text-slate-100 hover:bg-yellow-50 dark:hover:bg-slate-800 focus:bg-yellow-50 dark:focus:bg-slate-800 focus:outline-none"
                >
                  <span className="font-semibold">{faq.question}</span>
                  <ChevronDown className={`size-5 shrink-0 text-slate-600 dark:text-slate-400 transition-transform ${openFaqId === faq.id ? 'rotate-180' : ''}`} />
                </button>
                {openFaqId === faq.id && (
                  <div className="p-4 bg-white dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-700">
                    <p className="text-slate-700 dark:text-slate-300">{faq.answer}</p>
                    <button
                      onClick={() => {
                        setSelectedQuestion(faq.question);
                        setShowSupportForm(true);
                      }}
                      className="mt-3 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Cần hỗ trợ thêm?
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
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
                  {paymentLoading ? 'Đang tạo thanh toán...' : 
                   paymentStatus === 'PAID' ? 'Thanh toán thành công!' :
                   paymentStatus === 'PENDING' ? 'Thanh toán đang chờ xử lý' :
                   'Thanh toán Premium'}
                </h2>
                
                {paymentLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Đang tạo yêu cầu thanh toán...</p>
                  </div>
                ) : paymentStatus === 'PAID' ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6">
                      <Check className="w-8 h-8 text-green-500 dark:text-green-400" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 text-center">
                      Chúc mừng! Bạn đã kích hoạt thành công gói <strong className="text-slate-900 dark:text-white">{selectedPlan.name}</strong>.
                      Tài khoản của bạn giờ đã có quyền Premium.
                    </p>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-full py-3 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-colors min-h-[44px]"
                    >
                      Tiếp tục trải nghiệm
                    </button>
                  </>
                ) : paymentResponse ? (
                  <>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Mã đơn hàng:</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{paymentResponse.orderCode}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Gói:</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{paymentResponse.planName}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Số tiền:</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(paymentResponse.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Trạng thái:</span>
                        <span className={`text-sm font-bold ${
                          paymentStatus === 'PENDING' ? 'text-amber-600 dark:text-amber-400' :
                          paymentStatus === 'PAID' ? 'text-green-600 dark:text-green-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {paymentStatus === 'PENDING' ? 'Chờ thanh toán' :
                           paymentStatus === 'PAID' ? 'Đã thanh toán' :
                           'Thất bại'}
                        </span>
                      </div>
                    </div>

                    {paymentResponse.qrCode && (
                      <div className="mb-6">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 text-center">Quét mã QR để thanh toán:</p>
                        <div className="flex justify-center">
                          <PaymentQrCode value={paymentResponse.qrCode} size={192} />
                        </div>
                      </div>
                    )}

                    {paymentResponse.checkoutUrl && (
                      <a 
                        href={paymentResponse.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-colors min-h-[44px] text-center mb-3"
                      >
                        Thanh toán qua cổng PayOS
                      </a>
                    )}

                    <div className="space-y-3">
                      <button
                        onClick={handleRetryStatusCheck}
                        disabled={checkingStatus}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {checkingStatus ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang kiểm tra...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Kiểm tra trạng thái
                          </>
                        )}
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
                      Bạn đã chọn gói <strong className="text-slate-900 dark:text-white">{selectedPlan.name}</strong> với giá <strong className="text-slate-900 dark:text-white">{formatCurrency(selectedPlan.priceVnd)}</strong>.
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={handleCreatePayment}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl transition-colors min-h-[44px]"
                      >
                        Tiến hành thanh toán
                      </button>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-xl transition-colors min-h-[44px]"
                      >
                        Hủy
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Support Form Modal */}
      {showSupportForm && (
        <Portal>
          <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-6 overflow-hidden" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowSupportForm(false)} />
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUpAndFade z-10 my-auto">
              <div className="p-6 sm:p-8">
                <button 
                  onClick={() => setShowSupportForm(false)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6">
                  <LifeBuoy className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Gửi Yêu Cầu Hỗ Trợ</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Chúng tôi sẽ phản hồi trong thời gian sớm nhất có thể.
                </p>

                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Câu hỏi</label>
                    <input
                      type="text"
                      value={selectedQuestion}
                      readOnly
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-500 dark:text-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email liên hệ</label>
                    <input
                      type="email"
                      required
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nội dung hỗ trợ</label>
                    <textarea
                      required
                      rows={4}
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="Mô tả chi tiết vấn đề bạn cần hỗ trợ..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSupportForm(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl min-h-[40px] cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 min-h-[40px] cursor-pointer"
                    >
                      Gửi Yêu Cầu
                    </button>
                  </div>
                </form>
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
    </>
  );
};
