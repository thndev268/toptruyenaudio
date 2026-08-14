import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PwaInstallNotice } from '../common/PwaInstallNotice';

export const RegisterView: React.FC = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !username || !email || !password || !confirmPassword) {
      showToast('warning', 'Thiếu thông tin', 'Vui lòng điền đầy đủ các trường.');
      return;
    }
    if (username.length < 3 || username.length > 30) {
      showToast('warning', 'Tên đăng nhập không hợp lệ', 'Tên đăng nhập phải từ 3 đến 30 ký tự.');
      return;
    }
    if (password.length < 8) {
      showToast('warning', 'Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      showToast('error', 'Lỗi xác nhận mật khẩu', 'Mật khẩu nhập lại không khớp.');
      return;
    }
    if (!agreeTerms) {
      showToast('warning', 'Chưa đồng ý điều khoản', 'Bạn cần đồng ý với Điều khoản dịch vụ để đăng ký.');
      return;
    }
    
    setSubmitting(true);
    try {
      await register(name, email, password, username);
      showToast('success', 'Đăng ký thành công', 'Bạn có thể đăng nhập ngay hoặc kiểm tra email.');
      navigate('/login', { replace: true });
    } catch (err: any) {
      showToast('error', 'Đăng ký thất bại', err?.message || 'Có lỗi xảy ra.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto border border-cyan-500/30">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Đăng Ký Tài Khoản</h1>
          <p className="text-xs text-slate-400">Gia nhập cộng đồng người nghe truyện</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Họ và tên</label>
            <input
              type="text"
              placeholder="Vd: Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[44px]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Tên đăng nhập (Username)</label>
            <input
              type="text"
              placeholder="Vd: nguyenvana123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[44px]"
              required
            />
          </div>

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
                placeholder="Tối thiểu 8 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[44px]"
                required
                minLength={8}
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Nhập lại mật khẩu</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nhập lại mật khẩu ở trên"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[44px]"
              required
              minLength={8}
            />
          </div>

          <div className="flex items-start gap-3 py-2">
            <input 
              type="checkbox" 
              id="agreeTerms" 
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 shrink-0 accent-cyan-500" 
            />
            <label htmlFor="agreeTerms" className="text-xs text-slate-400 leading-snug cursor-pointer">
              Tôi đồng ý với <Link to="/terms" className="text-cyan-400 hover:underline">Điều khoản dịch vụ</Link> và <Link to="/privacy" className="text-cyan-400 hover:underline">Chính sách bảo mật</Link> của TOP TRUYỆN AUDIO.
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4" />
            <span>{submitting ? 'Đang xử lý...' : 'Tạo Tài Khoản'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-cyan-400 font-bold hover:underline ml-1">Đăng nhập ngay</Link>
        </div>
      </div>
      <div className="mt-4">
        <PwaInstallNotice />
      </div>
    </div>
  );
};
