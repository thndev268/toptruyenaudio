import React, { useState } from 'react';
import { PenTool, Sparkles, CheckCircle2, ShieldAlert, X, FileText } from 'lucide-react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const BecomeCreatorView: React.FC = () => {
  const { switchRole } = useAuth();
  const { showToast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Form states
  const [penName, setPenName] = useState('');
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [youtubeChannel, setYoutubeChannel] = useState('');
  const [bio, setBio] = useState('');

  // Validation states
  const [penNameError, setPenNameError] = useState('');
  const [genreError, setGenreError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [bioError, setBioError] = useState('');
  const [termsError, setTermsError] = useState('');

  const validateRequired = (val: string, fieldName: string) => {
    if (!val.trim()) return `${fieldName} không được để trống`;
    return '';
  };

  const validateEmail = (val: string) => {
    if (!val) return 'Email không được để trống';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return 'Email không đúng định dạng';
    return '';
  };

  const validatePhone = (val: string) => {
    if (!val) return 'Số điện thoại không được để trống';
    const phoneRegex = /^[0-9]{10,11}$/; // Basic phone validation
    if (!phoneRegex.test(val)) return 'Số điện thoại không hợp lệ (10-11 số)';
    return '';
  };

  const handleEmailBlur = () => setEmailError(validateEmail(email));
  const handlePhoneBlur = () => setPhoneError(validatePhone(phone));
  const handlePenNameBlur = () => setPenNameError(validateRequired(penName, 'Bút danh'));
  const handleGenreBlur = () => setGenreError(validateRequired(favoriteGenre, 'Thể loại'));
  const handleBioBlur = () => setBioError(validateRequired(bio, 'Giới thiệu bản thân'));

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();

    const penNameErr = validateRequired(penName, 'Bút danh');
    const genreErr = validateRequired(favoriteGenre, 'Thể loại');
    const bioErr = validateRequired(bio, 'Giới thiệu bản thân');
    const emailErr = validateEmail(email);
    const phoneErr = validatePhone(phone);
    
    if (penNameErr || genreErr || bioErr || emailErr || phoneErr || !acceptedTerms) {
      setPenNameError(penNameErr);
      setGenreError(genreErr);
      setBioError(bioErr);
      setEmailError(emailErr);
      setPhoneError(phoneErr);
      if (!acceptedTerms) {
        setTermsError('Vui lòng đọc và đồng ý với điều khoản');
      } else {
        setTermsError('');
      }
      return;
    }

    setTermsError('');
    setSubmitted(true);
    switchRole(UserRole.CREATOR);
    showToast('success', 'Đăng ký Tác Giả Sáng Tạo thành công!', 'Bạn đã chuyển sang vai trò CREATOR và có quyền mở Creator Studio.');
  };

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 space-y-8 animate-fadeIn px-4">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-2xl flex items-center justify-center text-slate-950 font-black mx-auto shadow-lg">
          <PenTool className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white">Trở Thành Tác Giả Sáng Tạo Audio</h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Chia sẻ những tác phẩm truyện sáng tạo của bạn đến hàng triệu khán giả thính giả yêu thích truyện audio.
        </p>
      </div>

      {submitted ? (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Yêu Cầu Đã Được Phê Duyệt!</h2>
          <p className="text-xs text-slate-300">Tài khoản của bạn đã được nâng cấp lên vai trò Tác Giả Sáng Tạo (CREATOR). Bạn có thể truy cập Studio đăng tải tác phẩm mới ngay bây giờ.</p>
        </div>
      ) : (
        <form onSubmit={handleApply} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">Đơn Đăng Ký Tác Giả Mới</h3>

          {/* Row 1: Tên/Bút danh & Thể loại sở trường */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Tên / Bút danh tác giả <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={penName}
                onChange={(e) => {
                  setPenName(e.target.value);
                  if (penNameError) setPenNameError(validateRequired(e.target.value, 'Bút danh'));
                }}
                onBlur={handlePenNameBlur}
                placeholder="Bút danh tác giả..."
                className={`w-full bg-slate-950 border ${penNameError ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-700/80 focus:border-cyan-500'} rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none min-h-[44px] transition-colors`}
              />
              {penNameError && <p className="text-rose-400 text-[10px] mt-1">{penNameError}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Thể loại truyện sở trường <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={favoriteGenre}
                onChange={(e) => {
                  setFavoriteGenre(e.target.value);
                  if (genreError) setGenreError(validateRequired(e.target.value, 'Thể loại'));
                }}
                onBlur={handleGenreBlur}
                placeholder="Tiên Hiệp, Đô Thị, Kinh Dị..."
                className={`w-full bg-slate-950 border ${genreError ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-700/80 focus:border-cyan-500'} rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none min-h-[44px] transition-colors`}
              />
              {genreError && <p className="text-rose-400 text-[10px] mt-1">{genreError}</p>}
            </div>
          </div>

          {/* Row 2: Email liên hệ & Số điện thoại */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Email liên hệ <span className="text-rose-500">*</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(validateEmail(e.target.value));
                }}
                onBlur={handleEmailBlur}
                placeholder="example@email.com"
                className={`w-full bg-slate-950 border ${emailError ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-700/80 focus:border-cyan-500'} rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none min-h-[44px] transition-colors`}
              />
              {emailError && <p className="text-rose-400 text-[10px] mt-1">{emailError}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Số điện thoại <span className="text-rose-500">*</span></label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) setPhoneError(validatePhone(e.target.value));
                }}
                onBlur={handlePhoneBlur}
                placeholder="Số điện thoại cá nhân..."
                className={`w-full bg-slate-950 border ${phoneError ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-700/80 focus:border-cyan-500'} rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none min-h-[44px] transition-colors`}
              />
              {phoneError && <p className="text-rose-400 text-[10px] mt-1">{phoneError}</p>}
            </div>
          </div>

          {/* Row 3: Kênh YouTube */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Kênh YouTube</label>
              <span className="text-[10px] text-cyan-400 font-medium bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">Yêu cầu &gt; 1k subs</span>
            </div>
            <input
              type="url"
              value={youtubeChannel}
              onChange={(e) => setYoutubeChannel(e.target.value)}
              placeholder="https://youtube.com/c/your-channel-link"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[44px]"
            />
          </div>

          {/* Textarea: Giới thiệu bản thân & phong cách sáng tác */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Giới thiệu bản thân & phong cách sáng tác <span className="text-rose-500">*</span></label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                if (bioError) setBioError(validateRequired(e.target.value, 'Giới thiệu bản thân'));
              }}
              onBlur={handleBioBlur}
              placeholder="Giới thiệu về các tác phẩm và phong cách viết lách của bạn..."
              className={`w-full bg-slate-950 border ${bioError ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-700/80 focus:border-cyan-500'} rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors`}
            />
            {bioError && <p className="text-rose-400 text-[10px] mt-1">{bioError}</p>}
          </div>

          {/* Checkbox & Terms Link */}
          <div className={`flex flex-col gap-1`}>
            <div className={`flex items-start gap-3 bg-slate-950/40 p-4 rounded-xl border ${termsError ? 'border-rose-500/80' : 'border-slate-800'}`}>
              <input
                type="checkbox"
                id="terms_checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (e.target.checked) setTermsError('');
                }}
                className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 cursor-pointer"
              />
              <label htmlFor="terms_checkbox" className="text-xs text-slate-300 leading-relaxed select-none cursor-pointer">
                Tôi đồng ý với{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-cyan-400 hover:text-cyan-300 font-bold underline inline-block"
                >
                  ĐIỀU KHOẢN DÀNH CHO TÁC GIẢ / CREATOR
                </button>
              </label>
            </div>
            {termsError && <p className="text-rose-400 text-[10px] ml-1">{termsError}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all min-h-[44px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            <span>Nộp Đơn & Nâng Cấp Vai Trò Tác Giả</span>
          </button>
        </form>
      )}

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[300] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-scaleUp overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/50 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base sm:text-lg font-black text-white">ĐIỀU KHOẢN DÀNH CHO TÁC GIẢ / CREATOR</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
              <div className="text-right text-[11px] text-slate-400 italic">
                Cập nhật lần cuối: 12/08/2026
              </div>

              {/* Section 1 */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2 text-cyan-400">
                  1. Điều kiện trở thành Tác giả/Creator
                </h4>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Đủ 18 tuổi trở lên hoặc có sự đồng ý của người giám hộ hợp pháp.</li>
                  <li>Cung cấp thông tin đăng ký chính xác, trung thực (bút danh, thể loại, giới thiệu bản thân).</li>
                  <li>Có kênh YouTube/mạng xã hội với lượng theo dõi tối thiểu hoặc cung cấp mẫu giọng đọc để xét duyệt.</li>
                  <li>Đồng ý và tuân thủ đầy đủ điều khoản này cùng Chính sách bảo mật của nền tảng.</li>
                </ul>
              </div>

              {/* Section 2 */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2 text-cyan-400">
                  2. Quyền sở hữu nội dung
                </h4>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Tác giả xác nhận nội dung đăng tải (văn bản, bản ghi âm giọng đọc) là do chính mình sáng tác hoặc sở hữu hợp pháp quyền sử dụng, không vi phạm bản quyền của bên thứ ba.</li>
                  <li>Tác giả cấp cho nền tảng quyền sử dụng phi độc quyền, miễn phí để lưu trữ, phân phối, hiển thị nội dung trên nền tảng nhằm mục đích vận hành dịch vụ.</li>
                  <li>Tác giả vẫn giữ quyền sở hữu trí tuệ đối với nội dung gốc của mình.</li>
                  <li>Nghiêm cấm đăng tải nội dung vi phạm bản quyền của người khác (chuyển thể trái phép từ tác phẩm đã xuất bản, sử dụng bản ghi âm/giọng đọc của người khác mà chưa được phép).</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2 text-cyan-400">
                  3. Chính sách nội dung
                </h4>
                <p className="font-medium text-slate-200">Nội dung đăng tải không được chứa:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Nội dung khiêu dâm, bạo lực cực đoan, hoặc vi phạm pháp luật Việt Nam.</li>
                  <li>Nội dung phân biệt chủng tộc, tôn giáo, kích động thù hận.</li>
                  <li>Thông tin sai sự thật, lừa đảo người dùng.</li>
                  <li>Quảng cáo trái phép, spam không liên quan đến nội dung truyện.</li>
                </ul>
                <p className="bg-slate-950/65 border border-slate-850 p-3 rounded-xl italic text-slate-300">
                  Nền tảng có quyền từ chối, gỡ bỏ nội dung vi phạm và thông báo lý do cụ thể cho Tác giả.
                </p>
              </div>

              {/* Section 4 */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2 text-cyan-400">
                  4. Lợi ích dành cho Tác giả
                </h4>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Được hiển thị tên/bút danh, giới thiệu bản thân trên trang cá nhân Creator.</li>
                  <li>Được gắn liên kết dẫn về kênh YouTube/mạng xã hội cá nhân (nếu có) để tăng lượng theo dõi.</li>
                  <li>Không phát sinh chi phí hay nghĩa vụ tài chính nào giữa hai bên — đây là hình thức hợp tác quảng bá nội dung, không phải quan hệ chia sẻ doanh thu.</li>
                </ul>
              </div>

              {/* Section 5 */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2 text-cyan-400">
                  5. Trách nhiệm của Tác giả
                </h4>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Đảm bảo chất lượng nội dung (âm thanh rõ ràng, không lỗi kỹ thuật nghiêm trọng).</li>
                  <li>Chịu trách nhiệm pháp lý nếu nội dung đăng tải vi phạm quyền của bên thứ ba, gây thiệt hại cho nền tảng hoặc người dùng khác.</li>
                </ul>
              </div>

              {/* Section 6 */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2 text-cyan-400">
                  6. Quyền của nền tảng
                </h4>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Có quyền tạm ngưng hoặc chấm dứt tư cách Creator nếu vi phạm điều khoản, có khiếu nại bản quyền hợp lệ từ bên thứ ba.</li>
                  <li>Có quyền thay đổi chính sách nội dung với thông báo trước [X ngày].</li>
                  <li>Có quyền sử dụng hình ảnh, tên/bút danh của Tác giả cho mục đích quảng bá nền tảng (trừ khi Tác giả từ chối bằng văn bản).</li>
                </ul>
              </div>

              {/* Section 7 */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2 text-cyan-400">
                  7. Chấm dứt hợp tác
                </h4>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Tác giả có thể yêu cầu ngừng hợp tác, gỡ nội dung bất kỳ lúc nào, thông báo trước [X ngày].</li>
                  <li>Sau khi chấm dứt, nội dung sẽ được gỡ khỏi nền tảng theo yêu cầu trong vòng [X ngày].</li>
                </ul>
              </div>

              {/* Section 8 */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2 text-cyan-400">
                  8. Giải quyết tranh chấp
                </h4>
                <p>
                  Mọi tranh chấp phát sinh sẽ được ưu tiên giải quyết thông qua thương lượng. Trường hợp không đạt thỏa thuận, tranh chấp sẽ được giải quyết theo quy định pháp luật Việt Nam hiện hành.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAcceptedTerms(true);
                  setTermsError('');
                  setShowTermsModal(false);
                }}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer shadow-lg shadow-cyan-500/10"
              >
                Tôi đồng ý & Đóng lại
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

