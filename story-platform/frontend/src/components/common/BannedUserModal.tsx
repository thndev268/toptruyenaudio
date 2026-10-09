import React, { useEffect } from 'react';
import { ShieldAlert, HelpCircle, AlertTriangle, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BannedUserModalProps {
  isOpen: boolean;
  reason?: string;
}

export const BannedUserModal: React.FC<BannedUserModalProps> = ({ isOpen, reason }) => {
  const { user } = useAuth();

  // Disable all interactions when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Prevent escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleContactZalo = () => {
    // Zalo link - replace with actual Zalo number
    window.open('https://zalo.me/0388888888', '_blank');
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl shadow-rose-900/40 space-y-6 text-center relative overflow-hidden">
        {/* Decorative Top Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10 animate-bounce">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Tài Khoản Đã Bị Khóa</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            Tài khoản của bạn đã bị khóa bởi quản trị viên
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Tài khoản <strong className="text-rose-300 underline font-mono">{user.email}</strong> đã bị Ban Quản Trị tạm thời khóa hoặc cấm hoạt động trên hệ thống TOP TRUYỆN AUDIO.
          </p>
        </div>

        {/* Reason Box */}
        <div className="bg-slate-950 border border-rose-500/30 rounded-2xl p-4 text-left space-y-1.5 shadow-inner">
          <div className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>Lý do ghi nhận từ Ban Quản Trị:</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 font-medium italic leading-relaxed">
            "{reason || 'Vi phạm điều khoản dịch vụ và quy tắc cộng đồng.'}"
          </p>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Trong thời gian bị khóa, các tính năng nghe truyện, đánh giá, bình luận và thanh toán gói cước tạm thời bị đình chỉ. Nếu bạn tin rằng đây là nhầm lẫn, vui lòng liên hệ trực tiếp với Owner Admin qua Zalo để được hỗ trợ.
        </p>

        {/* Action Button - Only Zalo contact */}
        <div className="pt-2">
          <button
            onClick={handleContactZalo}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-lg shadow-cyan-500/20 transition-all min-h-[52px] flex items-center justify-center gap-3 cursor-pointer"
          >
            <Phone className="w-5 h-5" />
            <span>Liên Hệ Admin Qua Zalo</span>
          </button>
        </div>

        <p className="text-[10px] text-slate-500 font-mono">
          Liên hệ Zalo để giải quyết vấn đề tài khoản
        </p>
      </div>
    </div>
  );
};
