import React, { useState } from 'react';
import {
  Scale,
  Search,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { AdminCopyrightClaim } from '../../../types/admin';

interface CopyrightScreenProps {
  claims: AdminCopyrightClaim[];
  onResolveClaim: (claim: AdminCopyrightClaim) => void;
  onDismissClaim: (claim: AdminCopyrightClaim) => void;
}

export const CopyrightScreen: React.FC<CopyrightScreenProps> = ({
  claims,
  onResolveClaim,
  onDismissClaim,
}) => {
  const [search, setSearch] = useState('');

  const filtered = claims.filter(
    (c) =>
      c.workTitle.toLowerCase().includes(search.toLowerCase()) ||
      c.claimantName.toLowerCase().includes(search.toLowerCase()) ||
      c.organization.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Scale className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Pháp Lý & Tác Quyền
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Khiếu Nại Bản Quyền & Yêu Cầu Gỡ Bài
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Thẩm định hồ sơ sở hữu trí tuệ, giấy phép xuất bản và thực thi gỡ tác phẩm vi phạm
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
          {claims.filter((c) => c.status === 'PENDING').length} yêu cầu chờ thẩm định
        </span>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filtered.map((claim) => (
          <div
            key={claim.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-white">{claim.workTitle}</h3>
                <p className="text-xs text-slate-400">
                  Đơn vị khiếu nại: <span className="text-amber-300 font-medium">{claim.organization}</span> ({claim.claimantName} - {claim.claimantEmail})
                </p>
              </div>

              <span
                title={
                  claim.status === 'PENDING'
                    ? 'Khiếu nại bản quyền đang chờ Owner Admin thẩm định'
                    : claim.status === 'RESOLVED'
                    ? 'Đã chấp thuận khiếu nại và gỡ bỏ tác phẩm vi phạm'
                    : 'Đã bác bỏ khiếu nại do không đủ bằng chứng'
                }
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 ${
                  claim.status === 'PENDING'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : claim.status === 'RESOLVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-pulse" />
                <span>
                  {claim.status === 'PENDING'
                    ? 'Chờ thẩm định'
                    : claim.status === 'RESOLVED'
                    ? 'Đã gỡ audio'
                    : 'Đã bác bỏ'}
                </span>
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="text-slate-300">
                <span className="font-bold text-slate-400">Tác phẩm bị khiếu nại: </span>
                <span className="text-white font-bold">{claim.infringingStoryTitle}</span>
              </div>
              <div className="text-slate-300">
                <span className="font-bold text-slate-400">Mô tả vi phạm: </span>
                <span>{claim.description}</span>
              </div>
              <div className="pt-2 flex items-center gap-2">
                <a
                  href={claim.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-cyan-400 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Xem Giấy Phép / Bằng Chứng Pháp Lý</span>
                </a>
              </div>
            </div>

            {claim.actionTaken && (
              <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-cyan-400">Hành động của Owner Admin: </span>
                {claim.actionTaken}
              </div>
            )}

            {claim.status === 'PENDING' && (
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onDismissClaim(claim)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[40px]"
                >
                  Bác Bỏ Khiếu Nại
                </button>

                <button
                  type="button"
                  onClick={() => onResolveClaim(claim)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer min-h-[40px] font-bold"
                >
                  Chấp Thuận & Gỡ Tác Phẩm
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
