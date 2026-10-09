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

  const getLinkUrl = (platform: string) => {
    const link = socialLinks.find(l => l.platform === platform && l.isActive);
    return link?.url || '#';
  };

  return (
    <footer className="bg-slate-900/90 border-t border-slate-800/80 text-slate-400 text-sm mt-12 pb-16 sm:pb-20 lg:pb-24">
      {/* SVG Filter for Pencil Texture */}
      <svg
        style={{ visibility: 'hidden', position: 'absolute' }}
        width="0"
        height="0"
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
      >
        <defs>
          <filter id="pencil-texture" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04"
              numOctaves="3"
              result="noise"
            ></feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3"
              xChannelSelector="R"
              yChannelSelector="G"
            ></feDisplacementMap>
          </filter>
        </defs>
      </svg>

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

        {/* Support Tooltip Dropdown & Social Media Icons - Horizontal Layout */}
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8">
          {/* Support Tooltip Dropdown */}
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

          {/* Social Media Icons - Doodle Style */}
          <ul className="doodle-container">
            <li className="doodle-icon-content">
              <a
                href="https://www.facebook.com/profile.php?id=61593950954172"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="doodle-link link-spotify"
              >
                <svg
                  className="doodle-svg"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 100 100"
                >
                  <path
                    className="doodle-path"
                    d="M29.059 15.085C29.058 7.322 22.764 1.028 15 1.028S0.941 7.323 0.941 15.087c0 6.989 5.1 12.787 11.781 13.875l0.081 0.011V19.15H9.232v-4.065h3.57v-3.096a4.962 4.962 0 0 1 5.329 -5.469l-0.017 -0.001c1.124 0.016 2.212 0.115 3.273 0.292l-0.126 -0.018v3.459h-1.774a2.033 2.033 0 0 0 -2.291 2.204l-0.001 -0.008v2.636h3.899l-0.623 4.065h-3.276v9.823c6.762 -1.101 11.862 -6.899 11.863 -13.888"
                  ></path>
                </svg>
              </a>
              <div className="doodle-tooltip tooltip-spotify">Facebook</div>
            </li>

            <li className="doodle-icon-content">
              <a
                href="https://www.instagram.com/toptruyenreview/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="doodle-link link-pinterest"
              >
                <svg
                  className="doodle-svg"
                  version="1.1"
                  viewBox="0 0 100 100"
                  xmlSpace="preserve"
                >
                  <path
                    className="doodle-path"
                    d="M60 45a15 15 0 1 0 -4.395 10.61A14.4 14.4 0 0 0 60 45.225l-0.004 -0.237zm8.1 0a23.006 23.006 0 1 1 -6.738 -16.347 22.2 22.2 0 0 1 6.742 15.96l-0.004 0.41v-0.02zm6.327 -24.022v0.008a5.4 5.4 0 1 1 -1.582 -3.818 5.177 5.177 0 0 1 1.556 3.705v0.11zm-29.4 -12.9 -4.482 -0.03q-4.072 -0.03 -6.184 0t-5.655 0.176a47.143 47.143 0 0 0 -6.312 0.638l0.273 -0.038a23.571 23.571 0 0 0 -4.362 1.136l0.16 -0.052a15.446 15.446 0 0 0 -8.52 8.452l-0.038 0.102a22.543 22.543 0 0 0 -1.065 4.062l-0.02 0.138a45 45 0 0 0 -0.597 5.96l-0.004 0.08q-0.147 3.548 -0.176 5.655t0 6.184 0.03 4.482 -0.03 4.482 0 6.184 0.176 5.655c0.075 2.193 0.292 4.275 0.638 6.312l-0.038 -0.273a23.571 23.571 0 0 0 1.136 4.362l-0.052 -0.16a15.446 15.446 0 0 0 8.452 8.52l0.102 0.038c1.192 0.446 2.606 0.82 4.062 1.065l0.138 0.02c1.758 0.308 3.84 0.525 5.955 0.597l0.08 0.004q3.548 0.147 5.655 0.176t6.184 0l4.455 -0.09 4.482 0.03q4.072 0.03 6.184 0t5.655 -0.176a47.143 47.143 0 0 0 6.312 -0.638l-0.273 0.038a23.571 23.571 0 0 0 4.362 -1.136l-0.16 0.052a15.446 15.446 0 0 0 8.52 -8.452l0.038 -0.102c0.446 -1.192 0.82 -2.606 1.065 -4.062l0.02 -0.138c0.308 -1.758 0.525 -3.84 0.597 -5.955l0.004 -0.08q0.147 -3.548 0.176 -5.655t0 -6.184 -0.03 -4.482 0.03 -4.482 0 -6.184 -0.176 -5.655a47.143 47.143 0 0 0 -0.638 -6.312l0.038 0.273a23.743 23.743 0 0 0 -1.136 -4.362l0.052 0.16a15.446 15.446 0 0 0 -8.452 -8.52l-0.102 -0.038a22.543 22.543 0 0 0 -4.062 -1.065l-0.138 -0.02a45 45 0 0 0 -5.955 -0.597l-0.08 -0.004q-3.548 -0.147 -5.655 -0.176t-6.184 0zM90 45q0 13.418 -0.3 18.574a24.9 24.9 0 0 1 -26.194 26.13l0.06 0.004q-5.157 0.3 -18.574 0.3t-18.574 -0.3A24.9 24.9 0 0 1 0.286 63.514l-0.004 0.06q-0.3 -5.157 -0.3 -18.574t0.3 -18.574A24.9 24.9 0 0 1 26.478 0.297l-0.058 -0.005q5.157 -0.3 18.574 -0.3t18.574 0.3a24.9 24.9 0 0 1 26.13 26.194l0.004 -0.06Q90 31.578 90 45"
                  ></path>
                </svg>
              </a>
              <div className="doodle-tooltip tooltip-pinterest">Instagram</div>
            </li>

            <li className="doodle-icon-content">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="doodle-link link-twitter"
              >
                <svg className="doodle-svg" version="1.1" viewBox="0 0 100 100">
                  <path
                    className="doodle-path"
                    d="M53.564 38.947 87.066 0h-7.941L50.033 33.816 26.801 0H0l35.136 51.137L0 91.977h7.941l30.722 -35.712 24.54 35.712H90L53.561 38.947zM42.686 51.588l-3.56 -5.093L10.8 5.977h12.194l22.86 32.699 3.56 5.093 29.714 42.503H66.935L42.686 51.591z"
                  ></path>
                </svg>
              </a>
              <div className="doodle-tooltip tooltip-twitter">Twitter</div>
            </li>

            <li className="doodle-icon-content">
              <a
                href="mailto:thndev26@gmail.com"
                aria-label="Mail"
                className="doodle-link link-mail"
              >
                <svg className="doodle-svg" version="1.1" viewBox="0 0 100 100">
                  <path
                    className="doodle-path"
                    d="M20 80A12 12 0 0 1 8 68v-40A12 12 0 0 1 20 16h56A12 12 0 0 1 88 28v40A12 12 0 0 1 76 80zm10.5 -47.12a4 4 0 1 0 -5.001 6.24l15.001 12.004a12 12 0 0 0 15.001 0l15.001 -12a4 4 0 1 0 -5.001 -6.247l-15.001 12a4 4 0 0 1 -5.001 0z"
                  ></path>
                </svg>
              </a>
              <div className="doodle-tooltip tooltip-mail">Mail</div>
            </li>
          </ul>
        </div>

      </div>
    </footer>
  );
};
