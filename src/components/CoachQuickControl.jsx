import React, { useState } from 'react';
import { Search, PlusCircle, RotateCcw, CheckCircle2, UserPlus, Sparkles, Zap, Flame, ShieldAlert, Award, Copy, Check, Trash2, Users, Hand } from 'lucide-react';
import { playCoinSound, playFanfareSound } from '../utils/audio';
import confetti from 'canvas-confetti';

export default function CoachQuickControl({
  students,
  pointsRecords,
  onAddPointRecord,
  onUndoPointRecord,
  selectedSession,
  soundEnabled,
  currentCoach,
  claimRequests,
  helpRequests = [],
  onApproveClaimRequest,
  onRejectClaimRequest,
  onClearAllPendingClaims,
  onResolveHelpRequest,
  onAddStudent
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [customReason, setCustomReason] = useState('');
  const [customPts, setCustomPts] = useState(1);
  const [pointCategory, setPointCategory] = useState('INDIVIDUAL'); // 'INDIVIDUAL' | 'TEAM' | 'SUPPORT'
  const [copiedReport, setCopiedReport] = useState(false);

  // New Student State
  const [newStudentSuffix, setNewStudentSuffix] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCourse, setNewStudentCourse] = useState('Khóa 4');
  const [newStudentClass, setNewStudentClass] = useState('D301');

  // Filter students based on search term
  const [inputMode, setInputMode] = useState('INDIVIDUAL'); // 'INDIVIDUAL' | 'TEAM'

  // Smart Team Builder State
  const [teamLabel, setTeamLabel] = useState(''); // Free-form label (e.g. "Nhóm A - Bàn 3")
  const [teamAddPoints, setTeamAddPoints] = useState(2);
  const [teamAddReason, setTeamAddReason] = useState('Thuyết trình / Demo nhóm xuất sắc');
  const [teamMembers, setTeamMembers] = useState([]); // Array of student objects
  const [teamSearchTerm, setTeamSearchTerm] = useState(''); // Separate search for team builder
  const [teamConfirmed, setTeamConfirmed] = useState(false);
  const [teamClass, setTeamClass] = useState('ALL'); // Selected class for the team
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.team_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Current session points filtered ONLY for the current logged-in Coach
  const currentSessionPoints = pointsRecords.filter(p => p.session_id === selectedSession);
  const mySessionPoints = currentSessionPoints.filter(p => {
    if (!currentCoach || !currentCoach.email) return true;
    return p.coach_email === currentCoach.email;
  });

  // Filter pending claims for selected session
  const pendingClaims = claimRequests.filter(c => c.session_id === selectedSession && c.status === 'pending');
  
  const [showAllRoomsHelp, setShowAllRoomsHelp] = useState(false);
  const activeHelpRequests = helpRequests.filter(r => {
    if (r.session_id !== selectedSession) return false;
    if (showAllRoomsHelp) return true;
    if (!currentCoach?.room || currentCoach.room === 'Chưa chọn phòng') return true;
    return r.room === currentCoach.room;
  });

  // Quick Award handler (Single student)
  const handleAwardPoints = (student, pts, defaultReason, cat = 'INDIVIDUAL') => {
    const reasonText = customReason.trim() || defaultReason;
    const catLabel = cat === 'TEAM' ? '👥 Điểm Nhóm' : cat === 'SUPPORT' ? '🦸 Hỗ trợ đồng đội' : '👤 Điểm cá nhân';

    const newRecord = {
      id: `PTS-LIVE-${Date.now()}`,
      session_id: selectedSession,
      class_name: student.class_name || 'C401',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      coach_email: currentCoach ? currentCoach.email : 'labcoach@labflow.edu.vn',
      coach_name: currentCoach ? currentCoach.name : 'Lab Coach',
      coach_room: currentCoach?.room ? currentCoach.room : 'Chưa rõ phòng',
      student_id: student.id,
      student_name: student.name,
      team_code: student.team_code,
      type: cat,
      category_label: catLabel,
      points: pts,
      reason: reasonText,
      raw_line: `${student.name} - ${pts} - ${student.id} - ${reasonText}`
    };

    onAddPointRecord(newRecord);

    if (soundEnabled) {
      if (pts >= 3) playFanfareSound();
      else playCoinSound();
    }

    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    setCustomReason('');
  };

  // Award Team Points to ALL members in the team!
  const handleAwardEntireTeam = (teamCode, pts, reason) => {
    if (!teamCode || teamCode === 'N/A' || !selectedStudent) return;
    const teamMembers = students.filter(s => s.team_code === teamCode && s.course === selectedStudent.course);

    const coachName = currentCoach ? currentCoach.name : 'Lab Coach';
    const coachRoom = currentCoach?.room ? currentCoach.room : 'Chưa rõ phòng';
    const coachEmail = currentCoach ? currentCoach.email : 'labcoach@labflow.edu.vn';

    teamMembers.forEach(student => {
      const newRecord = {
        id: `PTS-TEAM-${Date.now()}-${student.id}`,
        session_id: selectedSession,
        class_name: student.class_name || 'C401',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        coach_email: coachEmail,
        coach_name: coachName,
        coach_room: coachRoom,
        student_id: student.id,
        student_name: student.name,
        team_code: student.team_code,
        type: 'TEAM',
        category_label: '👥 Điểm Nhóm / Dự án',
        points: pts,
        reason: `[Điểm Cả Team ${teamCode}] ${reason}`,
        raw_line: `${student.name} - ${pts} - ${student.id} - Thuyết trình nhóm ${teamCode}`
      };
      onAddPointRecord(newRecord);
    });

    if (soundEnabled) playFanfareSound();
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
  };

  // Generate Categorized Report Text for Google Form (ONLY FOR THIS COACH)
  const handleCopyGoogleFormReport = () => {
    const sessionName = selectedSession;
    const coachName = currentCoach ? currentCoach.name : 'Lab Coach';
    const roomName = currentCoach?.room ? currentCoach.room : 'Chưa rõ phòng';
    
    let reportText = `BÁO CÁO LỊCH SỬ GHI ĐIỂM LAB COACH\n`;
    reportText += `Ca Học: ${sessionName}\n`;
    reportText += `Lab Coach: COACH ${coachName}\n`;
    reportText += `Phòng Trực: ${roomName}\n`;
    reportText += `-----------------------------------\n`;
    
    const indivList = mySessionPoints.filter(p => p.type === 'INDIVIDUAL');
    const teamList = mySessionPoints.filter(p => p.type === 'TEAM');
    const suppList = mySessionPoints.filter(p => p.type === 'SUPPORT');

    if (indivList.length > 0) {
      reportText += `\n--- I. ĐIỂM CÁ NHÂN PHÁT BIỂU ---\n`;
      indivList.forEach(p => {
        reportText += `${p.student_name} - ${p.points} - ${p.student_id} (${p.reason})\n`;
      });
    }

    if (teamList.length > 0) {
      reportText += `\n--- II. ĐIỂM NHÓM & DỰ ÁN ---\n`;
      teamList.forEach(p => {
        reportText += `${p.student_name} - ${p.points} - ${p.student_id} (Team ${p.team_code}: ${p.reason})\n`;
      });
    }

    if (suppList.length > 0) {
      reportText += `\n--- III. ĐIỂM HỖ TRỢ ĐỒNG ĐỘI / CỨU TEAM ---\n`;
      suppList.forEach(p => {
        reportText += `${p.student_name} - ${p.points} - ${p.student_id} (${p.reason})\n`;
      });
    }

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const handleFastAddStudent = () => {
    if (!newStudentSuffix || !newStudentName) return;
    
    // Auto prefix 2A20260 if the user just typed 4 digits
    let fullId = newStudentSuffix;
    if (newStudentSuffix.length === 4 && /^\d+$/.test(newStudentSuffix)) {
      fullId = `2A20260${newStudentSuffix}`;
    } else if (!fullId.startsWith('2A20260')) {
      fullId = `2A20260${newStudentSuffix}`;
    }

    const newStudent = {
      id: fullId,
      name: newStudentName.trim(),
      course: newStudentCourse,
      team_code: 'N/A',
      project_name: 'Chưa có dự án',
      role: 'Thành viên',
      ai_score: 0,
      class_name: newStudentClass,
      trend: 'up',
      streak: 1,
      isNew: true
    };

    if (onAddStudent) {
      onAddStudent(newStudent);
      setSelectedStudent(newStudent);
      setSearchTerm('');
      setNewStudentSuffix('');
      setNewStudentName('');
      // Keep course and class for subsequent additions, or reset? Reset suffix and name is fine.
      
      if (soundEnabled) playFanfareSound();
      confetti({ particleCount: 30, spread: 40, origin: { y: 0.6 } });
    }
  };

  // Smart Team Builder: Add a student to the temp team list
  const handleAddToTeam = (student) => {
    if (teamMembers.find(m => m.id === student.id)) return; // already in list
    setTeamMembers(prev => [...prev, student]);
    setTeamSearchTerm('');
  };

  // Smart Team Builder: Remove a student from temp list
  const handleRemoveFromTeam = (studentId) => {
    setTeamMembers(prev => prev.filter(m => m.id !== studentId));
  };

  // Smart Team Builder: Award points to all members in temp list
  const handleConfirmTeamAward = () => {
    if (teamMembers.length === 0) return;

    const coachName = currentCoach ? currentCoach.name : 'Lab Coach';
    const coachRoom = currentCoach?.room ? currentCoach.room : 'Chưa rõ phòng';
    const coachEmail = currentCoach ? currentCoach.email : 'labcoach@labflow.edu.vn';
    const baseLabel = teamLabel.trim() || `Nhóm ${teamMembers.length} người`;
    const labelText = teamClass !== 'ALL' ? `[${teamClass}] ${baseLabel}` : baseLabel;
    const baseTime = Date.now();

    teamMembers.forEach((st, idx) => {
      const newRecord = {
        id: `PTS-TEAM-${baseTime + idx}-${st.id}`,
        session_id: selectedSession,
        class_name: st.class_name || 'Phòng',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        coach_email: coachEmail,
        coach_name: coachName,
        coach_room: coachRoom,
        student_id: st.id,
        student_name: st.name,
        course: st.course,
        points: parseInt(teamAddPoints),
        reason: `[${labelText}] ${teamAddReason}`,
        type: 'TEAM',
        category_label: '👥 Điểm Nhóm / Dự án',
        team_code: labelText,
        raw_line: `${st.name} - ${teamAddPoints} - ${st.id} - [${labelText}] ${teamAddReason}`
      };
      onAddPointRecord(newRecord);
    });

    if (soundEnabled) playFanfareSound();
    confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } });
    setTeamConfirmed(true);
    setTimeout(() => {
      setTeamConfirmed(false);
      setTeamMembers([]);
      setTeamLabel('');
      setTeamAddReason('Thuyết trình / Demo nhóm xuất sắc');
    }, 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Top Banner Info & Copy History Button */}
      <div className="bg-amber-500/10 dark:bg-amber-500/15 p-5 rounded-2xl border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-lg font-black text-slate-900 dark:text-amber-300">
              Bảng Thao Tác: <span className="text-amber-600 dark:text-amber-400 font-extrabold">COACH {currentCoach ? currentCoach.name : 'Chưa Đăng Nhập'}</span>
              {currentCoach?.room && <span className="ml-2 text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">{currentCoach.room}</span>}
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Phân loại lượt cộng: <strong>👤 Cá nhân</strong>, <strong>👥 Cả Team Nhóm</strong> và <strong>🦸 Hỗ trợ đồng đội</strong>.
          </p>
        </div>

        <button
          onClick={handleCopyGoogleFormReport}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all whitespace-nowrap"
        >
          {copiedReport ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
          <span>{copiedReport ? 'Đã Copy Lịch Sử!' : '📋 Copy Lịch Sử Ghi Điểm'}</span>
        </button>
      </div>

      {/* HELP REQUESTS SECTION */}
      {activeHelpRequests.length > 0 && (
        <div className="bg-rose-500/10 dark:bg-rose-900/20 p-5 rounded-2xl border border-rose-500/30 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Hand className="w-5 h-5 text-rose-500 animate-pulse" />
              <h3 className="font-extrabold text-sm text-rose-700 dark:text-rose-400">
                Học Viên Đang Cần Hỗ Trợ ({activeHelpRequests.length})
              </h3>
            </div>
            
            {/* Toggle Show All Rooms */}
            {currentCoach?.room && currentCoach.room !== 'Chưa chọn phòng' && (
              <button 
                onClick={() => setShowAllRoomsHelp(!showAllRoomsHelp)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                  showAllRoomsHelp 
                    ? 'bg-rose-100 border-rose-300 text-rose-700 dark:bg-rose-900/50 dark:border-rose-500/50 dark:text-rose-300' 
                    : 'bg-white dark:bg-slate-800 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 opacity-70 hover:opacity-100'
                }`}
              >
                {showAllRoomsHelp ? 'Tất cả các phòng' : `Chỉ phòng: ${currentCoach.room}`}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeHelpRequests.map((req) => (
              <div key={req.id} className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 flex items-center justify-between shadow-sm relative overflow-hidden">
                {/* Visual indicator for different rooms when viewing all */}
                {showAllRoomsHelp && req.room !== currentCoach?.room && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400/50 dark:bg-amber-500/50"></div>
                )}
                
                <div className="space-y-1.5 pl-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{req.student_name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                      {req.student_id}
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {req.room} <span className="text-slate-400 font-normal">|</span> <span className="text-rose-600 dark:text-rose-400">{req.location}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-1.5">
                    <MessageSquareText className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                      {req.note}
                    </p>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/50 mt-1">{req.timestamp}</p>
                </div>

                <div className="flex flex-col items-center justify-center space-y-1.5 ml-3 shrink-0">
                  <button
                    onClick={() => onResolveHelpRequest(req.id)}
                    className="px-4 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-md shadow-rose-500/20 transition-all active:scale-95"
                  >
                    Đã Xong
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PENDING CLAIMS SECTION */}
      {pendingClaims.length > 0 && (
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-amber-500/50 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
              <h3 className="font-extrabold text-sm text-amber-300">
                Yêu Cầu Tích Điểm Đang Chờ Duyệt ({pendingClaims.length})
              </h3>
            </div>
            
            <button
              onClick={onClearAllPendingClaims}
              className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Hết Spam ({pendingClaims.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingClaims.map((claim) => (
              <div key={claim.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-amber-200">{claim.student_name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 font-bold">
                      +{claim.points}đ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{claim.reason} • <span className="text-slate-500">{claim.timestamp}</span></p>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onApproveClaimRequest(claim)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow"
                  >
                    Duyệt
                  </button>
                  <button
                    onClick={() => onRejectClaimRequest(claim.id)}
                    className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-rose-300 text-xs"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Search & Select Student List */}
        <div className="md:col-span-1 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-4 shadow-xl flex flex-col">
          
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setInputMode('INDIVIDUAL')}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${inputMode === 'INDIVIDUAL' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              👤 Từng Cá Nhân
            </button>
            <button
              onClick={() => setInputMode('TEAM')}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${inputMode === 'TEAM' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              👥 Nguyên Team
            </button>
          </div>

          {inputMode === 'INDIVIDUAL' ? (
            <>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Tìm tên, mã HV hoặc tên nhóm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto max-h-[250px] md:max-h-[440px] pr-1">
            {filteredStudents.length === 0 ? (
              <div className="text-center space-y-4 py-4">
                <p className="text-xs text-slate-500">Không tìm thấy học viên khớp từ khóa.</p>
                {searchTerm.length >= 2 && (() => {
                  const classOptions = [...new Set(students.map(s => s.class_name).filter(c => c && c !== 'Lớp Khách' && c !== 'ALL'))].sort();
                  return (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 shadow-inner space-y-3 text-left">
                      <h4 className="text-xs font-bold text-amber-500 flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Thêm Học Viên Mới Ngay</span>
                      </h4>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-2 rounded-lg border border-slate-700/50 font-mono">
                          2A20260
                        </span>
                        <input 
                          type="text" 
                          placeholder="4 số cuối..." 
                          className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none font-mono"
                          value={newStudentSuffix}
                          onChange={(e) => setNewStudentSuffix(e.target.value)}
                        />
                      </div>
                      
                      <input 
                        type="text" 
                        placeholder="Họ và Tên học viên..." 
                        className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold">Khóa:</label>
                          <select
                            value={newStudentCourse}
                            onChange={(e) => setNewStudentCourse(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-slate-250 focus:outline-none"
                          >
                            <option value="Khóa 3">Khóa 3</option>
                            <option value="Khóa 4">Khóa 4</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold">Lớp/Phòng:</label>
                          <select
                            value={newStudentClass}
                            onChange={(e) => setNewStudentClass(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-slate-250 focus:outline-none"
                          >
                            {classOptions.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                            <option value="Lớp Khách">Lớp Khách</option>
                          </select>
                        </div>
                      </div>
                      
                      <button 
                        onClick={handleFastAddStudent}
                        disabled={!newStudentSuffix || !newStudentName}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/30 disabled:text-emerald-300/30 text-white font-bold text-xs py-2.5 rounded-lg transition-colors flex justify-center items-center space-x-1.5 shadow-md shadow-emerald-900/20"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Thêm & Chọn Ngay</span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            ) : (
              filteredStudents.map((s) => {
                const isSelected = selectedStudent?.id === s.id;
                const studentSessionPts = currentSessionPoints
                  .filter(p => p.student_id === s.id)
                  .reduce((sum, p) => sum + p.points, 0);

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <h4 className="font-bold text-xs truncate flex items-center gap-1.5">
                          {s.name}
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${s.course === 'Khóa 3' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                            {s.course}
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          MSSV: <span className="font-mono text-slate-300">{s.id}</span> • Lớp: <span className="font-bold text-slate-350">{s.class_name}</span> • Team: <span className="font-bold text-indigo-400">{s.team_code}</span>
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-black ${studentSessionPts > 0 ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20' : 'bg-slate-800 text-slate-400'}`}>
                        +{studentSessionPts}đ
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
            </>
          ) : (
            // TEAM MODE: Smart member-by-member builder
            <div className="space-y-4 flex-1">
              {/* Step 1: Team label & Class */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">Tên Nhóm:</label>
                  <input
                    type="text"
                    placeholder="VD: Bàn 3..."
                    value={teamLabel}
                    onChange={(e) => setTeamLabel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">Lớp (Bắt buộc):</label>
                  <select
                    value={teamClass}
                    onChange={(e) => setTeamClass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-2 py-2.5 text-xs text-slate-200 focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="ALL">-- Chọn Lớp --</option>
                    {[...new Set(students.map(s => s.class_name).filter(c => c && c !== 'Lớp Khách' && c !== 'ALL'))].sort().map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Search & add members */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">Thêm Thành Viên:</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc mã HV..."
                    value={teamSearchTerm}
                    onChange={(e) => setTeamSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/50 rounded-xl pl-8 pr-4 py-2.5 text-xs text-slate-200 focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                {/* Dropdown results */}
                {teamSearchTerm.length >= 2 && (() => {
                  const hits = students.filter(s =>
                    (s.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
                     s.id.toLowerCase().includes(teamSearchTerm.toLowerCase())) &&
                    !teamMembers.find(m => m.id === s.id)
                  ).slice(0, 6);
                  return hits.length > 0 ? (
                    <div className="mt-1 bg-slate-950 border border-indigo-500/30 rounded-xl overflow-hidden shadow-xl">
                      {hits.map(s => (
                        <button
                          key={s.id}
                          onClick={() => handleAddToTeam(s)}
                          className="w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-indigo-950/50 transition-colors border-b border-slate-800/60 last:border-0"
                        >
                          <span className="font-bold text-slate-200">{s.name}</span>
                          <span className="text-[10px] text-indigo-400 font-mono">{s.class_name} • {s.course}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1 text-center">Không tìm thấy học viên phù hợp.</p>
                  );
                })()}
              </div>

              {/* Member list preview */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">Danh Sách ({teamMembers.length} TV):</label>
                <div className="min-h-[60px] max-h-[200px] overflow-y-auto space-y-1.5 bg-slate-950/40 rounded-xl p-2 border border-slate-800/50">
                  {teamMembers.length === 0 ? (
                    <p className="text-[10px] text-slate-600 text-center py-3">Chưa có thành viên. Tìm kiếm phía trên để thêm.</p>
                  ) : (
                    teamMembers.map(m => (
                      <div key={m.id} className="flex items-center justify-between bg-indigo-950/30 border border-indigo-500/20 rounded-lg px-2.5 py-1.5">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-indigo-200 truncate block">{m.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{m.class_name} • {m.course}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveFromTeam(m.id)}
                          className="ml-2 text-rose-400 hover:text-rose-300 text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded hover:bg-rose-500/10 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 2 Cols: Selected Student Quick Actions & Team Award */}
        <div className="md:col-span-2 space-y-6">
          {inputMode === 'INDIVIDUAL' ? (
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
            {selectedStudent ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-300 text-lg">
                      {selectedStudent.name.split(' ').pop()?.[0]}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-amber-300">{selectedStudent.name}</h3>
                      <p className="text-xs text-slate-400">Mã HV: {selectedStudent.id} • Team: <span className="text-indigo-300 font-bold">{selectedStudent.team_code}</span></p>
                    </div>
                  </div>

                  {/* Button to award points to ENTIRE TEAM */}
                  {selectedStudent.team_code && selectedStudent.team_code !== 'N/A' && (
                    <button
                      onClick={() => handleAwardEntireTeam(selectedStudent.team_code, 2, 'Trình bày / Demo dự án xuất sắc')}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition-all"
                    >
                      <Users className="w-4 h-4" />
                      <span>+2đ Cả Team {selectedStudent.team_code}</span>
                    </button>
                  )}
                </div>

                {/* 1-Click Quick Action Buttons */}
                <div className="space-y-3">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">Nút Cộng Điểm Cá Nhân (1-Click):</label>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <button
                      onClick={() => handleAwardPoints(selectedStudent, 1, 'Phát biểu ý kiến tích cực', 'INDIVIDUAL')}
                      className="p-2 sm:p-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-900 dark:text-amber-300 font-extrabold text-xs flex flex-col items-center justify-center space-y-1 shadow-sm transition-all hover:scale-105 active:scale-95 text-center"
                    >
                      <span className="text-sm sm:text-base font-black">✋ +1</span>
                      <span className="hidden sm:block text-[10px] text-amber-800 dark:text-amber-200/80 font-bold leading-tight">Cá nhân</span>
                    </button>

                    <button
                      onClick={() => handleAwardPoints(selectedStudent, 3, 'Demo bài tập / Code chạy xuất sắc', 'INDIVIDUAL')}
                      className="p-2 sm:p-3.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-900 dark:text-indigo-300 font-extrabold text-xs flex flex-col items-center justify-center space-y-1 shadow-sm transition-all hover:scale-105 active:scale-95 text-center"
                    >
                      <span className="text-sm sm:text-base font-black">🚀 +3</span>
                      <span className="hidden sm:block text-[10px] text-indigo-800 dark:text-indigo-200/80 font-bold leading-tight">Demo Lab</span>
                    </button>

                    <button
                      onClick={() => handleAwardPoints(selectedStudent, 2, 'Hỗ trợ các nhóm bạn giải bài Lab', 'SUPPORT')}
                      className="p-2 sm:p-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-900 dark:text-emerald-300 font-extrabold text-xs flex flex-col items-center justify-center space-y-1 shadow-sm transition-all hover:scale-105 active:scale-95 text-center"
                    >
                      <span className="text-sm sm:text-base font-black">🦸 +2</span>
                      <span className="hidden sm:block text-[10px] text-emerald-800 dark:text-emerald-200/80 font-bold leading-tight">Cứu team</span>
                    </button>
                  </div>
                </div>

                {/* Custom Reason & Category selector + Custom Score input */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">Tùy chỉnh Loại Điểm, Số Điểm & Lý do:</label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <select
                      value={pointCategory}
                      onChange={(e) => setPointCategory(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-indigo-300 font-bold w-full sm:w-auto"
                    >
                      <option value="INDIVIDUAL">👤 Điểm cá nhân</option>
                      <option value="TEAM">👥 Điểm nhóm / Dự án</option>
                      <option value="SUPPORT">🦸 Điểm hỗ trợ đồng đội</option>
                    </select>

                    <div className="flex items-center space-x-1 shrink-0 bg-slate-950 border border-slate-800 px-2 py-1 rounded-xl">
                      <span className="text-xs text-slate-400 font-bold">+</span>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={customPts}
                        onChange={(e) => setCustomPts(parseInt(e.target.value) || 1)}
                        className="w-12 bg-transparent text-center text-xs font-black text-amber-400 focus:outline-none"
                      />
                      <span className="text-xs text-slate-400 font-bold">đ</span>
                    </div>

                    <input
                      type="text"
                      placeholder="Nhập lý do cụ thể..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 w-full"
                    />

                    <button
                      onClick={() => handleAwardPoints(selectedStudent, customPts, 'Tuyên dương đặc biệt', pointCategory)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all shrink-0 w-full sm:w-auto"
                    >
                      Cộng {customPts}đ
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10 opacity-50 space-y-3">
                <Users className="w-12 h-12 text-slate-500 mx-auto" />
                <p className="text-sm font-medium text-slate-300">Tìm và chọn 1 học viên ở danh sách bên trái để thao tác.</p>
              </div>
            )}
          </div>
          ) : (
            // TEAM MODE: Points + Confirm Panel
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                  <Users className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-indigo-300">
                    {teamClass !== 'ALL' ? `[${teamClass}] ` : ''}{teamLabel || 'Nhóm chưa đặt tên'}
                  </h3>
                  <p className="text-xs text-slate-400">{teamMembers.length} thành viên đã chọn</p>
                </div>
              </div>

              {/* Points selector */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-300 block">Mỗi thành viên nhận:</label>
                <div className="flex space-x-2">
                  {[2, 3, 5].map(pts => (
                    <button
                      key={pts}
                      onClick={() => setTeamAddPoints(pts)}
                      className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${
                        teamAddPoints === pts
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      +{pts}đ
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-300 block">Lý do cộng điểm:</label>
                <input
                  type="text"
                  placeholder="VD: Demo xuất sắc, Hoàn thành Lab..."
                  value={teamAddReason}
                  onChange={(e) => setTeamAddReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Preview */}
              {teamMembers.length > 0 && (
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] text-indigo-300 font-black uppercase tracking-wider mb-2">Xem trước — sẽ phát cho:</p>
                  {teamMembers.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">{m.name}</span>
                      <span className="text-indigo-400 font-black">+{teamAddPoints}đ</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Confirm button */}
              <button
                onClick={handleConfirmTeamAward}
                disabled={teamMembers.length === 0 || teamConfirmed}
                className={`w-full text-white font-black text-sm py-4 rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 ${
                  teamConfirmed
                    ? 'bg-emerald-600 shadow-emerald-600/30'
                    : teamMembers.length === 0
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20 hover:scale-[1.01] active:scale-95'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>
                  {teamConfirmed
                    ? `✅ Đã phát ${teamAddPoints}đ cho ${teamMembers.length} người!`
                    : teamMembers.length === 0
                    ? 'Thêm thành viên ở bên trái'
                    : `Xác Nhận Phát ${teamAddPoints}đ × ${teamMembers.length} Người`
                  }
                </span>
              </button>
            </div>
          )}

          {/* Recent Action Logs (COACH SPECIFIC ISOLATION) */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-xs text-amber-400 uppercase tracking-wider">
                Lịch Sử Thao Tác Của Bạn ({currentCoach ? `COACH ${currentCoach.name}` : 'Tất cả'})
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">{mySessionPoints.length} lượt đã ghi</span>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {mySessionPoints.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Bạn chưa thực hiện cộng điểm nào trong ca này.</p>
              ) : (
                mySessionPoints.slice().reverse().map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-amber-300">{rec.student_name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-indigo-300 border border-slate-700 font-mono">
                          Team {rec.team_code}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400">
                          +{rec.points}đ
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        <span className="text-amber-400/80">{rec.category_label || '👤 Cá nhân'}:</span> {rec.reason}
                      </p>
                    </div>

                    <button
                      onClick={() => onUndoPointRecord(rec.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-semibold flex items-center space-x-1 shrink-0 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Undo</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
