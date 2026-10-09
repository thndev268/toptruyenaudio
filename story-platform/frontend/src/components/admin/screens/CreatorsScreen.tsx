import React, { useState } from 'react';
import {
  UserCheck,
  Check,
  X,
  Play,
  Pause,
  Clock,
  FileAudio,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { AdminCreatorApplication } from '../../../types/admin';

interface CreatorsScreenProps {
  applications: AdminCreatorApplication[];
  onApproveApplication: (app: AdminCreatorApplication) => void;
  onRejectApplication: (app: AdminCreatorApplication) => void;
}

export const CreatorsScreen: React.FC<CreatorsScreenProps> = ({
  applications,
  onApproveApplication,
  onRejectApplication,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const toggleAudio = (id: string, url: string) => {
    if (playingId === id) {
      audioElem?.pause();
      setPlayingId(null);
    } else {
      audioElem?.pause();
      const a = new Audio(url);
      a.play().catch(() => {});
      a.onended = () => setPlayingId(null);
      setAudioElem(a);
      setPlayingId(id);
    }
  };

  const filtered = applications.filter((app) => {
    const matchSearch =
      app.creatorName.toLowerCase().includes(search.toLowerCase()) ||
      app.email.toLowerCase().includes(search.toLowerCase()) ||
      app.storyTitle.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <UserCheck className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Thẩm Định Tác Giả & Creator
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Duyệt Đơn Đăng Ký Tác Giả & Creator
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Thẩm định hồ sơ tác giả và bản quyền tác phẩm trước khi cấp quyền xuất bản
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold">
            {applications.filter((a) => a.status === 'PENDING').length} đơn đang chờ duyệt
          </span>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên tác giả, email, tác phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[42px]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[42px] cursor-pointer sm:w-48"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Đang chờ thẩm định</option>
          <option value="APPROVED">Đã phê duyệt</option>
          <option value="REJECTED">Đã từ chối</option>
        </select>
      </div>

      {/* Applications List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((app) => (
          <div
            key={app.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-bold text-white text-base truncate">{app.creatorName}</div>
                  <div className="text-xs text-slate-400 truncate">{app.email} · {app.phone}</div>
                </div>

                <span
                  title={
                    app.status === 'PENDING'
                      ? 'Đơn đang chờ Owner Admin thẩm định tác giả'
                      : app.status === 'APPROVED'
                      ? 'Đã duyệt cấp quyền Creator (Tác Giả)'
                      : 'Đã từ chối đơn đăng ký'
                  }
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 ${
                    app.status === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : app.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-pulse" />
                  <span>
                    {app.status === 'PENDING'
                      ? 'Chờ duyệt'
                      : app.status === 'APPROVED'
                      ? 'Đã duyệt'
                      : 'Từ chối'}
                  </span>
                </span>
              </div>

              {/* Story sample box */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <FileAudio className="w-3.5 h-3.5" />
                    <span>Dự án: {app.storyTitle}</span>
                  </span>
                  <span className="text-slate-500 text-[11px] font-mono">
                    {app.sampleChaptersCount} tập demo
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  <span className="text-slate-500 font-bold">Kinh nghiệm: </span>
                  {app.experience}
                </p>

                {/* Audio Sample Player Button */}
                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleAudio(app.id, app.sampleAudioUrl)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {playingId === app.id ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Dừng Nghe Mẫu</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Nghe File Mẫu Demo (HQ)</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{app.submittedAt}</span>
                  </span>
                </div>
              </div>

              {app.reviewNotes && (
                <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-bold text-slate-300">Ghi chú duyệt: </span>
                  {app.reviewNotes}
                </div>
              )}
            </div>

            {/* Actions for Pending */}
            {app.status === 'PENDING' && (
              <div className="pt-2 flex items-center gap-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onRejectApplication(app)}
                  className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[42px]"
                >
                  <X className="w-4 h-4" />
                  <span>Từ Chối Đơn</span>
                </button>

                <button
                  type="button"
                  onClick={() => onApproveApplication(app)}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer min-h-[42px]"
                >
                  <Check className="w-4 h-4" />
                  <span>Phê Duyệt Creator</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
