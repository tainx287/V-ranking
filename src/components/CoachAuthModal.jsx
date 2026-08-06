import React, { useState } from 'react';
import { X, Lock, KeyRound, Check, ShieldCheck } from 'lucide-react';
import coachesList from '../data/coachesData.json';

export default function CoachAuthModal({
  isOpen,
  onClose,
  onLoginSuccess
}) {
  const [selectedCoachEmail, setSelectedCoachEmail] = useState(coachesList[0]?.email || '');
  const [pinInput, setPinInput] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    // For demo, accept PIN '1234' or any 4 digit pin
    if (pinInput === '1234' || pinInput.length >= 4) {
      const coach = coachesList.find(c => c.email === selectedCoachEmail) || {
        name: 'Lab Coach',
        email: selectedCoachEmail
      };
      // Attach the room info to the coach object
      onLoginSuccess({ ...coach, room: roomInput || 'Chưa chọn phòng' });
      onClose();
    } else {
      setErrorMsg('Mã PIN không đúng (Mặc định demo: 1234)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-100">Đăng Nhập Lab Coach</h3>
            <p className="text-[11px] text-slate-400">Xác thực để mở quyền cộng điểm & duyệt yêu cầu</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">Chọn Tài Khoản Coach:</label>
            <select
              value={selectedCoachEmail}
              onChange={(e) => setSelectedCoachEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              {coachesList.map((c) => (
                <option key={c.id} value={c.email}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">Mã PIN xác thực:</label>
            <input
              type="password"
              placeholder="Nhập PIN (Mặc định: 1234)"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setErrorMsg('');
              }}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono tracking-widest text-center"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">Chọn Phòng Học Cố Định:</label>
            <select
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-bold"
            >
              <option value="">-- Chọn phòng trực ca --</option>
              <option value="Phòng D301">Phòng D301</option>
              <option value="Phòng D302">Phòng D302</option>
              <option value="Phòng D303">Phòng D303</option>
              <option value="Phòng D304">Phòng D304</option>
              <option value="Phòng D305">Phòng D305</option>
              <option value="Phòng C401">Phòng C401</option>
              <option value="Phòng C402">Phòng C402</option>
              <option value="Phòng E401">Phòng E401</option>
              <option value="Phòng E402">Phòng E402</option>
              <option value="Phòng E403">Phòng E403</option>
              <option value="Hội Trường B">Hội Trường B</option>
            </select>
          </div>

          {errorMsg && (
            <p className="text-[11px] text-rose-400 font-medium text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Mở Quyền Quản Lý Coach</span>
          </button>
        </form>
      </div>
    </div>
  );
}
