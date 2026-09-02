import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';

export const ResetPasswordView: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for error parameters from Supabase
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (errorParam) {
      setError(errorDescription || 'Liên kết không hợp lệ hoặc đã hết hạn.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!password || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ mật khẩu.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    
    setSubmitting(true);
    try {
      // Use Supabase to update the password (this is the primary auth system)
      const { data: { user }, error: updateError } = await supabase.auth.updateUser({ 
        password 
      });
      
      if (updateError) throw updateError;
      
      // If we have a user, also sync with backend if needed
      if (user?.email) {
        try {
          // Call backend API to sync password (optional, depends on your architecture)
          // This is only needed if your backend also manages passwords separately
          const response = await fetch('/api/v1/auth/reset-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ newPassword: password }),
          });
          
          if (!response.ok) {
            console.warn('Backend password sync failed, but Supabase update succeeded');
          }
        } catch (backendError) {
          console.warn('Backend password sync failed, but Supabase update succeeded:', backendError);
          // Don't fail the whole process if backend sync fails
        }
      }
      
      setSuccess(true);
      showToast('success', 'Thành công', 'Mật khẩu đã được đặt lại thành công.');
      
      // Sign out after password reset for security
      await supabase.auth.signOut();
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu.';
      setError(errorMessage);
      showToast('error', 'Lỗi', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !success) {
    return (
      <div className="max-w-md mx-auto py-8 sm:py-12 animate-fadeIn">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/30">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Liên Kết Hết Hạn</h1>
            <p className="text-xs text-slate-400">{error}</p>
          </div>

          <div className="space-y-3">
            <Link
              to="/forgot-password"
              className="block w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all min-h-[44px] text-center"
            >
              Yêu Cầu Liên Kết Mới
            </Link>
            <Link
              to="/login"
              className="block w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all min-h-[44px] text-center"
            >
              Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto border border-cyan-500/30">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Đặt Lại Mật Khẩu</h1>
          <p className="text-xs text-slate-400">Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        {success ? (
          <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Đặt Lại Thành Công!</h3>
            <p className="text-xs text-slate-400">Mật khẩu của bạn đã được cập nhật. Đang chuyển hướng...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Mật khẩu mới</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[44px]"
                required
                minLength={6}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Xác nhận mật khẩu</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[44px]"
                required
                minLength={6}
              />
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all min-h-[44px] disabled:opacity-50"
            >
              {submitting ? 'Đang xử lý...' : 'Đặt Lại Mật Khẩu'}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800">
          <Link to="/login" className="text-cyan-400 font-bold hover:underline">
            Quay lại 登 nhập
          </Link>
        </div>
      </div>
    </div>
  );
};
