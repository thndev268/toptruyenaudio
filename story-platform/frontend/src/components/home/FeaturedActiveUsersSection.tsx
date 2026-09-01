import React, { useState, useEffect } from 'react';
import { Award, Clock, Crown, UserCheck } from 'lucide-react';
import { UserActivityRanking } from '../../types';
import { ActiveUserDetailModal } from './ActiveUserDetailModal';
import { apiRequest } from '../../services/apiClient';

export const FeaturedActiveUsersSection: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<UserActivityRanking | null>(null);
  const [activeUsers, setActiveUsers] = useState<UserActivityRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest<UserActivityRanking[]>('/listening/rankings/users?period=week&limit=10');
        console.log('[FeaturedActiveUsersSection] Active users response:', response);
        
        const users = Array.isArray(response) ? response : [];
        console.log('[FeaturedActiveUsersSection] Setting active users:', users);
        setActiveUsers(users);
      } catch (error) {
        console.error('[FeaturedActiveUsersSection] Failed to fetch active users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-white">Thính Giả Tích Cực Trong Tuần</h2>
              <p className="text-xs text-slate-400">
                Nhấn vào thính giả để xem thành tích & thông tin chi tiết
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (activeUsers.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-white">Thính Giả Tích Cực Trong Tuần</h2>
              <p className="text-xs text-slate-400">
                Nhấn vào thính giả để xem thành tích & thông tin chi tiết
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <p className="text-slate-400 text-sm">Chưa có dữ liệu thính giả tích cực</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white">Thính Giả Tích Cực Trong Tuần</h2>
            <p className="text-xs text-slate-400">
              Nhấn vào thính giả để xem thành tích & thông tin chi tiết
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {activeUsers.slice(0, 3).map((user) => (
          <div
            key={user.userId}
            onClick={() => setSelectedUser(user)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedUser(user);
              }
            }}
            className="bg-slate-900 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-850 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg cursor-pointer transition-all hover:scale-[1.02] group relative overflow-hidden"
          >
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 group-hover:border-cyan-400/80 transition-colors">
                <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -top-1.5 -left-1.5 w-6 h-6 bg-amber-500 text-slate-950 font-mono text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md">
                <Crown className="w-3.5 h-3.5 fill-slate-950" />
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <div className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                  {user.displayName}
                </div>
                <span className="text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold shrink-0 flex items-center gap-0.5">
                  <UserCheck className="w-3 h-3" /> Xem hồ sơ
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="text-cyan-400 font-mono font-bold flex items-center gap-0.5">
                  <Clock className="w-3 h-3" /> {Math.round(user.validListeningMinutes / 60)}h nghe
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-mono font-bold">Lvl {user.level}</span>
              </div>

              <div className="flex flex-wrap gap-1 pt-0.5">
                {user.achievements?.map((a, i) => (
                  <span key={i} className="px-1.5 py-0.2 bg-slate-800 text-slate-300 text-[9px] font-mono rounded border border-slate-700">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Listener Profile Detail Modal */}
      <ActiveUserDetailModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
};

