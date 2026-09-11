import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Crown,
  Eye,
  Ban,
  Unlock,
  Shield,
  Trash2,
  Award,
} from 'lucide-react';
import { AdminUser } from '../../../types/admin';
import { AdminFilterPanel, AdminFilterItem } from '../common/AdminFilterPanel';
import { AssignBadgeModal } from './AssignBadgeModal';

interface UsersScreenProps {
  users: AdminUser[];
  onViewUser: (user: AdminUser) => void;
  onLockUser: (user: AdminUser) => void;
  onUnlockUser: (user: AdminUser) => void;
  onGrantPremium: (user: AdminUser) => void;
  onDeleteUser: (user: AdminUser) => void;
}

export const UsersScreen: React.FC<UsersScreenProps> = ({
  users,
  onViewUser,
  onLockUser,
  onUnlockUser,
  onGrantPremium,
  onDeleteUser,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'CREATOR' | 'PARTNER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'BANNED'>('ALL');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'FREE' | 'PREMIUM'>('ALL');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [assignTargetUser, setAssignTargetUser] = useState<AdminUser | null>(null);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (roleFilter !== 'ALL') count++;
    if (statusFilter !== 'ALL') count++;
    if (tierFilter !== 'ALL') count++;
    return count;
  }, [roleFilter, statusFilter, tierFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setTierFilter('ALL');
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.id.toLowerCase().includes(search.toLowerCase());

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      const matchTier = tierFilter === 'ALL' || u.tier === tierFilter;

      return matchSearch && matchRole && matchStatus && matchTier;
    });
  }, [users, search, roleFilter, statusFilter, tierFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Search & Global Filters Row */}
      <AdminFilterPanel
        searchTerm={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm theo tên, email, ID người dùng..."
        isExpanded={isFilterVisible}
        onToggleExpand={() => setIsFilterVisible(!isFilterVisible)}
        onReset={handleResetFilters}
        activeCount={activeFilterCount}
      >
        <AdminFilterItem label="Vai trò">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[42px] cursor-pointer"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="USER">Người nghe (User)</option>
            <option value="CREATOR">Tác giả / MC (Creator)</option>
            <option value="PARTNER">Đối tác phát hành (Partner)</option>
          </select>
        </AdminFilterItem>

        <AdminFilterItem label="Trạng thái">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[42px] cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="SUSPENDED">Tạm khóa</option>
            <option value="BANNED">Cấm vĩnh viễn</option>
          </select>
        </AdminFilterItem>

        <AdminFilterItem label="Gói cước">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[42px] cursor-pointer"
          >
            <option value="ALL">Tất cả gói cước</option>
            <option value="FREE">Miễn phí (Free)</option>
            <option value="PREMIUM">Hạng VIP (Premium)</option>
          </select>
        </AdminFilterItem>
      </AdminFilterPanel>

      {/* Desktop / Tablet Table View */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3.5 px-4">Người Dùng</th>
                <th className="py-3.5 px-4">Vai Trò</th>
                <th className="py-3.5 px-4 text-center">Gói</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4">Đăng Nhập Gần Nhất</th>
                <th className="py-3.5 px-4">IP Đăng Nhập</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {user.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      user.role === 'ADMIN' ? 'bg-rose-500/10 text-rose-400' :
                      user.role === 'CREATOR' ? 'bg-cyan-500/10 text-cyan-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {user.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                      {user.role === 'CREATOR' && <Users className="w-3 h-3" />}
                      {user.role}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                      user.tier === 'PREMIUM' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-950 text-slate-600'
                    }`}>
                      {user.tier === 'PREMIUM' && <Crown className="w-3 h-3" />}
                      {user.tier}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className={`flex items-center gap-1.5 text-[11px] font-bold ${
                      user.status === 'ACTIVE' ? 'text-emerald-400' :
                      user.status === 'BANNED' ? 'text-rose-500' :
                      'text-amber-500'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        user.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                        user.status === 'BANNED' ? 'bg-rose-500' :
                        'bg-amber-500'
                      }`} />
                      {user.status === 'ACTIVE' ? 'Đang hoạt động' :
                       user.status === 'BANNED' ? 'Đã bị cấm' : 'Tạm khóa'}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs text-slate-500">
                    {user.lastLoginAt}
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-xs font-mono text-slate-400">
                      {user.lastLoginIp || <span className="text-slate-600 italic">Chưa ghi nhận</span>}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onViewUser(user)}
                        className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-all"
                        title="Chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => setAssignTargetUser(user)}
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all"
                        title="Gán danh hiệu"
                      >
                        <Award className="w-4 h-4" />
                      </button>

                      {user.status === 'ACTIVE' ? (
                        <button
                          onClick={() => onLockUser(user)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                          title="Khóa tài khoản"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onUnlockUser(user)}
                          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all"
                          title="Mở khóa"
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                      )}

                      {user.tier === 'FREE' && (
                        <button
                          onClick={() => onGrantPremium(user)}
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all"
                          title="Nâng cấp VIP"
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onDeleteUser(user)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Xóa vĩnh viễn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold overflow-hidden">
                  {user.avatar ? <img src={user.avatar} alt="" /> : user.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{user.name}</div>
                  <div className="text-[10px] text-slate-500">{user.role} • {user.tier}</div>
                </div>
              </div>
              <div className={`text-[10px] font-bold ${
                user.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-500'
              }`}>
                {user.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 'BỊ KHÓA'}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500">Đăng nhập gần nhất:</span>
                <span className="text-slate-400">{user.lastLoginAt}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500">IP đăng nhập:</span>
                <span className="text-slate-400 font-mono">{user.lastLoginIp || <span className="italic text-slate-600">Chưa ghi nhận</span>}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onViewUser(user)}
                className="py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> Chi tiết
              </button>
              <button
                onClick={() => setAssignTargetUser(user)}
                className="py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-bold rounded-xl border border-amber-500/30 flex items-center justify-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" /> Gán danh hiệu
              </button>
              {user.status === 'ACTIVE' ? (
                <button
                  onClick={() => onLockUser(user)}
                  className="py-2 bg-slate-800 hover:bg-slate-750 text-rose-400 text-[11px] font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" /> Khóa
                </button>
              ) : (
                <button
                  onClick={() => onUnlockUser(user)}
                  className="py-2 bg-slate-800 hover:bg-slate-750 text-emerald-400 text-[11px] font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" /> Mở khóa
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {assignTargetUser && (
        <AssignBadgeModal
          userId={assignTargetUser.id}
          userName={assignTargetUser.name}
          isOpen={!!assignTargetUser}
          onClose={() => setAssignTargetUser(null)}
        />
      )}
    </div>
  );
};
