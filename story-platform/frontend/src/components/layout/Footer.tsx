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
    const configs: Record<string, { tooltipClass: string; icon: React.ReactNode }> = {
      INSTAGRAM: {
        tooltipClass: 'text',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 16 16">
            <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm.052 1.607c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.167-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.599-.92c-.11-.281-.24-.705-.276-1.485-.038-.843-.047-1.096-.047-3.232s.009-2.389.047-3.233c.036-.78.167-1.203.276-1.485.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"></path>
          </svg>
        ),
      },
      FACEBOOK: {
        tooltipClass: 'tooltip2',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
            <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"></path>
          </svg>
        ),
      },
      YOUTUBE: {
        tooltipClass: 'tooltip6',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
            <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.66.334-1.09 0-5.5-.022-6.66-.334a2.01 2.01 0 0 1-1.415-1.421c-.111-.418-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.001-.215.01-1.138.084-2.142l.009-.104.009-.104c.05-.572.124-1.14.235-1.558a2.01 2.01 0 0 1 1.415-1.42c1.16-.312 5.569-.334 6.66-.334zm-1.035 3.025a1.5 1.5 0 0 0-.726-.726l-.014-.007a1.5 1.5 0 0 0-1.426 0l-.014.007a1.5 1.5 0 0 0-.726.726l-.014.014a1.5 1.5 0 0 0 0 1.426l.014.014a1.5 1.5 0 0 0 .726.726l.014.007a1.5 1.5 0 0 0 1.426 0l.014-.007a1.5 1.5 0 0 0 .726-.726l.014-.014a1.5 1.5 0 0 0 0-1.426z"></path>
          </svg>
        ),
      },
      TIKTOK: {
        tooltipClass: 'tooltip5',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
            <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z"></path>
          </svg>
        ),
      },
      TWITTER: {
        tooltipClass: 'tooltip1',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
            <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334q.002-.211-.006-.422A6.7 6.7 0 0 0 16 3.542a6.7 6.7 0 0 1-1.889.518 3.3 3.3 0 0 0 1.447-1.817 6.5 6.5 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.32 9.32 0 0 1-6.767-3.429 3.29 3.29 0 0 0 1.018 4.382A3.3 3.3 0 0 1 .64 6.575v.045a3.29 3.29 0 0 0 2.632 3.218 3.2 3.2 0 0 1-.865.115 3 3 0 0 1-.614-.057 3.28 3.28 0 0 0 3.067 2.277A6.6 6.6 0 0 1 .78 13.58a6 6 0 0 1-.78-.045A9.34 9.34 0 0 0 5.026 15"></path>
          </svg>
        ),
      },
      WHATSAPP: {
        tooltipClass: 'tooltip3',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
            <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"></path>
          </svg>
        ),
      },
      LINKEDIN: {
        tooltipClass: 'tooltip7',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
            <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-2.4-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z"></path>
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

        {/* Social Media Icons - Uiverse.io Design */}
        {socialLinks.length > 0 && (
          <div className="mt-6 sm:mt-8 flex justify-center pb-2 sm:pb-4">
            <div className="tooltip-container">
              {socialLinks.map((link) => {
                const config = getPlatformConfig(link.platform);
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={config.tooltipClass}
                  >
                    {config.icon}
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
