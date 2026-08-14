import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Calendar, ShieldCheck, Award, Star, Lock, Sparkles, ArrowLeft } from 'lucide-react';
import { badgeRepository } from '../../services/repositories/BadgeRepository';
import { UserBadgeAssignment } from '../../types/badges';
import { UserBadgeCard } from '../badges/UserBadgeCard';
import { PremiumBadge } from '../common/PremiumBadge';
import { useAuth } from '../../context/AuthContext';

interface PublicUserProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  joinedAt?: string;
  isPremium?: boolean;
}

export const PublicProfileView: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [publicBadges, setPublicBadges] = useState<UserBadgeAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        // Fetch public user badges (Strictly filtered by visibility === 'PUBLIC')
        const badges = await badgeRepository.getPublicUserBadges(userId);
        setPublicBadges(badges);

        // Fetch basic public info (No private data like email/phone)
        // If current user, use currentUser data
        if (currentUser && (currentUser.id === userId || userId === 'me')) {
          setProfile({
            id: currentUser.id,
            displayName: currentUser.name || 'Thính Giả',
            avatarUrl: currentUser.avatarUrl,
            bio: 'Yêu thích lắng nghe những câu chuyện hay.',
            joinedAt: '2025-01-01',
            isPremium: currentUser.membership?.tier === 'PREMIUM' || currentUser.isPremium,
          });
        } else {
          // Public mock profile for other users
          setProfile({
            id: userId,
            displayName: `Thính Giả #${userId.slice(0, 6)}`,
            avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
            bio: 'Đam mê truyện audio tiên hiệp và trinh thám.',
            joinedAt: '2025-01-15',
            isPremium: userId === 'user-premium',
          });
        }
      } catch (e) {
        console.error('[PublicProfileView] Error fetching public profile:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, [userId, currentUser]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        Đang tải hồ sơ...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Không tìm thấy người dùng</h2>
        <Link to="/" className="inline-flex items-center gap-2 text-amber-500 font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Link>
      </div>
    );
  }

  const featuredBadge = publicBadges.find((b) => b.isFeatured);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-amber-500/20 bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-slate-400" />
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              {profile.displayName}
            </h1>

            {/* Premium status is displayed via PremiumBadge explicitly */}
            {profile.isPremium && <PremiumBadge type="PREMIUM" />}
          </div>

          {profile.bio && (
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {profile.bio}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Tham gia {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString('vi-VN') : '2025'}
            </span>

            <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <Award className="w-3.5 h-3.5" />
              {publicBadges.length} danh hiệu công khai
            </span>
          </div>
        </div>
      </div>

      {/* Featured Badge Highlight */}
      {featuredBadge && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-current" />
            Danh Hiệu Nổi Bật
          </h3>

          <div className="max-w-md">
            <UserBadgeCard assignment={featuredBadge} isOwner={false} />
          </div>
        </div>
      )}

      {/* Public Badges Collection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Bộ Sưu Tập Danh Hiệu
          </h3>

          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Đã ẩn các danh hiệu riêng tư
          </span>
        </div>

        {publicBadges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {publicBadges.map((assignment) => (
              <UserBadgeCard key={assignment.id} assignment={assignment} isOwner={false} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400">
            Người dùng chưa công khai danh hiệu nào.
          </div>
        )}
      </div>
    </div>
  );
};
