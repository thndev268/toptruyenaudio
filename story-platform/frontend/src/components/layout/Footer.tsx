import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { BrandLogo } from '../branding/BrandLogo';

export const Footer: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="bg-slate-900/90 border-t border-slate-800/80 text-slate-400 text-sm mt-12 pb-24">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-10">
        
        {/* Footer Columns: Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8 mb-8">
          
          {/* Brand & Intro Column */}
          <div className="md:col-span-3 lg:col-span-1 space-y-3 pb-4 md:pb-0 border-b md:border-none border-slate-800/80">
            <BrandLogo variant="full" />
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mt-3">
              TOP TRUYỆN AUDIO là nền tảng nghe truyện audio trực tuyến, giúp người dùng khám phá và thưởng thức những câu chuyện hấp dẫn mọi lúc, mọi nơi.
            </p>
          </div>

          {/* Column 1: KHÁM PHÁ */}
          <div className="border-b border-slate-800/80 md:border-none pb-3 md:pb-0">
            <button
              onClick={() => toggleSection('explore')}
              className="w-full flex items-center justify-between md:justify-start text-xs font-bold uppercase tracking-wider text-white font-mono py-1 md:py-0 min-h-[44px] md:min-h-0"
            >
              <span>KHÁM PHÁ AUDIO</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 md:hidden transition-transform ${openSection === 'explore' ? 'rotate-180' : ''}`} />
            </button>

            <ul className={`space-y-2 text-xs pt-2 md:pt-3 ${openSection === 'explore' ? 'block' : 'hidden md:block'}`}>
              <li>
                <Link to="/explore" className="hover:text-cyan-400 transition-colors py-1 flex items-center min-h-[36px]">
                  Truyện audio mới nhất
                </Link>
              </li>
              <li>
                <Link to="/rankings" className="hover:text-cyan-400 transition-colors py-1 flex items-center min-h-[36px]">
                  Bảng xếp hạng lượt nghe
                </Link>
              </li>
              <li>
                <Link to="/genres" className="hover:text-cyan-400 transition-colors py-1 flex items-center min-h-[36px]">
                  Danh mục thể loại phong phú
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: DÀNH CHO CREATOR & ĐỐI TÁC */}
          <div className="border-b border-slate-800/80 md:border-none pb-3 md:pb-0">
            <button
              onClick={() => toggleSection('creator')}
              className="w-full flex items-center justify-between md:justify-start text-xs font-bold uppercase tracking-wider text-white font-mono py-1 md:py-0 min-h-[44px] md:min-h-0"
            >
              <span>DÀNH CHO CREATOR</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 md:hidden transition-transform ${openSection === 'creator' ? 'rotate-180' : ''}`} />
            </button>

            <ul className={`space-y-2 text-xs pt-2 md:pt-3 ${openSection === 'creator' ? 'block' : 'hidden md:block'}`}>
              <li>
                <Link to="/creator" className="hover:text-cyan-400 transition-colors py-1 flex items-center min-h-[36px]">
                  Creator Studio Quản Lý
                </Link>
              </li>
              <li>
                <Link to="/partner" className="hover:text-cyan-400 transition-colors py-1 flex items-center min-h-[36px]">
                  Đối tác phát triển nội dung
                </Link>
              </li>
              <li>
                <Link to="/withdrawal-policy" className="hover:text-cyan-400 transition-colors py-1 flex items-center min-h-[36px]">
                  Chính sách tác quyền & phân phối
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: HỖ TRỢ & PHÁP LÝ */}
          <div className="pb-3 md:pb-0">
            <button
              onClick={() => toggleSection('support')}
              className="w-full flex items-center justify-between md:justify-start text-xs font-bold uppercase tracking-wider text-white font-mono py-1 md:py-0 min-h-[44px] md:min-h-0"
            >
              <span>HỖ TRỢ & PHÁP LÝ</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 md:hidden transition-transform ${openSection === 'support' ? 'rotate-180' : ''}`} />
            </button>

            <ul className={`space-y-2 text-xs pt-2 md:pt-3 ${openSection === 'support' ? 'block' : 'hidden md:block'}`}>
              <li>
                <Link to="/terms" className="hover:text-cyan-400 transition-colors py-1 flex items-center min-h-[36px]">
                  Điều khoản & Bảo mật
                </Link>
              </li>
              <li>
                <Link to="/copyright" className="hover:text-cyan-400 transition-colors py-1 flex items-center min-h-[36px]">
                  Chính sách bản quyền
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-cyan-400 transition-colors py-1 flex items-center min-h-[36px]">
                  Trung tâm trợ giúp 24/7
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright notice */}
        <div className="pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          <p className="font-medium text-slate-400">© {currentYear} TOP TRUYỆN AUDIO. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
};
