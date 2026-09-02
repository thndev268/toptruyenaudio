import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ArrowUpDown,
  Zap,
  History,
  ShieldCheck,
  Play,
  Calendar,
  Layers,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { badgeRepository } from '../../../services/repositories/BadgeRepository';
import {
  UserBadge,
  BadgeLevel,
  BadgeAwardMode,
  BadgeEventType,
  BadgeConditionOperator,
  BadgeEventDefinition,
  BadgeAuditLog,
} from '../../../types/badges';

type TabType = 'BADGES' | 'EVENTS' | 'AUDIT_LOGS';
type SortOption = 'NAME_ASC' | 'NAME_DESC' | 'LEVEL_ASC' | 'LEVEL_DESC' | 'NEWEST' | 'OLDEST';

const LEVEL_WEIGHT: Record<BadgeLevel, number> = {
  LEGENDARY: 4,
  EPIC: 3,
  RARE: 2,
  COMMON: 1,
};

const STANDARD_EVENTS: { key: BadgeEventType; label: string; defaultUnit: string }[] = [
  { key: 'LISTENING_MINUTES_REACHED', label: 'Số phút nghe audio', defaultUnit: 'phút' },
  { key: 'CHAPTERS_COMPLETED', label: 'Số tập đã nghe xong', defaultUnit: 'tập' },
  { key: 'STORIES_COMPLETED', label: 'Số bộ truyện nghe hoàn chỉnh', defaultUnit: 'bộ' },
  { key: 'CONSECUTIVE_LISTENING_DAYS', label: 'Số ngày nghe liên tục', defaultUnit: 'ngày' },
  { key: 'COMMENTS_POSTED', label: 'Số bình luận đã đăng', defaultUnit: 'bình luận' },
  { key: 'VALID_REVIEWS_POSTED', label: 'Số đánh giá chất lượng', defaultUnit: 'đánh giá' },
  { key: 'PLAYLISTS_CREATED', label: 'Số danh sách nghe đã tạo', defaultUnit: 'playlist' },
  { key: 'FAVORITES_ADDED', label: 'Số truyện thêm yêu thích', defaultUnit: 'truyện' },
  { key: 'ACCOUNT_AGE_DAYS', label: 'Tuổi thọ tài khoản', defaultUnit: 'ngày' },
  { key: 'PREMIUM_ACTIVATED', label: 'Kích hoạt gói VIP Premium', defaultUnit: 'lần' },
  { key: 'CREATOR_CONTENT_PUBLISHED', label: 'Số chương/truyện tác giả đăng', defaultUnit: 'tác phẩm' },
  { key: 'CUSTOM_EVENT', label: 'Sự kiện tùy chỉnh mở rộng', defaultUnit: 'lần' },
];

