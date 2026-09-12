import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { BrandLogo } from '../branding/BrandLogo';
import { socialLinksRepository, SocialLink } from '../../services/repositories/SocialLinksRepository';

export const Footer: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    socialLinksRepository.getActiveLinks().then(setSocialLinks).catch(console.error);
  }, []);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const getPlatformConfig = (platform: string) => {
    const configs: Record<string, { className: string; iconClass: string; icon: React.ReactNode }> = {
      INSTAGRAM: {
        className: 'instaIcon',
        iconClass: 'insta',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" height="24" width="24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path clipRule="evenodd" d="M3 8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8Zm5-3a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8Zm7.597 2.214a1 1 0 0 1 1-1h.01a1 1 0 1 1 0 2h-.01a1 1 0 0 1-1-1ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-5 3a5 5 0 1 1 10 0 5 5 0 0 1-10 0Z" fillRule="evenodd" fill="currentColor"></path>
          </svg>
        ),
      },
      LINKEDIN: {
        className: 'linkedin',
        iconClass: 'link',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <circle cx="4.983" cy="5.009" r="2.188" fill="currentColor"></circle>
            <path d="M9.237 8.855v12.139h3.769v-6.003c0-1.584.298-3.118 2.262-3.118 1.937 0 1.961 1.811 1.961 3.218v5.904H21v-6.657c0-3.27-.704-5.783-4.526-5.783-1.835 0-3.065 1.007-3.568 1.96h-.051v-1.66H9.237nm-6.142 0H6.87v12.139H3.095z" fill="currentColor"></path>
          </svg>
        ),
      },
      WHATSAPP: {
        className: 'whatsapp',
        iconClass: 'whats',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M18.403 5.633A8.919 8.919 0 0 0 12.053 3c-4.948 0-8.976 4.027-8.978 8.977 0 1.582.413 3.126 1.198 4.488L3 21.116l4.759-1.249a8.981 8.981 0 0 0 4.29 1.093h.004c4.947 0 8.975-4.027 8.977-8.977a8.926 8.926 0 0 0-2.627-6.35m-6.35 13.812h-.003a7.446 7.446 0 0 1-3.798-1.041l-.272-.162-2.824.741.753-2.753-.177-.282a7.448 7.448 0 0 1-1.141-3.971c.002-4.114 3.349-7.461 7.465-7.461a7.413 7.413 0 0 1 5.275 2.188 7.42 7.42 0 0 1 2.183 5.279c-.002 4.114-3.349 7.462-7.461 7.462m4.093-5.589c-.225-.113-1.327-.655-1.533-.73-.205-.075-.354-.112-.504.112s-.58.729-.711.879-.262.168-.486.056-.947-.349-1.804-1.113c-.667-.595-1.117-1.329-1.248-1.554s-.014-.346.099-.458c.101-.1.224-.262.336-.393.112-.131.149-.224.224-.374s.038-.281-.019-.393c-.056-.113-.505-1.217-.692-1.666-.181-.435-.366-.377-.504-.383a9.65 9.65 0 0 0-.429-.008.826.826 0 0 0-.599.28c-.206.225-.785.767-.785 1.871s.804 2.171.916 2.321c.112.15 1.582 2.415 3.832 3.387.536.231.954.369 1.279.473.537.171 1.026.146 1.413.089.431-.064 1.327-.542 1.514-1.066.187-.524.187-.973.131-1.067-.056-.094-.207-.151-.43-.263" fill="currentColor"></path>
          </svg>
        ),
      },
      YOUTUBE: {
        className: 'youtube',
        iconClass: 'tube',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M21.593 7.203a2.506 2.506 0 0 0-1.762-1.766C18.265 5.007 12 5 12 5s-6.264-.007-7.831.404a2.56 2.56 0 0 0-1.766 1.778c-.413 1.566-.417 4.814-.417 4.814s-.004 3.264.406 4.814c.23.857.905 1.534 1.763 1.765 1.582.43 7.83.437 7.83.437s6.265.007 7.831-.403a2.515 2.515 0 0 0 1.767-1.763c.414-1.565.417-4.812.417-4.812s.02-3.265-.407-4.831zM9.996 15.005l.005-6 5.207 3.005-5.212 2.995z" fill="currentColor"></path>
          </svg>
        ),
      },
      FACEBOOK: {
        className: 'facebook',
        iconClass: 'face',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="currentColor"></path>
          </svg>
        ),
      },
      TIKTOK: {
        className: 'tiktok',
        iconClass: 'tik',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" fill="currentColor"></path>
          </svg>
        ),
      },
      TWITTER: {
        className: 'twitter',
        iconClass: 'twit',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"></path>
          </svg>
        ),
      },
    };
    return configs[platform] || configs.INSTAGRAM;
  };

  return (
    <footer className="bg-slate-900/90 border-t border-slate-800/80 text-slate-400 text-sm mt-12 pb-16 sm:pb-20 lg:pb-24">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 lg:py-10">
        
        {/* Footer Columns: Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          
          {/* Brand & Intro Column */}
          <div className="md:col-span-3 lg:col-span-1 space-y-2 sm:space-y-3 pb-3 sm:pb-4 md:pb-0 border-b md:border-none border-slate-800/80">
            <BrandLogo variant="full" />
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mt-2 sm:mt-3">
              TOP TRUYỆN AUDIO là nền tảng nghe truyện audio trực tuyến, giúp người dùng khám phá và thưởng thức những câu chuyện hấp dẫn mọi lúc, mọi nơi.
            </p>
          </div>

          {/* Column 1: KHÁM PHÁ */}
          <div className="border-b border-slate-800/80 md:border-none pb-3 sm:pb-3 md:pb-0">
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
          <div className="border-b border-slate-800/80 md:border-none pb-3 sm:pb-3 md:pb-0">
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
          <div className="pb-3 sm:pb-3 md:pb-0">
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
        <div className="pt-4 sm:pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          <p className="font-medium text-slate-400">© {currentYear} TOP TRUYỆN AUDIO. All rights reserved.</p>
        </div>

        {/* Support Tooltip Dropdown */}
        <div className="mt-4 sm:mt-6 flex justify-center">
          <div className="tooltip-wrapper">
            <ul className="tooltip-container">
              <li style={{ '--i': '1.1s' } as React.CSSProperties} className="nav-link">
                <div className="tooltip-tab">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ fill: 'none' }}
                    fill="none"
                    viewBox="0 0 16 16"
                    height="16"
                    width="16"
                  >
                    <path
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      stroke="#ffffff"
                      d="M1 10V8C1 2.5 6 1 8 1C10 1 15 2.5 15 8V10M1 10C1 10.5552 1 11.1543 1.0984 11.6204C1.24447 12.3122 2 13 3 13C4 13 4.75553 12.3122 4.9016 11.6204C5 11.1543 5 10.5552 5 10C5 9.44485 5 8.84565 4.9016 8.37961C4.75553 7.68776 4 7 3 7C2 7 1.24447 7.68776 1.0984 8.37961C1 8.84565 1 9.44485 1 10ZM15 10C15 10.5552 15 11.1543 14.9016 11.6204C14.7555 12.3122 14 13 13 13C12 13 11.2445 12.3122 11.0984 11.6204C11 11.1543 11 10.5552 11 10C11 9.44485 11 8.84565 11.0984 8.37961C11.2445 7.68776 12 7 13 7C14 7 14.7555 7.68776 14.9016 8.37961C15 8.84565 15 9.44485 15 10ZM15 10C15 15.5 12.5 15 8 15"
                    ></path>
                  </svg>
                  Support
                </div>
                <div className="tooltip">
                  <ul className="tooltip-menu-with-icon">
                    <li className="tooltip-link">
                      <a className="tooltip-links" href="tel:000-000-1111">
                        <svg
                          aria-hidden="true"
                          role="img"
                          height="16"
                          width="16"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="m4.6.7 1.6 1.7c.6.6.7 1.6 0 2.2C5 6.1 5 6.4 7.2 8.7c2.4 2.4 2.7 2.4 4.2 1 .6-.5 1.6-.5 2.2 0l1.7 1.7v.1c.6.5.6 1.5 0 2.1v.1c-1.4 1.4-2.5 2-3.8 2h-.7c-1.6-.3-3.4-1.6-6.1-4.4C-.5 6.1-1 4 2.3.7 2.9.1 3.9.1 4.6.7m-1.2.4c-.2 0-.4.1-.5.3C.1 4 .5 5.9 5.3 10.7s6.6 5.2 9.3 2.4l.2.1-.2-.1c.3-.3.3-.7.1-1L13 10.4a.7.7 0 0 0-1 0c-1.9 1.8-2.7 1.6-5.3-1C4 6.6 3.8 5.8 5.6 4c.3-.3.3-.7 0-1L3.9 1.3a.7.7 0 0 0-.5-.2"
                            fillRule="evenodd"
                            fill="#FFF"
                          ></path>
                        </svg>
                        000-000-1111
                      </a>
                    </li>
                    <li className="tooltip-link">
                      <a className="tooltip-links" href="#">
                        <svg
                          aria-hidden="true"
                          role="img"
                          viewBox="0 0 13.971 13.971"
                          height="16"
                          width="16"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <defs></defs>
                          <g id="support-clock_svg__clock">
                            <path
                              className="support-clock_svg__support-clock-cls-1"
                              d="M6.985 13.97a6.985 6.985 0 1 1 6.986-6.985 6.993 6.993 0 0 1-6.986 6.986zm0-13.47a6.485 6.485 0 1 0 6.486 6.485A6.493 6.493 0 0 0 6.985.5"
                            ></path>
                            <path
                              className="support-clock_svg__support-clock-cls-1"
                              d="M11.1 7.235H6.986a.25.25 0 0 1-.25-.25V1.972a.25.25 0 1 1 .5 0v4.763h3.866a.25.25 0 0 1 0 .5z"
                            ></path>
                          </g>
                        </svg>
                        8:30AM - 5PM PST
                      </a>
                    </li>
                    <li className="tooltip-link">
                      <a className="tooltip-links" href="/help">
                        <svg
                          aria-hidden="true"
                          role="img"
                          viewBox="0 0 18.2 13.342"
                          height="16"
                          width="16"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            style={{ fill: '#fff' }}
                            d="M17.9 0H.3a.3.3 0 0 0-.3.3v12.742a.3.3 0 0 0 .3.3h17.6a.3.3 0 0 0 .3-.3V.3a.3.3 0 0 0-.3-.3M.85.5h16.554L9.101 6.364Zm6.983 5.576 1.124.799a.25.25 0 0 0 .29 0l1.527-1.08-.133.13 6.719 6.917H.956ZM.5 12.59V.867l6.918 4.915Zm10.533-6.978L17.7.902v11.574ZM.539.5.5.554V.5Z"
                          ></path>
                        </svg>
                        thndev26@gmail.com
                      </a>
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media Icons */}
        {socialLinks.length > 0 && (
          <div className="mt-6 sm:mt-8 flex justify-center pb-2 sm:pb-4">
            <div id="SocailIcons">
              {socialLinks.map((link) => {
                const config = getPlatformConfig(link.platform);
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`icons ${config.className}`}
                  >
                    <p className="iconName">{link.name}</p>
                    <div className={`icon ${config.iconClass}`}>
                      {config.icon}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </footer>
  );
};
