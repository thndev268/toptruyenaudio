import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Settings,
} from 'lucide-react';
import { badgeRepository } from '../../../services/repositories/BadgeRepository';
import {
  UserBadge,
  BadgeLevel,
} from '../../../types/badges';

type SortOption = 'NAME_ASC' | 'NAME_DESC' | 'LEVEL_ASC' | 'LEVEL_DESC' | 'NEWEST' | 'OLDEST';

const LEVEL_WEIGHT: Record<BadgeLevel, number> = {
  LEGENDARY: 4,
  EPIC: 3,
  RARE: 2,
  COMMON: 1,
};

export const AdminBadgesScreen: React.FC = () => {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<BadgeLevel | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'HIDDEN'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('NEWEST');

  // Messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --- BADGE MODAL STATE ---
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<UserBadge | null>(null);
  const [isSubmittingBadge, setIsSubmittingBadge] = useState(false);

  // Badge Form Fields
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [icon, setIcon] = useState<string>('Award');
  const [level, setLevel] = useState<BadgeLevel>('COMMON');
  const [isActive, setIsActive] = useState<boolean>(true);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const allBadges = await badgeRepository.getBadges();
      setBadges(allBadges);
    } catch (e) {
      console.error('[AdminBadgesScreen] Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Open Create/Edit Badge Modal
  const openCreateBadgeModal = () => {
    setEditingBadge(null);
    setCode('');
    setName('');
    setDescription('');
    setIcon('Award');
    setLevel('COMMON');
    setIsActive(true);
    setErrorMsg('');
    setIsBadgeModalOpen(true);
  };

  const openEditBadgeModal = (b: UserBadge) => {
    setEditingBadge(b);
    setCode(b.code || '');
    setName(b.name || '');
    setDescription(b.description || '');
    setIcon(b.icon || 'Award');
    setLevel(b.level || 'COMMON');
    setIsActive(b.isActive ?? true);
    setErrorMsg('');
    setIsBadgeModalOpen(true);
  };

  const handleSubmitBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!code.trim() || !name.trim() || !description.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ Mã Code, Tên và Mô tả danh hiệu.');
      return;
    }

    setIsSubmittingBadge(true);
    try {
      if (editingBadge) {
        await badgeRepository.updateBadge(editingBadge.id, {
          code: code.trim(),
          name: name.trim(),
          description: description.trim(),
          iconUrl: icon, // Map icon to iconUrl for backend
          level,
          effects: [], // Initialize empty effects array
          isActive,
        });
        setSuccessMsg(`Cập nhật danh hiệu "${name}" thành công!`);
      } else {
        await badgeRepository.createBadge({
          code: code.trim(),
          name: name.trim(),
          description: description.trim(),
          iconUrl: icon, // Map icon to iconUrl for backend
          level,
          effects: [], // Initialize empty effects array
          isActive,
        });
        setSuccessMsg(`Tạo danh hiệu mới "${name}" thành công!`);
      }

      setIsBadgeModalOpen(false);
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Thao tác thất bại.');
    } finally {
      setIsSubmittingBadge(false);
    }
  };

  const handleDeleteBadge = async (badgeId: string, badgeName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa danh hiệu "${badgeName}"?`)) return;
    try {
      await badgeRepository.deleteBadge(badgeId);
      setSuccessMsg(`Đã xóa danh hiệu "${badgeName}".`);
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Xóa thất bại');
    }
  };

  const filteredBadges = useMemo(() => {
    return badges
      .filter((b) => {
        if (search.trim()) {
          const query = search.toLowerCase();
          const matchesName = b.name.toLowerCase().includes(query);
          const matchesCode = b.code.toLowerCase().includes(query);
          const matchesDesc = b.description.toLowerCase().includes(query);
          if (!matchesName && !matchesCode && !matchesDesc) return false;
        }

        if (selectedLevel !== 'ALL' && b.level !== selectedLevel) return false;
        if (selectedStatus === 'ACTIVE' && !b.isActive) return false;
        if (selectedStatus === 'HIDDEN' && b.isActive) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name, 'vi');
        if (sortBy === 'NAME_DESC') return b.name.localeCompare(a.name, 'vi');
        if (sortBy === 'LEVEL_ASC') return LEVEL_WEIGHT[a.level] - LEVEL_WEIGHT[b.level];
        if (sortBy === 'LEVEL_DESC') return LEVEL_WEIGHT[b.level] - LEVEL_WEIGHT[a.level];
        if (sortBy === 'NEWEST') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'OLDEST') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return 0;
      });
  }, [badges, search, selectedLevel, selectedStatus, sortBy]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-7 h-7 text-amber-500" />
            Hệ Thống Quản Lý Danh Hiệu & Sự Kiện Trao Thưởng
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Thiết lập danh hiệu thủ công, điều kiện trao tự động, sự kiện kích hoạt và nhật ký kiểm toán hệ thống.
          </p>
        </div>

        <button
          onClick={openCreateBadgeModal}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 self-start sm:self-auto min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Danh Hiệu Mới</span>
        </button>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ================= BADGES SECTION ================= */}
      <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã code, tên danh hiệu..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="ALL">Tất cả cấp độ</option>
              <option value="COMMON">COMMON (Thông thường - Xám)</option>
              <option value="RARE">RARE (Hiếm - Xanh lá)</option>
              <option value="EPIC">EPIC (Kinh điển - Vàng)</option>
              <option value="LEGENDARY">LEGENDARY (Huyền thoại - Đỏ)</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="NEWEST">Mới tạo nhất</option>
              <option value="OLDEST">Cũ nhất</option>
              <option value="NAME_ASC">Tên A-Z</option>
              <option value="LEVEL_DESC">Cấp độ cao - thấp</option>
            </select>
          </div>

          {/* Badges Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                <span>Đang tải danh hiệu từ máy chủ...</span>
              </div>
            ) : filteredBadges.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="p-4">Mã Code</th>
                      <th className="p-4">Tên & Mô Tả</th>
                      <th className="p-4">Cấp Độ</th>
                      <th className="p-4">Trạng Thái</th>
                      <th className="p-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                    {filteredBadges.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="p-4 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          {b.code}
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          <div>{b.name}</div>
                          <div className="text-xs font-normal text-slate-500 dark:text-slate-400 line-clamp-1">
                            {b.description}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                            b.level === 'LEGENDARY' ? 'bg-rose-100 text-rose-900 border-rose-300' :
                            b.level === 'EPIC' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                            b.level === 'RARE' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                            'bg-slate-100 text-slate-700 border-slate-300'
                          }`}>
                            {b.level === 'COMMON' ? 'THÔNG THƯỜNG' :
                             b.level === 'RARE' ? 'HIẾM' :
                             b.level === 'EPIC' ? 'KINH ĐIỂN' :
                             b.level === 'LEGENDARY' ? 'HUYỀN THOẠI' : b.level}
                          </span>
                        </td>
                        <td className="p-4">
                          {b.isActive ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                              <Eye className="w-3.5 h-3.5" /> Bật
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-semibold">
                              <EyeOff className="w-3.5 h-3.5" /> Tắt
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditBadgeModal(b)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBadge(b.id, b.name)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                              title="Xóa"
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
            ) : (
              <div className="p-8 text-center text-slate-500">
                Không tìm thấy danh hiệu nào.
              </div>
            )}
          </div>
        </div>

      {/* ================= BADGE CREATE/EDIT MODAL ================= */}
      {isBadgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                {editingBadge ? 'Cập Nhật Danh Hiệu' : 'Tạo Danh Hiệu Mới'}
              </h3>
              <button onClick={() => setIsBadgeModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBadge} className="p-6 overflow-y-auto space-y-4 flex-1">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mã Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="VD: LISTEN_100_HOURS"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold uppercase text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cấp Độ</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as BadgeLevel)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  >
                    <option value="COMMON">COMMON (Thông thường - Xám)</option>
                    <option value="RARE">RARE (Hiếm - Xanh lá)</option>
                    <option value="EPIC">EPIC (Kinh điển - Vàng)</option>
                    <option value="LEGENDARY">LEGENDARY (Huyền thoại - Đỏ)</option>
                  </select>
                  
                  {/* Preview màu sắc cấp độ */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                      level === 'LEGENDARY' ? 'bg-rose-100 text-rose-900 border-rose-300' :
                      level === 'EPIC' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                      level === 'RARE' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                      'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {level === 'COMMON' ? 'THÔNG THƯỜNG' :
                       level === 'RARE' ? 'HIẾM' :
                       level === 'EPIC' ? 'KINH ĐIỂN' :
                       level === 'LEGENDARY' ? 'HUYỀN THOẠI' : level}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Màu sắc hiển thị bên ngoài
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Danh Hiệu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Thính Giả Uyên Bác"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mô Tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả danh hiệu..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              {/* Award Mode Section - Simplified for now */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">Hình Thức Trao Danh Hiệu:</label>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <Settings className="w-4 h-4" />
                  <span>MANUAL (Admin cấp thủ công) - Chế độ mặc định hiện tại</span>
                </div>
                
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-amber-500"
                    />
                    <span>Bật trạng thái danh hiệu</span>
                  </label>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBadgeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 min-h-[40px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBadge}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 min-h-[40px]"
                >
                  {isSubmittingBadge ? 'Đang lưu...' : editingBadge ? 'Cập Nhật' : 'Tạo Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
