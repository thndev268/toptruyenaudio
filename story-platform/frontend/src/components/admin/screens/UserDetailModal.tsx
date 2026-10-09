import React, { useState } from 'react';
import { Award, 
  User,
  Crown,
  Shield,
  Clock,
  Headphones,
  Heart,
  Ban,
  Unlock,
  Trash2,
  X,
  History,
  CheckCircle2,
  AlertTriangle,
 } from 'lucide-react';
import { AdminUser, AdminAuditLogEntry } from '../../../types/admin';
import { FocusTrap } from '../../common/FocusTrap';
import { AssignBadgeModal } from './AssignBadgeModal';

interface UserDetailModalProps {
  isOpen: boolean;
  user: AdminUser | null;
  onClose: () => void;
  auditLogs: AdminAuditLogEntry[];
  onLockUser: (user: AdminUser) => void;
  onUnlockUser: (user: AdminUser) => void;
  onGrantPremium: (user: AdminUser) => void;
  onDeleteUser: (user: AdminUser) => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  user,
  onClose,
  auditLogs,
  onLockUser,
  onUnlockUser,
  onGrantPremium,
  onDeleteUser,
}) => {
  const [isAssignBadgeOpen, setIsAssignBadgeOpen] = useState(false);

  if (!isOpen || !user) return null;

  const userLogs = auditLogs.filter(
    (l) => l.entityId === user.id || l.impactScope?.includes(user.email)
  );

  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-detail-title"
    >
      <FocusTrap
        isActive={isOpen}
        onEscape={onClose}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh] animate-scaleUp"
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-800 flex items-center justify-between bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 id="user-detail-title" className="text-base font-bold text-white">
                Hồ Sơ Chi Tiết Người Dùng
              </h2>
              <p className="text-xs text-slate-400">
                Mã định danh: <span className="font-mono text-cyan-300">{user.id}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-750 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Đóng chi tiết"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - 2 Columns (8 cols main + 4 cols sidebar/actions on desktop) */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Info (8 cols) */}
            <div className="lg:col-span-8 space-y-5">
              {/* Profile Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">{user.name}</h3>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      title={
                        user.status === 'ACTIVE'
                          ? 'Tài khoản người dùng đang hoạt động bình thường'
                          : user.status === 'SUSPENDED'
                          ? 'Tài khoản đang bị tạm khóa truy cập'
                          : 'Tài khoản đã bị cấm vĩnh viễn do vi phạm điều khoản'
                      }
                      className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 ${
                        user.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : user.status === 'SUSPENDED'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-pulse" />
                      <span>
                        {user.status === 'ACTIVE'
                          ? 'Đang hoạt động'
                          : user.status === 'SUSPENDED'
                          ? 'Tạm khóa'
                          : 'Đã cấm'}
                      </span>
                    </span>

                    <span
                      title={
                        user.membershipTier === 'PREMIUM'
                          ? 'Thành viên VIP đã kích hoạt gói trả phí'
                          : 'Tài khoản thành viên thông thường (Free)'
                      }
                      className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 ${
                        user.membershipTier === 'PREMIUM'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {user.membershipTier === 'PREMIUM' && <Crown className="w-3.5 h-3.5 shrink-0" />}
                      <span>{user.membershipTier === 'PREMIUM' ? 'Hạng Premium' : 'Tài khoản Free'}</span>
                    </span>
                  </div>
                </div>

                {user.banReason && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Lý do khóa/cấm tài khoản:</span>
                    </div>
                    <p className="pl-5 text-slate-300">{user.banReason}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Lượt nghe</span>
                    </div>
                    <div className="text-base font-black text-white font-mono mt-1">
                      {user.totalListens}
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      <span>Yêu thích</span>
                    </div>
                    <div className="text-base font-black text-white font-mono mt-1">
                      {user.favoritesCount}
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Lịch sử nghe</span>
                    </div>
                    <div className="text-base font-black text-white font-mono mt-1">
                      {user.listenHistoryCount}
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Vai trò</span>
                    </div>
                    <div className="text-xs font-bold text-white font-mono mt-1">
                      {user.role}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Trail for this User */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <History className="w-4 h-4 text-cyan-400" />
                  <span>Nhật Ký Thao Tác Quản Trị Liên Quan</span>
                </div>

                {userLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    Chưa có nhật ký hoạt động nào can thiệp vào tài khoản này.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {userLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-slate-300 font-bold">
                          <span>{log.action}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {log.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{log.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Actions (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Thao Tác Quản Trị
                </h4>

                {user.isOwnerAdmin ? (
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs text-cyan-300">
                    <CheckCircle2 className="w-4 h-4 inline-block mr-1 text-cyan-400" />
                    <span>
                      Tài khoản Chủ Sở Hữu (Owner Admin) được bảo vệ, không thể tự khóa hoặc xóa.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {user.status === 'ACTIVE' ? (
                      <button
                        type="button"
                        onClick={() => onLockUser(user)}
                        className="w-full py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px]"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Tạm Khóa Tài Khoản</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onUnlockUser(user)}
                        className="w-full py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px]"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>Mở Khóa Hoạt Động</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onGrantPremium(user)}
                      className="w-full py-2.5 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px]"
                    >
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>{user.membershipTier === 'PREMIUM' ? 'Gia Hạn Thêm Premium' : 'Nâng Cấp Gói Premium'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAssignBadgeOpen(true)}
                      className="w-full py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px]"
                    >
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Gán & Quản Lý Danh Hiệu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteUser(user)}
                      className="w-full py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px]"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa Vĩnh Viễn Tài Khoản</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Account Meta */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase">
                  Thông Tin Kỹ Thuật
                </h4>
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngày đăng ký:</span>
                    <span>{user.createdAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Đăng nhập gần nhất:</span>
                    <span>{user.lastLoginAt}</span>
                  </div>
                  {user.premiumExpiresAt && (
                    <div className="flex justify-between text-amber-300 font-bold">
                      <span>Hết hạn Premium:</span>
                      <span>{user.premiumExpiresAt}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </FocusTrap>

      <AssignBadgeModal
        userId={user.id}
        userName={user.name}
        isOpen={isAssignBadgeOpen}
        onClose={() => setIsAssignBadgeOpen(false)}
      />
    </div>
  );
};