export const AdminBadgesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('BADGES');
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [events, setEvents] = useState<BadgeEventDefinition[]>([]);
  const [auditLogs, setAuditLogs] = useState<BadgeAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<BadgeLevel | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'HIDDEN'>('ALL');
  const [selectedMode, setSelectedMode] = useState<BadgeAwardMode | 'ALL'>('ALL');
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
  const [awardMode, setAwardMode] = useState<BadgeAwardMode>('MANUAL');
  const [requirementText, setRequirementText] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Automatic Condition Fields
  const [eventType, setEventType] = useState<string>('LISTENING_MINUTES_REACHED');
  const [operator, setOperator] = useState<BadgeConditionOperator>('GREATER_THAN_OR_EQUAL');
  const [targetValue, setTargetValue] = useState<number>(60);
  const [timeWindowDays, setTimeWindowDays] = useState<number | undefined>(undefined);
  const [conditionDesc, setConditionDesc] = useState<string>('');
  const [testResult, setTestResult] = useState<string | null>(null);

  // --- EVENT MODAL STATE ---
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<BadgeEventDefinition | null>(null);
  const [eventKeyInput, setEventKeyInput] = useState('');
  const [eventNameInput, setEventNameInput] = useState('');
  const [eventDescInput, setEventDescInput] = useState('');
  const [metricTypeInput, setMetricTypeInput] = useState<'COUNT' | 'DURATION' | 'BOOLEAN'>('COUNT');
  const [unitInput, setUnitInput] = useState('lần');
  const [eventActiveInput, setEventActiveInput] = useState(true);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [allBadges, allEvents, allLogs] = await Promise.all([
        badgeRepository.getBadges(),
        badgeRepository.getEventDefinitions(),
        badgeRepository.getAuditLogs(),
      ]);
      setBadges(allBadges);
      setEvents(allEvents);
      setAuditLogs(allLogs);
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
    setAwardMode('MANUAL');
    setRequirementText('');
    setIsActive(true);
    setEventType('LISTENING_MINUTES_REACHED');
    setOperator('GREATER_THAN_OR_EQUAL');
    setTargetValue(60);
    setTimeWindowDays(undefined);
    setConditionDesc('');
    setTestResult(null);
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
    setAwardMode(b.awardMode || 'MANUAL');
    setRequirementText(b.requirementText || '');
    setIsActive(b.isActive ?? true);

    if (b.condition) {
      setEventType(b.condition.eventType || 'LISTENING_MINUTES_REACHED');
      setOperator(b.condition.operator || 'GREATER_THAN_OR_EQUAL');
      setTargetValue(b.condition.targetValue ?? 60);
      setTimeWindowDays(b.condition.timeWindowDays);
      setConditionDesc(b.condition.description || '');
    } else {
      setEventType('LISTENING_MINUTES_REACHED');
      setOperator('GREATER_THAN_OR_EQUAL');
      setTargetValue(60);
      setTimeWindowDays(undefined);
      setConditionDesc('');
    }
    setTestResult(null);
    setErrorMsg('');
    setIsBadgeModalOpen(true);
  };

  const handleTestConditionConfig = () => {
    if (awardMode === 'MANUAL') {
      setTestResult('Chế độ Cấp Thủ Công: Không cần điều kiện tự động.');
      return;
    }

    const opSymbol =
      operator === 'EQUALS' ? '=' :
      operator === 'GREATER_THAN_OR_EQUAL' ? '≥' :
      operator === 'GREATER_THAN' ? '>' : '≤';

    const eventObj = Array.isArray(STANDARD_EVENTS) ? STANDARD_EVENTS.find((e) => e.key === eventType) : null;
    const unit = eventObj?.defaultUnit || 'đơn vị';

    setTestResult(
      `✓ Cấu hình hợp lệ: Tự động trao thưởng khi chỉ số [${eventObj?.label || eventType}] đạt ${opSymbol} ${targetValue} ${unit}${
        timeWindowDays ? ` trong vòng ${timeWindowDays} ngày` : ''
      }.`
    );
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
      const conditionPayload =
        awardMode === 'AUTOMATIC'
          ? {
              id: editingBadge?.condition?.id || `cond-${Date.now()}`,
              badgeId: editingBadge?.id || '',
              eventType,
              operator,
              targetValue: Number(targetValue),
              timeWindowDays: timeWindowDays ? Number(timeWindowDays) : undefined,
              isActive: true,
              description: conditionDesc.trim() || `Tự động khi chỉ số đạt ${targetValue}`,
            }
          : undefined;

      if (editingBadge) {
        await badgeRepository.updateBadge(editingBadge.id, {
          code: code.trim(),
          name: name.trim(),
          description: description.trim(),
          icon,
          level,
          awardMode,
          condition: conditionPayload,
          requirementText: requirementText.trim(),
          isActive,
        });
        setSuccessMsg(`Cập nhật danh hiệu "${name}" thành công!`);
      } else {
        await badgeRepository.createBadge({
          code: code.trim(),
          name: name.trim(),
          description: description.trim(),
          icon,
          level,
          awardMode,
          condition: conditionPayload,
          requirementText: requirementText.trim(),
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

  // --- CUSTOM EVENTS MODAL ---
  const openCreateEventModal = () => {
    setEditingEvent(null);
    setEventKeyInput('');
    setEventNameInput('');
    setEventDescInput('');
    setMetricTypeInput('COUNT');
    setUnitInput('lần');
    setEventActiveInput(true);
    setErrorMsg('');
    setIsEventModalOpen(true);
  };

  const openEditEventModal = (ev: BadgeEventDefinition) => {
    setEditingEvent(ev);
    setEventKeyInput(ev.eventKey);
    setEventNameInput(ev.name);
    setEventDescInput(ev.description);
    setMetricTypeInput(ev.metricType);
    setUnitInput(ev.unit || 'lần');
    setEventActiveInput(ev.active);
    setErrorMsg('');
    setIsEventModalOpen(true);
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!eventKeyInput.trim() || !eventNameInput.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Mã eventKey và Tên sự kiện.');
      return;
    }

    try {
      if (editingEvent) {
        await badgeRepository.updateEventDefinition(editingEvent.id, {
          eventKey: eventKeyInput.trim().toUpperCase(),
          name: eventNameInput.trim(),
          description: eventDescInput.trim(),
          metricType: metricTypeInput,
          unit: unitInput.trim(),
          active: eventActiveInput,
        });
        setSuccessMsg(`Cập nhật sự kiện "${eventNameInput}" thành công!`);
      } else {
        await badgeRepository.createEventDefinition({
          eventKey: eventKeyInput.trim().toUpperCase(),
          name: eventNameInput.trim(),
          description: eventDescInput.trim(),
          metricType: metricTypeInput,
          unit: unitInput.trim(),
          active: eventActiveInput,
        });
        setSuccessMsg(`Thêm sự kiện tùy chỉnh "${eventNameInput}" thành công!`);
      }

      setIsEventModalOpen(false);
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi xử lý sự kiện.');
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
        if (selectedMode !== 'ALL' && b.awardMode !== selectedMode) return false;

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
  }, [badges, search, selectedLevel, selectedStatus, selectedMode, sortBy]);

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

        {activeTab === 'BADGES' && (
          <button
            onClick={openCreateBadgeModal}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 self-start sm:self-auto min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Danh Hiệu Mới</span>
          </button>
        )}

        {activeTab === 'EVENTS' && (
          <button
            onClick={openCreateEventModal}
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 self-start sm:self-auto min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Sự Kiện Tùy Chỉnh</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-4">
        <button
          onClick={() => setActiveTab('BADGES')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'BADGES'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Kho Danh Hiệu ({badges.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('EVENTS')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'EVENTS'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Sự Kiện Kích Hoạt ({events.length + STANDARD_EVENTS.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'AUDIT_LOGS'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Nhật Ký Kiểm Toán ({auditLogs.length})</span>
        </button>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ================= TAB 1: BADGES ================= */}
      {activeTab === 'BADGES' && (
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

            {/* Award Mode Filter */}
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="ALL">Tất cả hình thức trao</option>
              <option value="MANUAL">MANUAL (Admin gán thủ công)</option>
              <option value="AUTOMATIC">AUTOMATIC (Tự động theo điều kiện)</option>
            </select>

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
                      <th className="p-4">Chế Độ Trao</th>
                      <th className="p-4">Điều Kiện Tự Động</th>
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
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                            b.awardMode === 'AUTOMATIC' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {b.awardMode === 'AUTOMATIC' ? <Zap className="w-3 h-3 text-cyan-500" /> : <Settings className="w-3 h-3 text-slate-400" />}
                            {b.awardMode}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs">
                          {b.awardMode === 'AUTOMATIC' && b.condition ? (
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {b.condition.description || `${b.condition.eventType} ${b.condition.operator} ${b.condition.targetValue}`}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Thủ công (Admin cấp)</span>
                          )}
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
      )}

      {/* ================= TAB 2: EVENTS ================= */}
      {activeTab === 'EVENTS' && (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              Lưu ý về sự kiện kích hoạt (Badge Events):
            </div>
            <p>
              Hệ thống đã hỗ trợ sẵn 11 sự kiện chuẩn (Chương hoàn thành, Số phút nghe, Bình luận...). Khi Admin tạo sự kiện tùy chỉnh mới, sự kiện chỉ tự động trao thưởng khi backend ghi nhận và phát sinh eventKey tương ứng.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 uppercase font-semibold">
                  <th className="p-4">Mã EventKey</th>
                  <th className="p-4">Tên Sự Kiện</th>
                  <th className="p-4">Mô Tả</th>
                  <th className="p-4">Loại Đo Lường</th>
                  <th className="p-4">Trạng Thái Phát Sinh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                {STANDARD_EVENTS.map((se) => (
                  <tr key={se.key} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-4 font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                      {se.key}
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{se.label}</td>
                    <td className="p-4 text-xs text-slate-500">Sự kiện chuẩn tích hợp sẵn trên hệ thống</td>
                    <td className="p-4 text-xs font-mono text-slate-600 dark:text-slate-300">
                      COUNT ({se.defaultUnit})
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã kết nối Backend
                      </span>
                    </td>
                  </tr>
                ))}

                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-4 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                      {ev.eventKey}
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{ev.name}</td>
                    <td className="p-4 text-xs text-slate-500">{ev.description}</td>
                    <td className="p-4 text-xs font-mono text-slate-600 dark:text-slate-300">
                      {ev.metricType} ({ev.unit || 'đơn vị'})
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-bold">
                        <AlertCircle className="w-3.5 h-3.5" /> Chưa có nguồn phát sinh
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: AUDIT LOGS ================= */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Toàn bộ lịch sử gán, thu hồi & thay đổi danh hiệu
            </span>
            <span className="text-xs font-mono text-slate-400">{auditLogs.length} bản ghi</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold uppercase font-mono">
                  <th className="p-3">Thời Gian</th>
                  <th className="p-3">Thao Tác</th>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Badge ID</th>
                  <th className="p-3">Lý Do / Ghi Chú</th>
                  <th className="p-3 text-right">Người Thực Hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-3 font-mono text-slate-400">{new Date(log.timestamp).toLocaleString('vi-VN')}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        log.action === 'ASSIGNED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' :
                        log.action === 'REVOKED' ? 'bg-red-500/10 text-red-600 border border-red-500/30' :
                        'bg-blue-500/10 text-blue-600 border border-blue-500/30'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{log.userId}</td>
                    <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold">{log.badgeId}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{log.note || log.revokeReason || '—'}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-500">{log.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

              {/* Award Mode Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">Hình Thức Trao Danh Hiệu:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="awardMode"
                      value="MANUAL"
                      checked={awardMode === 'MANUAL'}
                      onChange={() => setAwardMode('MANUAL')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span>MANUAL (Admin cấp thủ công)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="awardMode"
                      value="AUTOMATIC"
                      checked={awardMode === 'AUTOMATIC'}
                      onChange={() => setAwardMode('AUTOMATIC')}
                      className="text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>AUTOMATIC (Hệ thống tự trao)</span>
                  </label>
                </div>

                {/* AUTOMATIC CONDITIONS FORM */}
                {awardMode === 'AUTOMATIC' && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Sự Kiện Kích Hoạt:</label>
                        <select
                          value={eventType}
                          onChange={(e) => setEventType(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                        >
                          {STANDARD_EVENTS.map((se) => (
                            <option key={se.key} value={se.key}>{se.label} ({se.key})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Toán Tử So Sánh:</label>
                        <select
                          value={operator}
                          onChange={(e) => setOperator(e.target.value as BadgeConditionOperator)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                        >
                          <option value="GREATER_THAN_OR_EQUAL">≥ Lớn hơn hoặc bằng</option>
                          <option value="GREATER_THAN">&gt; Lớn hơn hẳn</option>
                          <option value="EQUALS">= Bằng chính xác</option>
                          <option value="LESS_THAN_OR_EQUAL">≤ Nhỏ hơn hoặc bằng</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Giá Trị Mục Tiêu:</label>
                        <input
                          type="number"
                          value={targetValue}
                          onChange={(e) => setTargetValue(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Mô Tả Điều Kiện Ngắn:</label>
                        <input
                          type="text"
                          value={conditionDesc}
                          onChange={(e) => setConditionDesc(e.target.value)}
                          placeholder="VD: Nghe đủ 60 phút"
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleTestConditionConfig}
                        className="px-3 py-1.5 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 rounded-xl text-xs font-bold border border-cyan-500/30 flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Kiểm Tra Cấu Hình</span>
                      </button>

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

                    {testResult && (
                      <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-[11px] font-semibold text-cyan-800 dark:text-cyan-300">
                        {testResult}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Hướng Dẫn Mở Khóa Cho Người Dùng:</label>
                <input
                  type="text"
                  value={requirementText}
                  onChange={(e) => setRequirementText(e.target.value)}
                  placeholder="VD: Tích lũy 60 phút nghe audio"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
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

      {/* ================= EVENT CREATE MODAL ================= */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-500" />
                {editingEvent ? 'Chỉnh Sửa Sự Kiện' : 'Tạo Sự Kiện Tùy Chỉnh'}
              </h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mã eventKey (Chữ in hoa, số, dấu gạch dưới) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventKeyInput}
                  onChange={(e) => setEventKeyInput(e.target.value.toUpperCase())}
                  placeholder="VD: SUMMER_LISTEN_CHALLENGE"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Sự Kiện <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventNameInput}
                  onChange={(e) => setEventNameInput(e.target.value)}
                  placeholder="VD: Thử Thách Nghe Hè 2025"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mô Tả</label>
                <textarea
                  value={eventDescInput}
                  onChange={(e) => setEventDescInput(e.target.value)}
                  placeholder="Mô tả về sự kiện..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Loại Đo Lường</label>
                  <select
                    value={metricTypeInput}
                    onChange={(e) => setMetricTypeInput(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="COUNT">COUNT (Đếm số lần)</option>
                    <option value="DURATION">DURATION (Thời lượng)</option>
                    <option value="BOOLEAN">BOOLEAN (Bật / Tắt)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Đơn Vị Tính</label>
                  <input
                    type="text"
                    value={unitInput}
                    onChange={(e) => setUnitInput(e.target.value)}
                    placeholder="lần, phút, ngày..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-bold shadow-md"
                >
                  Lưu Sự Kiện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
