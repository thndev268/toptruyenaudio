import React, { useState } from 'react';
import {
  Tags,
  Plus,
  Trash2,
  BookOpen,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { AdminGenreItem } from '../../../types/admin';

interface GenresScreenProps {
  genres: AdminGenreItem[];
  onAddGenre: (name: string, slug: string, description: string) => void;
  onDeleteGenre: (genre: AdminGenreItem) => void;
}

export const GenresScreen: React.FC<GenresScreenProps> = ({
  genres,
  onAddGenre,
  onDeleteGenre,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [genreToDelete, setGenreToDelete] = useState<AdminGenreItem | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddGenre(name.trim(), slug.trim(), description.trim());
    setName('');
    setSlug('');
    setDescription('');
    setIsAdding(false);
  };

  const filtered = genres.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Tags className="w-5 h-5" />
            <span className="text-xs uppercase font-mono font-bold tracking-wider">
              Phân Loại Thư Viện
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Danh Mục & Thể Loại Truyện Audio
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Quản lý các thể loại nội dung phục vụ bộ lọc tìm kiếm và phân loại tự động
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2.5 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20 flex items-center gap-2 transition-all cursor-pointer min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? 'Đóng Biểu Mẫu' : 'Thêm Thể Loại Mới'}</span>
        </button>
      </div>

      {/* Add Genre Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-scaleUp"
        >
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Khai Báo Thể Loại Mới</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Tên Thể Loại <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) {
                    setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  }
                }}
                placeholder="Ví dụ: Tiên Hiệp, Huyền Huyễn, Trinh Thám..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 min-h-[42px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Đường Dẫn Slug URL
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="tien-hiep-audio"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 min-h-[42px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Mô Tả Thể Loại</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả tóm tắt đặc trưng thể loại phục vụ SEO và người nghe..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl min-h-[40px] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 min-h-[40px] cursor-pointer font-bold"
            >
              Lưu Thể Loại
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm thể loại truyện..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[42px]"
          />
        </div>
      </div>

      {/* Grid of genres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((g) => (
          <div
            key={g.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>{g.name}</span>
                </h3>
                <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  {g.storyCount} bộ
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{g.description}</p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-mono">slug: {g.slug}</span>
              <button
                type="button"
                onClick={() => setGenreToDelete(g)}
                className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Xóa thể loại"
                aria-label={`Xóa thể loại ${g.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Local Accidental Loss Prevention Confirmation Modal */}
      {genreToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Xác nhận xóa thể loại</h3>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn thể loại <strong className="text-rose-400 font-bold">"{genreToDelete.name}"</strong>? 
              Hành động này sẽ loại bỏ hoàn toàn thể loại này khỏi tất cả bộ truyện và danh mục tìm kiếm.
            </p>

            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-300">
              Cảnh báo: Hành động này có tính chất phá hủy dữ liệu vĩnh viễn và không thể khôi phục lại.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setGenreToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl min-h-[40px] cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteGenre(genreToDelete);
                  setGenreToDelete(null);
                }}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20 min-h-[40px] cursor-pointer"
              >
                Xác nhận xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
