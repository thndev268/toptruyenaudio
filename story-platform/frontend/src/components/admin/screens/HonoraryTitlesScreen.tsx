import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, Search, Award } from 'lucide-react';
import { adminRepository } from '../../../services/repositories/AdminRepository';
import { HonoraryTitle, TitleEffect } from '../../../types';
import { AdminPageHeader } from '../layout/AdminPageHeader';
import * as Icons from 'lucide-react';

export function HonoraryTitlesScreen() {
  const [titles, setTitles] = useState<HonoraryTitle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState<HonoraryTitle | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [effects, setEffects] = useState<TitleEffect[]>([]);

  useEffect(() => {
    loadTitles();
  }, []);

  const loadTitles = () => {
    setTitles(adminRepository.getHonoraryTitles());
  };

  const handleOpenModal = (title?: HonoraryTitle) => {
    if (title) {
      setEditingTitle(title);
      setName(title.name);
      setDescription(title.description);
      setIsActive(title.isActive);
      setEffects(title.effects || []);
    } else {
      setEditingTitle(null);
      setName('');
      setDescription('');
      setIsActive(true);
      setEffects([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const newTitle: HonoraryTitle = {
      id: editingTitle ? editingTitle.id : `title-${Date.now()}`,
      name,
      description,
      isActive,
      effects,
      createdAt: editingTitle ? editingTitle.createdAt : new Date().toISOString(),
    };

    adminRepository.saveHonoraryTitle(newTitle);
    loadTitles();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa danh hiệu này?')) {
      adminRepository.deleteHonoraryTitle(id);
      loadTitles();
    }
  };

  const addEffect = (type: TitleEffect['type']) => {
    setEffects([...effects, { type, color: type === 'ICON' ? undefined : 'text-blue-500', iconName: type === 'ICON' ? 'Star' : undefined }]);
  };

  const removeEffect = (index: number) => {
    setEffects(effects.filter((_, i) => i !== index));
  };

  const updateEffect = (index: number, updates: Partial<TitleEffect>) => {
    const newEffects = [...effects];
    newEffects[index] = { ...newEffects[index], ...updates };
    setEffects(newEffects);
  };

  const renderEffectPreview = (effectsToRender: TitleEffect[], text: string) => {
    let classes = 'inline-flex items-center px-2 py-1 rounded font-medium text-sm ';
    let style: any = {};
    let iconName = '';

    effectsToRender.forEach(e => {
      if (e.type === 'TEXT_COLOR' && e.color) classes += ` ${e.color}`;
      if (e.type === 'BORDER' && e.color) classes += ` border ${e.color}`;
      if (e.type === 'GLOW' && e.color) classes += ` shadow-lg ${e.color}`;
      if (e.type === 'ICON' && e.iconName) iconName = e.iconName;
    });

    const Icon = iconName ? (Icons as any)[iconName] : null;

    return (
      <span className={classes} style={style}>
        {Icon && <Icon className="w-4 h-4 mr-1" />}
        {text}
      </span>
    );
  };

  const filteredTitles = titles.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        category="Hệ Thống Vinh Danh"
        categoryColor="amber"
        title="Quản Lý Danh Hiệu"
        subtitle="Tạo và quản lý các danh hiệu vinh danh, phần thưởng cho người dùng xuất sắc."
        icon={Award}
        actions={
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Danh Hiệu</span>
          </button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm danh hiệu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tên Danh Hiệu</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Mô tả</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Hiệu Ứng (Preview)</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Trạng Thái</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTitles.map((title) => (
                <tr key={title.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{title.name}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-500 dark:text-slate-400">{title.description}</div>
                  </td>
                  <td className="p-4">
                    {renderEffectPreview(title.effects, title.name)}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${title.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {title.isActive ? 'Hoạt động' : 'Đã ẩn'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleOpenModal(title)}
                      className="text-slate-400 hover:text-blue-500 p-2"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(title.id)}
                      className="text-slate-400 hover:text-red-500 p-2"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTitles.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    Không tìm thấy danh hiệu nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingTitle ? 'Chỉnh Sửa Danh Hiệu' : 'Thêm Danh Hiệu Mới'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                <Icons.X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên Danh Hiệu</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100"
                  placeholder="VD: Fan Cứng Đời Đầu"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mô tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100"
                  placeholder="Mô tả danh hiệu..."
                  rows={3}
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Đang Hoạt Động</span>
                </label>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Hiệu Ứng (Effects)</label>
                  <div className="space-x-2">
                    <button onClick={() => addEffect('TEXT_COLOR')} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">+ Màu Chữ</button>
                    <button onClick={() => addEffect('BORDER')} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">+ Viền</button>
                    <button onClick={() => addEffect('GLOW')} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">+ Phát Sáng</button>
                    <button onClick={() => addEffect('ICON')} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">+ Icon</button>
                  </div>
                </div>

                <div className="space-y-3">
                  {effects.map((effect, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="text-sm font-medium w-24 text-slate-600 dark:text-slate-400">
                        {effect.type}
                      </div>
                      
                      {effect.type !== 'ICON' ? (
                        <input
                          type="text"
                          value={effect.color || ''}
                          onChange={(e) => updateEffect(index, { color: e.target.value })}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm"
                          placeholder="Tailwind class (e.g. text-blue-500)"
                        />
                      ) : (
                        <input
                          type="text"
                          value={effect.iconName || ''}
                          onChange={(e) => updateEffect(index, { iconName: e.target.value })}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm"
                          placeholder="Lucide Icon name (e.g. Crown, Star, Shield)"
                        />
                      )}
                      
                      <button onClick={() => removeEffect(index)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {effects.length === 0 && (
                    <p className="text-sm text-slate-500 italic">Chưa có hiệu ứng nào được thêm.</p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Xem trước (Preview)</h4>
                <div className="flex justify-center p-4">
                  {renderEffectPreview(effects, name || 'Tên Danh Hiệu')}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
