import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, Sparkles, User, AlertCircle, Clock } from 'lucide-react';

export default function StudentClaimModal({
  isOpen,
  onClose,
  students,
  selectedSession,
  claimRequests,
  onSendClaimRequest
}) {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [pointType, setPointType] = useState(1);
  const [reasonText, setReasonText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cooldown countdown state
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    const lastTime = localStorage.getItem('last_claim_time');
    if (lastTime) {
      const elapsed = Math.floor((Date.now() - parseInt(lastTime, 10)) / 1000);
      if (elapsed < 60) {
        setCooldownRemaining(60 - elapsed);
      }
    }
  }, [isOpen]);

  // Cooldown interval timer
  useEffect(() => {
    let timer = null;
    if (cooldownRemaining > 0) {
      timer = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedStudentId) {
      setErrorMsg('Vui lòng chọn tên học viên.');
      return;
    }

    if (cooldownRemaining > 0) {
      setErrorMsg(`Vui lòng chờ ${cooldownRemaining}s trước khi gửi yêu cầu tiếp theo.`);
      return;
    }

    // Check duplicate pending claim for this student
    const existingPending = claimRequests.find(
      c => c.student_id === selectedStudentId && c.session_id === selectedSession && c.status === 'pending'
    );
    if (existingPending) {
      setErrorMsg('Bạn đã có 1 yêu cầu đang chờ Coach duyệt. Vui lòng báo Coach duyệt trước khi gửi thêm!');
      return;
    }

    // Check max claims limit (max 5 per session per student)
    const studentClaimsCount = claimRequests.filter(
      c => c.student_id === selectedStudentId && c.session_id === selectedSession
    ).length;

    if (studentClaimsCount >= 5) {
      setErrorMsg('Bạn đã đạt giới hạn tối đa 5 lượt gửi trong buổi học này. Nếu phát biểu thêm, hãy báo trực tiếp Coach nhé!');
      return;
    }

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    const claim = {
      id: `CLAIM-${Date.now()}`,
      session_id: selectedSession,
      student_id: student.id,
      student_name: student.name,
      team_code: student.team_code,
      class_name: student.class_name || 'C401',
      points: pointType,
      reason: reasonText.trim() || (pointType === 1 ? 'Phát biểu trên lớp' : 'Demo xuất sắc'),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      status: 'pending'
    };

    onSendClaimRequest(claim);

    // Set 60s cooldown
    localStorage.setItem('last_claim_time', Date.now().toString());
    setCooldownRemaining(60);

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-emerald-300">Đã Gửi Yêu Cầu Tích Điểm!</h3>
            <p className="text-xs text-slate-300">
              Yêu cầu của bạn đã được chuyển tới Lab Coach đứng lớp. Hãy báo Lab Coach duyệt 1-click nhé!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-extrabold text-base text-slate-100">Gửi Yêu Cầu Tích Điểm Phát Biểu</h3>
                <p className="text-[11px] text-slate-400">Tự gửi thông tin để Coach duyệt nhanh (Có chống Spam)</p>
              </div>
            </div>

            {/* Select Student Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">1. Chọn Tên & Mã Số Học Viên Của Bạn:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setErrorMsg('');
                }}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Chọn tên bạn từ danh sách lớp --</option>
                {[...students].sort((a, b) => a.name.localeCompare(b.name, 'vi')).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id}) - {s.course || ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                🔍 Không thấy tên mình? Hãy <span className="text-amber-400 font-bold">liên hệ Lab Coach gần nhất</span> để được bổ sung vào hệ thống.
              </p>
            </div>

            {/* Point Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">2. Mức Điểm Đề Xuất Tích Lũy:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPointType(1)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    pointType === 1
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  ✋ +1 Điểm
                  <span className="block text-[10px] font-normal text-slate-400">Phát biểu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPointType(3)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    pointType === 3
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  🚀 +3 Điểm
                  <span className="block text-[10px] font-normal text-slate-400">Demo xuất sắc</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPointType(2)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    pointType === 2
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  🦸 +2 Điểm
                  <span className="block text-[10px] font-normal text-slate-400">Hỗ trợ đồng đội</span>
                </button>
              </div>
            </div>


            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">3. Nội dung phát biểu / demo ngắn gọn (Tùy chọn):</label>
              <input
                type="text"
                placeholder="Vd: Demo chạy ổn định API, Trả lời câu hỏi slide 5..."
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedStudentId || cooldownRemaining > 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all"
            >
              {cooldownRemaining > 0 ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Chờ {cooldownRemaining}s Để Gửi Tiếp...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi Cho Lab Coach Duyệt Ngay</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
