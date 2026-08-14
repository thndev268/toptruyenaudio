import React from 'react';
import { ShieldAlert, LogOut, HelpCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface BannedUserModalProps {
  isOpen: boolean;
  reason?: string;
}

export const BannedUserModal: React.FC<BannedUserModalProps> = ({ isOpen, reason }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!isOpen || !user) return null;

  const handleGoToSupport = () => {
    navigate('/support');
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
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
          Trong thời gian bị khóa, các tính năng nghe truyện, đánh giá, bình luận và thanh toán gói cước tạm thời bị đình chỉ. Nếu bạn tin rằng đây là nhầm lẫn, vui lòng gửi phản hồi trực tiếp tới Owner Admin.
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleGoToSupport}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all min-h-[44px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Gửi Yêu Cầu Hỗ Trợ</span>
          </button>

          <button
            onClick={() => logout()}
            className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all min-h-[44px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
};
