import fs from 'fs';

let content = fs.readFileSync('story-platform/frontend/src/components/views/AccountView.tsx', 'utf8');

if (!content.includes('HonoraryTitleDisplay')) {
  // We'll add a new section to display Honorary Titles
  const titleSection = `
        {/* Danh Hiệu Vinh Danh */}
        {user.honoraryTitles && user.honoraryTitles.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 mt-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <Award className="w-5 h-5 text-amber-500 mr-2" />
              Danh Hiệu Của Bạn
            </h3>
            <div className="flex flex-wrap gap-3">
              {user.honoraryTitles.map(title => {
                let classes = 'inline-flex items-center px-3 py-1.5 rounded-lg font-medium text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-all hover:-translate-y-0.5';
                let iconName = '';
                
                title.effects.forEach(e => {
                  if (e.type === 'TEXT_COLOR' && e.color) classes += \` \${e.color}\`;
                  if (e.type === 'BORDER' && e.color) classes += \` !border-\${e.color.split('-')[1]}-\${e.color.split('-')[2]}\`;
                  if (e.type === 'GLOW' && e.color) classes += \` shadow-lg \${e.color}\`;
                  if (e.type === 'ICON' && e.iconName) iconName = e.iconName;
                });
                
                const Icon = iconName ? require('lucide-react')[iconName] : null;

                return (
                  <div key={title.titleId} className={classes} title={\`Được phong tặng vào \${new Date(title.assignedAt).toLocaleDateString('vi-VN')}\`}>
                    {Icon && <Icon className="w-4 h-4 mr-1.5" />}
                    {title.name}
                  </div>
                );
              })}
            </div>
          </div>
        )}
`;

  content = content.replace(/(<div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">[\s\S]*?<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">[\s\S]*?Bảo Mật)/, titleSection + '\n        $1');
  
  if (!content.includes('Award')) {
    content = content.replace(/import {([^}]+)} from 'lucide-react';/, "import { Award, $1 } from 'lucide-react';");
  }

  fs.writeFileSync('story-platform/frontend/src/components/views/AccountView.tsx', content);
}
