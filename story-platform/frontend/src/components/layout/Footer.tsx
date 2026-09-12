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
        <div className="mt-6 sm:mt-8 flex justify-center pb-2 sm:pb-4">
          <div className="tooltip-container">
            {/* Main send icon */}
            <span className="text">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 16 16"
              >
                <path
                  d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471z"
                ></path>
              </svg>
            </span>
            
            {/* Twitter */}
            <a href={getLinkUrl('TWITTER')} target="_blank" rel="noopener noreferrer" className="tooltip1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
                <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334q.002-.211-.006-.422A6.7 6.7 0 0 0 16 3.542a6.7 6.7 0 0 1-1.889.518 3.3 3.3 0 0 0 1.447-1.817 6.5 6.5 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.32 9.32 0 0 1-6.767-3.429 3.29 3.29 0 0 0 1.018 4.382A3.3 3.3 0 0 1 .64 6.575v.045a3.29 3.29 0 0 0 2.632 3.218 3.2 3.2 0 0 1-.865.115 3 3 0 0 1-.614-.057 3.28 3.28 0 0 0 3.067 2.277A6.6 6.6 0 0 1 .78 13.58a6 6 0 0 1-.78-.045A9.34 9.34 0 0 0 5.026 15"></path>
              </svg>
            </a>
            
            {/* Facebook */}
            <a href={getLinkUrl('FACEBOOK')} target="_blank" rel="noopener noreferrer" className="tooltip2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
                <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"></path>
              </svg>
            </a>
            
            {/* WhatsApp */}
            <a href={getLinkUrl('WHATSAPP')} target="_blank" rel="noopener noreferrer" className="tooltip3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"></path>
              </svg>
            </a>
            
            {/* Discord */}
            <a href={getLinkUrl('DISCORD')} target="_blank" rel="noopener noreferrer" className="tooltip4">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
                <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"></path>
              </svg>
            </a>
            
            {/* Pinterest */}
            <a href={getLinkUrl('PINTEREST')} target="_blank" rel="noopener noreferrer" className="tooltip5">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
                <path d="M8 0a8 8 0 0 0-2.915 15.452c-.07-.633-.134-1.606.027-2.297.146-.625.938-3.977.938-3.977s-.239-.479-.239-1.187c0-1.113.645-1.943 1.448-1.943.682 0 1.012.512 1.012 1.127 0 .686-.437 1.712-.663 2.663-.188.796.4 1.446 1.185 1.446 1.422 0 2.515-1.5 2.515-3.664 0-1.915-1.377-3.254-3.342-3.254-2.276 0-3.612 1.707-3.612 3.471 0 .688.265 1.425.595 1.826a.24.24 0 0 1 .056.23c-.061.252-.196.796-.222.907-.035.146-.116.177-.268.107-1-.465-1.624-1.926-1.624-3.1 0-2.523 1.834-4.84 5.286-4.84 2.775 0 4.932 1.977 4.932 4.62 0 2.757-1.739 4.976-4.151 4.976-.811 0-1.573-.421-1.834-.919l-.498 1.902c-.181.695-.669 1.566-.995 2.097A8 8 0 1 0 8 0"></path>
              </svg>
            </a>
            
            {/* Dribbble */}
            <a href={getLinkUrl('DRIBBBLE')} target="_blank" rel="noopener noreferrer" className="tooltip6">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M8 0C3.584 0 0 3.584 0 8s3.584 8 8 8c4.408 0 8-3.584 8-8s-3.592-8-8-8m5.284 3.688a6.8 6.8 0 0 1 1.545 4.251c-.226-.043-2.482-.503-4.755-.217-.052-.112-.096-.234-.148-.355-.139-.33-.295-.668-.451-.99 2.516-1.023 3.662-2.498 3.81-2.69zM8 1.18c1.735 0 3.323.65 4.53 1.718-.122.174-1.155 1.553-3.584 2.464-1.12-2.056-2.36-3.74-2.551-4A7 7 0 0 1 8 1.18m-2.907.642A43 43 0 0 1 7.627 5.77c-3.193.85-6.013.833-6.317.833a6.87 6.87 0 0 1 3.783-4.78zM1.163 8.01V7.8c.295.01 3.61.053 7.02-.971.199.381.381.772.555 1.162l-.27.078c-3.522 1.137-5.396 4.243-5.553 4.504a6.82 6.82 0 0 1-1.752-4.564zM8 14.837a6.8 6.8 0 0 1-4.19-1.44c.12-.252 1.509-2.924 5.361-4.269.018-.009.026-.009.044-.017a28.3 28.3 0 0 1 1.457 5.18A6.7 6.7 0 0 1 8 14.837m3.81-1.171c-.07-.417-.435-2.412-1.328-4.868 2.143-.338 4.017.217 4.251.295a6.77 6.77 0 0 1-2.924 4.573z"></path>
              </svg>
            </a>
            
            {/* GitHub */}
            <a href={getLinkUrl('GITHUB')} target="_blank" rel="noopener noreferrer" className="tooltip7">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"></path>
              </svg>
            </a>
            
            {/* Reddit */}
            <a href={getLinkUrl('REDDIT')} target="_blank" rel="noopener noreferrer" className="tooltip8">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
                <path d="M6.167 8a.83.83 0 0 0-.83.83c0 .459.372.84.83.831a.831.831 0 0 0 0-1.661m1.843 3.647c.315 0 1.403-.038 1.976-.611a.23.23 0 0 0 0-.306.213.213 0 0 0-.306 0c-.353.363-1.126.487-1.67.487-.545 0-1.308-.124-1.671-.487a.213.213 0 0 0-.306 0 .213.213 0 0 0 0 .306c.564.563 1.652.61 1.977.61zm.992-2.807c0 .458.373.83.831.83s.83-.381.83-.83a.831.831 0 0 0-1.66 0z"></path>
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.828-1.165c-.315 0-.602.124-.812.325-.801-.573-1.9-.945-3.121-.993l.534-2.501 1.738.372a.83.83 0 1 0 .83-.869.83.83 0 0 0-.744.468l-1.938-.41a.2.2 0 0 0-.153.028.2.2 0 0 0-.086.134l-.592 2.788c-1.24.038-2.358.41-3.17.992-.21-.2-.496-.324-.81-.324a1.163 1.163 0 0 0-.478 2.224q-.03.17-.029.353c0 1.795 2.091 3.256 4.669 3.256s4.668-1.451 4.668-3.256c0-.114-.01-.238-.029-.353.401-.181.688-.592.688-1.069 0-.65-.525-1.165-1.165-1.165"></path>
              </svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
