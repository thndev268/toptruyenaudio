import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, CheckCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';

export const ForgotPasswordView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      
      setSent(true);
      showToast('success', 'Đã gửi yêu cầu', 'Vui lòng kiểm tra email của bạn để đặt lại mật khẩu.');
    } catch (err: any) {
      showToast('error', 'Lỗi', err?.message || 'Có lỗi xảy ra khi gửi yêu cầu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto border border-cyan-500/30">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Quên Mật Khẩu</h1>
          <p className="text-xs text-slate-400">Nhập email đăng ký để nhận liên kết khôi phục</p>
        </div>

        {sent ? (
          <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Đã Gửi Yêu Cầu!</h3>
            <p className="text-xs text-slate-400">Nếu email {email} tồn tại trong hệ thống, hướng dẫn đặt lại sẽ xuất hiện trong hộp thư.</p>
            <Link
              to="/login"
              className="inline-block mt-4 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
            >
              Quay lại Đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Email của bạn</label>
              <input
                type="email"
                placeholder="nhap.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[44px]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all min-h-[44px] disabled:opacity-50"
            >
              {submitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Khôi Phục'}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800">
          Nhớ mật khẩu?{' '}
          <Link to="/login" className="text-cyan-400 font-bold hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};
