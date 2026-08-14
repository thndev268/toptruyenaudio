import React from 'react';
import { Sparkles, CheckCircle } from 'lucide-react';

interface PremiumBadgeProps {
  type?: 'PREMIUM' | 'VERIFIED';
  className?: string;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ type = 'PREMIUM', className = '' }) => {
  if (type === 'VERIFIED') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold uppercase tracking-wider ${className}`}
        title="Người nghe xác thực - Đã nghe đủ thời gian hợp lệ"
      >
        <CheckCircle className="w-3 h-3" /> Người nghe xác thực
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider ${className}`}
      title="Thành viên Premium"
    >
      <Sparkles className="w-3 h-3" /> PREMIUM
    </span>
  );
};
