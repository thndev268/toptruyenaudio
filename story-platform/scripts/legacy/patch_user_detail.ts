import fs from 'fs';

let content = fs.readFileSync('story-platform/frontend/src/components/admin/screens/UserDetailModal.tsx', 'utf8');

if (!content.includes('HonoraryTitleManagement')) {
  // We'll replace the render block around className="col-span-1 lg:col-span-2 space-y-6"
  // to insert a new section for Honorary Titles.

  const titleSection = `
            {/* Honorary Titles Management */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                  <Award className="w-5 h-5 mr-2 text-amber-500" />
                  Danh Hiệu Vinh Danh
                </h3>
              </div>
              
              <div className="space-y-4">
                {user.honoraryTitles && user.honoraryTitles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.honoraryTitles.map(t => (
                      <div key={t.titleId} className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-full pl-3 pr-1 py-1 border border-slate-200 dark:border-slate-700">
                        <span className="text-sm font-medium mr-2 text-slate-800 dark:text-slate-200">{t.name}</span>
                        <button 
                          onClick={() => {
                            if (window.confirm('Xóa danh hiệu ' + t.name + ' của user này?')) {
                              import('../../../services/repositories/AdminRepository').then(mod => {
                                mod.adminRepository.removeTitleFromUser(user.id, t.titleId);
                                window.location.reload(); // Simple refresh for now
                              });
                            }
                          }}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Người dùng này chưa có danh hiệu nào.</p>
                )}
                
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button 
                    onClick={() => {
                      const titleId = window.prompt('Nhập ID danh hiệu để cấp (title-1, title-2, title-3):');
                      if (titleId) {
                        import('../../../services/repositories/AdminRepository').then(mod => {
                          mod.adminRepository.assignTitleToUser(user.id, titleId);
                          window.location.reload(); // Simple refresh
                        });
                      }
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    + Cấp danh hiệu mới
                  </button>
                </div>
              </div>
            </div>
`;
  
  content = content.replace(/(<div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">[\s\S]*?<h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">[\s\S]*?Lịch Sử Hoạt Động)/, titleSection + '\n            $1');
  
  if (!content.includes('Award')) {
    content = content.replace(/import {([^}]+)} from 'lucide-react';/, "import { Award, $1 } from 'lucide-react';");
  }
  
  fs.writeFileSync('story-platform/frontend/src/components/admin/screens/UserDetailModal.tsx', content);
}
