const fs = require('fs');

function fixCreatorView() {
  const path = './story-platform/frontend/src/components/views/CreatorStudioView.tsx';
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/const \[priceXu, setPriceXu\] = useState\('0'\);/g, "const [accessLevel, setAccessLevel] = useState('FREE');");
  content = content.replace(/đặt giá xu và theo dõi doanh thu giọng đọc/g, "cài đặt quyền truy cập và theo dõi lượt nghe");
  content = content.replace(/<label className="text-xs font-bold text-slate-300">Giá Mở Khóa \(Xu\)<\/label>/g, '<label className="text-xs font-bold text-slate-300">Quyền Truy Cập</label>');
  
  content = content.replace(/<input\s+type="number"\s+value=\{priceXu\}[\s\S]*?onChange=\{\(e\) => setPriceXu\(e.target.value\)\}[\s\S]*?\/>/g, 
`<select
                  value={accessLevel}
                  onChange={(e) => setAccessLevel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="FREE">Miễn phí (FREE)</option>
                  <option value="PREMIUM">Yêu cầu Premium (PREMIUM)</option>
                </select>`);

  content = content.replace(/<div className="text-xs font-bold text-slate-400 uppercase">Doanh Thu Xu Mở Khóa<\/div>/g, '<div className="text-xs font-bold text-slate-400 uppercase">Tổng Giờ Nghe (Tháng)</div>');
  content = content.replace(/<div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">12.450 Xu<\/div>/g, '<div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">1.450 Giờ</div>');

  fs.writeFileSync(path, content, 'utf8');
}

fixCreatorView();
