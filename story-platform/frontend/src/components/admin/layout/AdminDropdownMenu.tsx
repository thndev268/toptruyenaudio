import React, { useRef, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ChevronDown, LucideIcon } from 'lucide-react';

export interface AdminNavItem {
  id: string;
  label: string;
  route: string;
  icon: LucideIcon;
  badge?: number;
  badgeColor?: 'cyan' | 'rose' | 'amber' | 'emerald';
  description?: string;
}

export interface AdminNavGroup {
  id: string;
  label?: string;
  shortLabel?: string;
  fullLabel?: string;
  icon?: LucideIcon;
  route?: string; // If set and items is empty or 1, can act as direct link
  items: AdminNavItem[];
}

interface AdminDropdownMenuProps {
  group: AdminNavGroup;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelectRoute?: (route: string) => void;
}

export const AdminDropdownMenu: React.FC<AdminDropdownMenuProps> = ({
  group,
  isOpen,
  onToggle,
  onClose,
  onSelectRoute,
}) => {
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isGroupActive = group.items.some((item) =>
    location.pathname.startsWith(item.route)
  );

  const totalBadge = group.items.reduce(
    (sum, item) => sum + (item.badge || 0),
    0
  );

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
        triggerRef.current?.focus();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const displayLabel = group.shortLabel || group.label || '';
  const fullLabel = group.fullLabel || group.label || group.shortLabel || '';

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title={fullLabel}
        className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] shrink-0 whitespace-nowrap ${
          isGroupActive
            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            : isOpen
            ? 'bg-slate-800 text-white'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
        }`}
      >
        <span className="whitespace-nowrap">{displayLabel}</span>

        {totalBadge > 0 && (
          <span
            className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-rose-500 text-white shrink-0 min-w-[18px] text-center leading-none"
            title={`${totalBadge} mục cần xử lý`}
          >
            {totalBadge}
          </span>
        )}

        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-rose-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[200] py-2 animate-scaleUp overflow-hidden"
        >
          <div className="px-3.5 py-1.5 text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase border-b border-slate-800/80 mb-1 flex items-center justify-between">
            <span>{fullLabel}</span>
            {totalBadge > 0 && (
              <span className="text-rose-400 font-bold text-[9px]">
                {totalBadge} chờ duyệt
              </span>
            )}
          </div>

          <div className="space-y-0.5 px-1.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isItemActive = location.pathname === item.route || location.pathname.startsWith(`${item.route}/`);

              return (
                <NavLink
                  key={item.id}
                  to={item.route}
                  onClick={() => {
                    onClose();
                    if (onSelectRoute) onSelectRoute(item.route);
                  }}
                  role="menuitem"
                  className={`flex items-start justify-between gap-3 p-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                    isItemActive
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isItemActive ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-bold leading-tight">
                        {item.label}
                      </div>
                      {item.description && (
                        <div
                          className={`text-[10px] line-clamp-1 mt-0.5 font-normal ${
                            isItemActive ? 'text-rose-100' : 'text-slate-400'
                          }`}
                        >
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-black rounded-full shrink-0 ${
                        isItemActive
                          ? 'bg-white text-rose-600'
                          : item.badgeColor === 'rose'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
