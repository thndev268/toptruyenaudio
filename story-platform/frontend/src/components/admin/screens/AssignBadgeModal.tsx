import React, { useState, useEffect, useRef } from 'react';
import { Award, Search, CheckCircle2, AlertCircle, X, Shield, Lock, RotateCcw, AlertTriangle } from 'lucide-react';
import { badgeRepository } from '../../../services/repositories/BadgeRepository';
import { UserBadge, UserBadgeAssignment, BadgeLevel } from '../../../types/badges';
import { useBadgeToast } from '../../../context/BadgeToastContext';

interface AssignBadgeModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AssignBadgeModal: React.FC<AssignBadgeModalProps> = ({
  userId,
  userName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { checkUnseenBadges } = useBadgeToast();
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [userAssignments, setUserAssignments] = useState<UserBadgeAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form & Selection
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<BadgeLevel | 'ALL'>('ALL');
  const [internalNote, setInternalNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Revoke confirm state
  const [revokingBadgeId, setRevokingBadgeId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allBadges, userBadges] = await Promise.all([
        badgeRepository.getBadges({ status: 'ACTIVE' }),
        badgeRepository.getUserBadges(userId),
      ]);
      setBadges(allBadges);
      setUserAssignments(userBadges);
    } catch (e) {
      console.error('[AssignBadgeModal] Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setErrorMsg('');
      setSuccessMsg('');
      setSelectedBadgeId('');
      setInternalNote('');
      setShowConfirm(false);

      // Focus search input on open
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, userId]);

  // Keyboard accessibility: Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeBadgeIds = new Set(
    userAssignments.filter((a) => !a.revokedAt).map((a) => a.badgeId)
  );

  const filteredBadges = badges.filter((b) => {
    if (search.trim()) {
      const query = search.toLowerCase();
      const matchesName = b.name.toLowerCase().includes(query);
      const matchesCode = b.code.toLowerCase().includes(query);
      if (!matchesName && !matchesCode) return false;
    }
    if (selectedLevel !== 'ALL' && b.level !== selectedLevel) return false;
    return true;
  });

  const selectedBadgeObj = Array.isArray(badges) ? badges.find((b) => b.id === selectedBadgeId) : null;

  const handleAssignClick = () => {
    if (!selectedBadgeId) {
      setErrorMsg('Vui lòng chọn danh hiệu cần gán.');
      return;
    }
    setErrorMsg('');
    setShowConfirm(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedBadgeId) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await badgeRepository.assignBadge(
        userId,
        selectedBadgeId,
        'ADMIN',
        'Admin',
        internalNote.trim() || undefined
      );

      setSuccessMsg(`Đã gán danh hiệu "${selectedBadgeObj?.name}" thành công!`);
      setShowConfirm(false);
      setSelectedBadgeId('');
      setInternalNote('');

      // Reload data
      await loadData();
      checkUnseenBadges();

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gán danh hiệu thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (badgeId: string, badgeName: string) => {
    const reason = window.prompt(`Vui lòng nhập lý do thu hồi danh hiệu "${badgeName}" từ người dùng ${userName}:`);
    if (reason === null) return; // User cancelled
    if (!reason.trim()) {
      setErrorMsg('Bắt buộc phải nhập lý do thu hồi danh hiệu.');
      return;
    }

    try {
      await badgeRepository.revokeBadge(userId, badgeId, reason.trim());
      setSuccessMsg(`Đã thu hồi danh hiệu "${badgeName}" thành công.`);
      await loadData();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setErrorMsg(e.message || 'Thu hồi thất bại.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-badge-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 id="assign-badge-title" className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Gán Danh Hiệu Cho Người Dùng
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tài khoản: <strong className="text-slate-900 dark:text-white">{userName}</strong> (ID: {userId})
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Currently Assigned Active Badges */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Danh hiệu đang sở hữu ({userAssignments.filter((a) => !a.revokedAt).length}):
            </h4>

            {userAssignments.filter((a) => !a.revokedAt).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userAssignments
                  .filter((a) => !a.revokedAt)
                  .map((a) => (
                    <div
                      key={a.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{a.badge?.name || a.badgeId}</span>
                      <button
                        onClick={() => handleRevoke(a.badgeId, a.badge?.name || a.badgeId)}
                        className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors"
                        title="Thu hồi danh hiệu này"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Người dùng chưa được cấp danh hiệu nào.</p>
            )}
          </div>

          <hr className="border-slate-200 dark:border-slate-700" />

          {/* Badge Selection */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Chọn danh hiệu muốn gán:
            </h4>

            {/* Filter controls */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Lọc danh hiệu..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-semibold text-slate-900 dark:text-white shrink-0"
              >
                <option value="ALL">Tất cả cấp</option>
                <option value="COMMON">THÔNG THƯỜNG</option>
                <option value="RARE">HIẾM</option>
                <option value="EPIC">KINH ĐIỂN</option>
                <option value="LEGENDARY">HUYỀN THOẠI</option>
              </select>
            </div>

            {/* Badges Grid / Radio List */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {filteredBadges.map((b) => {
                const isAlreadyAssigned = activeBadgeIds.has(b.id);
                const isSelected = selectedBadgeId === b.id;

                return (
                  <label
                    key={b.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      isAlreadyAssigned
                        ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        : isSelected
                        ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="badgeSelection"
                        value={b.id}
                        disabled={isAlreadyAssigned}
                        checked={isSelected}
                        onChange={() => setSelectedBadgeId(b.id)}
                        className="w-4 h-4 text-amber-500 focus:ring-amber-500"
                      />

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{b.name}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase whitespace-nowrap tracking-wide ${
                            b.level === 'LEGENDARY' ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-950 dark:text-rose-100 border-rose-300 dark:border-rose-700' :
                            b.level === 'EPIC' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100 border-amber-300 dark:border-amber-700' :
                            b.level === 'RARE' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700' :
                            'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600'
                          }`}>
                            {b.level === 'COMMON' ? 'THÔNG THƯỜNG' :
                             b.level === 'RARE' ? 'HIẾM' :
                             b.level === 'EPIC' ? 'KINH ĐIỂN' :
                             b.level === 'LEGENDARY' ? 'HUYỀN THOẠI' : b.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{b.description}</p>
                      </div>
                    </div>

                    {isAlreadyAssigned && (
                      <span className="text-[10px] text-slate-500 font-semibold italic">Đã sở hữu</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Internal Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ghi chú quản trị (Không hiển thị công khai):
            </label>
            <input
              type="text"
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="VD: Vinh danh sự kiện nghe 100 giờ mùa Hè 2025"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          {/* Confirmation Step */}
          {showConfirm && selectedBadgeObj && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Xác nhận gán danh hiệu:</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Bạn chuẩn bị gán danh hiệu <strong className="text-amber-600 dark:text-amber-400">"{selectedBadgeObj.name}"</strong> cho người dùng <strong>{userName}</strong>. Người dùng sẽ nhận được thông báo ngay lập tức.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700 min-h-[44px]"
          >
            Hủy
          </button>

          {!showConfirm ? (
            <button
              onClick={handleAssignClick}
              disabled={!selectedBadgeId}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              Tiếp tục
            </button>
          ) : (
            <button
              onClick={handleConfirmAssign}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận Gán Danh Hiệu'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
