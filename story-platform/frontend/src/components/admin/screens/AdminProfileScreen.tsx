import React from 'react';
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  Lock,
  Radio,
  Clock,
} from 'lucide-react';
import { OwnerAdminProfile } from '../../../types/admin';

interface AdminProfileScreenProps {
  profile: OwnerAdminProfile;
}

export const AdminProfileScreen: React.FC<AdminProfileScreenProps> = ({ profile }) => {
  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 mb-1">
            <Shield className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Chủ Sở Hữu & Vận Hành Duy Nhất
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Hồ Sơ Quản Trị Viên Chủ Sở Hữu (Owner Admin)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Tài khoản nắm giữ toàn quyền điều hành hạ tầng, nội dung và tài chính nền tảng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold">
            OWNER_ADMIN (Bất khả xâm phạm)
          </span>
        </div>
      </div>

      {/* Main Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 p-1 shadow-2xl">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-full h-full rounded-full object-cover border-2 border-slate-900"
              referrerPolicy="no-referrer"
            />
          </div>

          <div>
            <h2 className="text-lg font-black text-white">{profile.name}</h2>
            <p className="text-xs text-rose-400 font-mono font-bold mt-0.5">{profile.title}</p>
            <p className="text-xs text-slate-400 mt-1">{profile.email}</p>
          </div>

          <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã định danh:</span>
              <span className="text-cyan-300 font-mono font-bold">{profile.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ngày gia nhập:</span>
              <span className="text-slate-300">{profile.joinedAt}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phiên làm việc:</span>
              <span className="text-emerald-400 font-bold">{profile.lastLoginAt}</span>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): System permissions & 2FA */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span>Đặc Quyền Vận Hành Toàn Hệ Thống</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Quyền hạn trực tiếp gắn liền với định danh `OWNER_ADMIN`, không cần qua phê duyệt cấp trên
            </p>
          </div>

          <div className="space-y-2.5">
            {profile.systemPermissions.map((perm, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3 text-xs"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-slate-200">{perm}</span>
              </div>
            ))}
          </div>

          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Xác Thực 2 Lớp (2FA Security)</div>
              <div className="text-[11px] text-emerald-400">
                Đang kích hoạt bảo vệ mức tối cao cho phiên làm việc Owner Admin
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
