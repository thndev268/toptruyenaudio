import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, UserCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PwaInstallNotice } from '../common/PwaInstallNotice';
import { supabase } from '../../lib/supabase';

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('warning', 'Vui lòng điền email', 'Email không được để trống.');
      return;
    }
    if (!password) {
      showToast('warning', 'Vui lòng điền mật khẩu', 'Mật khẩu không được để trống.');
      return;
    }
    
    setSubmitting(true);
    try {
      await login(email, password);
      showToast('success', 'Đăng nhập thành công', 'Chào mừng bạn quay lại!');
      navigate(from, { replace: true });
    } catch (err: any) {
      showToast('error', 'Đăng nhập thất bại', err?.message || 'Có lỗi xảy ra.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      showToast('error', 'Đăng nhập thất bại', err?.message || `Lỗi khi kết nối với ${provider}`);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto border border-cyan-500/30">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Đăng Nhập</h1>
          <p className="text-xs text-slate-400">Thưởng thức kho audiobook & podcast mỗi đêm</p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <button 
            type="button"
            onClick={() => handleOAuthLogin('google')}
            className="w-full bg-white text-slate-900 rounded-xl px-4 py-3 min-h-[44px] flex items-center justify-center gap-3 font-semibold text-sm transition-transform active:scale-95 shadow-sm"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Tiếp tục với Google
          </button>
          
          <button 
            type="button"
            onClick={() => handleOAuthLogin('facebook')}
            className="w-full bg-[#1877F2] text-white rounded-xl px-4 py-3 min-h-[44px] flex items-center justify-center gap-3 font-semibold text-sm transition-transform active:scale-95 shadow-sm hover:bg-[#166FE5]"
          >
            <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="w-5 h-5" />
            Tiếp tục với Facebook
          </button>
        </div>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-slate-700"></div>
          <span className="shrink-0 text-xs text-slate-500 px-3">hoặc Tiếp tục bằng Email</span>
          <div className="flex-grow border-t border-slate-700"></div>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Email</label>
            <input
              type="email"
              placeholder="nhap.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[44px]"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[44px]"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-xs text-slate-400 hover:text-cyan-400 transition-colors">Quên mật khẩu?</Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4" />
            <span>{submitting ? 'Đang xử lý...' : 'Đăng Nhập'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-cyan-400 font-bold hover:underline ml-1">Đăng ký ngay</Link>
        </div>
      </div>
      <div className="mt-4">
        <PwaInstallNotice />
      </div>
    </div>
  );
};
