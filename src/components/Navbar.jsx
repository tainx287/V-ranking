import React, { useState, useEffect } from 'react';
import { Tv, UserCheck, Database, Volume2, VolumeX, Sparkles, Trophy, Calendar, Search, ShieldCheck, LogOut, Moon, Sun, Settings, Clock, Activity, Menu, X } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  selectedSession,
  setSelectedSession,
  sessions,
  soundEnabled,
  setSoundEnabled,
  onOpenClaimModal,
  onOpenAuthModal,
  currentCoach,
  onLogoutCoach,
  searchStudentQuery,
  setSearchStudentQuery,
  searchCohort,
  setSearchCohort,
  theme,
  setTheme
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [timeStr, setTimeStr] = useState(() => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 shadow-sm dark:shadow-slate-950/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Live Badge */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-black text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                LabScore <span className="text-amber-500">LIVE</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                CONNECTED
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Session Selector (Big & Readable) */}
        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-inner">
          <Calendar className="w-4 h-4 text-slate-400 mr-2" />
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="bg-transparent text-slate-800 dark:text-slate-100 font-extrabold text-sm focus:outline-none cursor-pointer pr-4"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id} className="bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 font-bold">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Realtime Clock & Actions */}
        <div className="flex items-center space-x-4 shrink-0">
          
          {/* Quick Search + Cohort Filter */}
          <div className="relative hidden sm:flex items-center gap-1.5">
            <div className="relative w-40 md:w-48">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm nhanh học viên..."
                value={searchStudentQuery}
                onChange={(e) => setSearchStudentQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-700 transition-all placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>


          {/* Clock (Hidden on Mobile) */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs font-black shadow-inner">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{timeStr}</span>
          </div>

          {/* Settings Menu Gear Toggle */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`p-2.5 rounded-xl border transition-all ${
                menuOpen 
                  ? 'bg-slate-900 dark:bg-slate-700 border-slate-900 dark:border-slate-600 text-white rotate-45 shadow-lg shadow-slate-950/20' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white shadow-sm'
              }`}
              title="Cấu hình & Quản trị"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
            </button>

            {/* Dropdown Menu Panel */}
            {menuOpen && (
              <>
                {/* Overlay backdrop to close menu */}
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                
                <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-4 space-y-4 z-50 animate-fadeIn text-slate-900 dark:text-slate-100">
                  
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                    <h4 className="font-extrabold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">Bảng Điều Khiển</h4>
                  </div>

                  {/* Mobile-only Controls: Search & Session */}
                  <div className="sm:hidden space-y-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative w-full">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Tìm học viên..."
                        value={searchStudentQuery}
                        onChange={(e) => setSearchStudentQuery(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
                      />
                    </div>
                    <div className="md:hidden flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200">
                      <Calendar className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                      <select
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                        className="bg-transparent text-slate-800 dark:text-slate-100 font-extrabold text-xs w-full focus:outline-none cursor-pointer"
                      >
                        {sessions.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Mode switcher tabs */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 block mb-1">MÀN HÌNH CHẾ ĐỘ</span>
                    
                    <button
                      onClick={() => { setActiveTab('tv'); setMenuOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        activeTab === 'tv' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Tv className="w-4 h-4" />
                      <span>Bảng Xếp Hạng (Công khai)</span>
                    </button>

                    <button
                      onClick={() => {
                        if (!currentCoach) {
                          onOpenAuthModal();
                        } else {
                          setActiveTab('coach');
                        }
                        setMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        activeTab === 'coach' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Lab Coach Control</span>
                    </button>

                    <button
                      onClick={() => {
                        if (!currentCoach) {
                          onOpenAuthModal();
                        } else {
                          setActiveTab('data');
                        }
                        setMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        activeTab === 'data' ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Database className="w-4 h-4" />
                      <span>Quản Lý Dữ Liệu (Import/Export)</span>
                    </button>
                  </div>

                  {/* Student Claims Button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => { onOpenClaimModal(); setMenuOpen(false); }}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Học Viên Tự Tích Điểm Claim</span>
                    </button>
                  </div>

                  {/* Toggles (Sound & Theme) */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        soundEnabled
                          ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      {soundEnabled ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Bật Âm</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                          <span>Tắt Âm</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                      className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        theme === 'dark'
                          ? 'bg-indigo-950 border-indigo-800 text-indigo-300 hover:bg-indigo-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {theme === 'light' ? (
                        <>
                          <Moon className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Tối</span>
                        </>
                      ) : (
                        <>
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                          <span>Sáng</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Coach Account Info */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    {currentCoach ? (
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
                        <div className="flex items-center space-x-2 min-w-0">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{currentCoach.name}</p>
                            <p className="text-[9px] text-slate-400 truncate">{currentCoach.room}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => { onLogoutCoach(); setMenuOpen(false); }}
                          className="p-1 rounded bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-colors"
                          title="Đăng xuất Coach"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { onOpenAuthModal(); setMenuOpen(false); }}
                        className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 font-extrabold text-xs transition-colors"
                      >
                        Đăng Nhập Lab Coach
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
