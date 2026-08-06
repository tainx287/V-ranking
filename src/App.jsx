import React, { useState, useEffect } from 'react';
import { Activity, Settings } from 'lucide-react';
import Navbar from './components/Navbar';
import TVPresentationView from './components/TVPresentationView';
import CoachQuickControl from './components/CoachQuickControl';
import DataImportView from './components/DataImportView';
import StudentClaimModal from './components/StudentClaimModal';
import HelpRequestModal from './components/HelpRequestModal';
import AuthModal from './components/CoachAuthModal';
import initialData from './data/initialData.json';
import { playCoinSound, playFanfareSound } from './utils/audio';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState('tv'); // 'tv' | 'coach' | 'data'
  const [selectedSession, setSelectedSession] = useState('K4-DAY11-LIVE-NOW');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [searchCohort, setSearchCohort] = useState('ALL'); // 'ALL' | 'Khóa 3' | 'Khóa 4'
  const [theme, setTheme] = useState('light'); // 'light' | 'dark'

  // Modals state
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Coach auth state
  const [currentCoach, setCurrentCoach] = useState(() => {
    const saved = localStorage.getItem('labscore_coach');
    return saved ? JSON.parse(saved) : null;
  });

  // Students list
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('labscore_students');
    const savedStudents = saved ? JSON.parse(saved) : [];
    
    // Luôn ưu tiên dữ liệu mới nhất từ initialData.json (được build từ excel)
    const merged = [...initialData.students];
    const initialIds = new Set(merged.map(s => s.id));
    
    // Gộp thêm những sinh viên được tạo mới thủ công từ giao diện (bỏ qua các mã rác HV-EXT cũ)
    savedStudents.forEach(s => {
      if (s && s.id && !s.id.startsWith('HV-EXT-') && !initialIds.has(s.id)) {
        merged.push(s);
      }
    });
    
    return merged;
  });

  // Points records
  const [pointsRecords, setPointsRecords] = useState(() => {
    const saved = localStorage.getItem('labscore_points');
    const savedPoints = saved ? JSON.parse(saved) : [];
    
    const merged = [...initialData.points_records];
    const initialIds = new Set(merged.map(p => p.id));
    
    // Gộp thêm những điểm được cộng mới thủ công trong phiên làm việc
    savedPoints.forEach(p => {
      if (!initialIds.has(p.id)) merged.push(p);
    });
    
    return merged;
  });

  const [claimRequests, setClaimRequests] = useState(() => {
    const saved = localStorage.getItem('labscore_claims');
    return saved ? JSON.parse(saved) : [];
  });

  const [helpRequests, setHelpRequests] = useState(() => {
    const saved = localStorage.getItem('labscore_help_requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [sessions, setSessions] = useState(initialData.sessions);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('labscore_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('labscore_points', JSON.stringify(pointsRecords));
  }, [pointsRecords]);

  useEffect(() => {
    localStorage.setItem('labscore_claims', JSON.stringify(claimRequests));
  }, [claimRequests]);

  useEffect(() => {
    localStorage.setItem('labscore_help_requests', JSON.stringify(helpRequests));
  }, [helpRequests]);

  useEffect(() => {
    if (currentCoach) {
      localStorage.setItem('labscore_coach', JSON.stringify(currentCoach));
    } else {
      localStorage.removeItem('labscore_coach');
    }
  }, [currentCoach]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handlers
  const handleAddPointRecord = (newRecord) => {
    setPointsRecords(prev => [...prev, newRecord]);
  };

  const handleUndoPointRecord = (recordId) => {
    setPointsRecords(prev => prev.filter(r => r.id !== recordId));
  };

  const handleImportNewPoints = (newRecords) => {
    setPointsRecords(prev => [...newRecords, ...prev]);
  };

  const handleAddStudent = (newStudent) => {
    setStudents(prev => [...prev, newStudent]);
  };

  // Student Self-Claim request handler
  const handleSendClaimRequest = (newClaim) => {
    setClaimRequests(prev => [newClaim, ...prev]);
  };

  // Coach approves claim
  const handleApproveClaimRequest = (claim) => {
    const newRecord = {
      id: `PTS-CLAIM-${Date.now()}`,
      session_id: claim.session_id,
      class_name: claim.class_name,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      coach_email: currentCoach ? currentCoach.email : 'labcoach@labflow.edu.vn',
      coach_name: currentCoach ? currentCoach.name : 'Lab Coach',
      coach_room: currentCoach?.room ? currentCoach.room : 'Chưa rõ phòng',
      student_id: claim.student_id,
      student_name: claim.student_name,
      points: claim.points,
      reason: claim.reason,
      raw_line: `${claim.student_name} - ${claim.points} - ${claim.student_id} - ${claim.reason}`
    };

    setPointsRecords(prev => [...prev, newRecord]);
    setClaimRequests(prev => prev.map(c => c.id === claim.id ? { ...c, status: 'approved' } : c));

    if (soundEnabled) {
      if (claim.points >= 3) playFanfareSound();
      else playCoinSound();
    }

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  const handleRejectClaimRequest = (claimId) => {
    setClaimRequests(prev => prev.filter(c => c.id !== claimId));
  };

  const handleClearAllPendingClaims = () => {
    setClaimRequests(prev => prev.filter(c => c.session_id !== selectedSession || c.status !== 'pending'));
  };

  const handleAddHelpRequest = (req) => {
    setHelpRequests(prev => [{ ...req, id: Date.now(), timestamp: new Date().toISOString(), status: 'pending' }, ...prev]);
  };

  const handleResolveHelpRequest = (id) => {
    setHelpRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleLoginCoach = (coachObj) => {
    setCurrentCoach(coachObj);
    setActiveTab('coach');
  };

  const handleLogoutCoach = () => {
    setCurrentCoach(null);
    if (activeTab === 'coach') setActiveTab('tv');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-300">
      
      {/* Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedSession={selectedSession}
        setSelectedSession={setSelectedSession}
        sessions={sessions}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenClaimModal={() => setIsClaimModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        currentCoach={currentCoach}
        onLogoutCoach={handleLogoutCoach}
        searchStudentQuery={searchStudentQuery}
        setSearchStudentQuery={setSearchStudentQuery}
        searchCohort={searchCohort}
        setSearchCohort={setSearchCohort}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Container */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 py-6 ${currentCoach ? 'pb-28' : 'pb-12'}`}>
        {activeTab === 'tv' && (
          <TVPresentationView
            students={students}
            pointsRecords={pointsRecords}
            selectedSession={selectedSession}
            sessions={sessions}
            searchStudentQuery={searchStudentQuery}
            searchCohort={searchCohort}
            onOpenClaimModal={() => setIsClaimModalOpen(true)}
            onOpenHelpModal={() => setIsHelpModalOpen(true)}
            soundEnabled={soundEnabled}
            triggerConfetti={() => confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } })}
          />
        )}

        {activeTab === 'coach' && (
          <CoachQuickControl
            sessions={sessions}
            students={students}
            pointsRecords={pointsRecords}
            claimRequests={claimRequests}
            helpRequests={helpRequests}
            onAddPointRecord={handleAddPointRecord}
            onUndoPointRecord={handleUndoPointRecord}
            onApproveClaimRequest={handleApproveClaimRequest}
            onRejectClaimRequest={handleRejectClaimRequest}
            onClearAllPendingClaims={handleClearAllPendingClaims}
            onResolveHelpRequest={handleResolveHelpRequest}
            onAddStudent={handleAddStudent}
            onLogoutCoach={handleLogoutCoach}
            selectedSession={selectedSession}
            soundEnabled={soundEnabled}
            currentCoach={currentCoach}
          />
        )}

        {activeTab === 'data' && (
          <DataImportView
            pointsRecords={pointsRecords}
            students={students}
            onImportNewPoints={handleImportNewPoints}
          />
        )}
      </main>

      {/* Student Self-Claim Modal */}
      <StudentClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        students={students}
        selectedSession={selectedSession}
        claimRequests={claimRequests}
        onSendClaimRequest={handleSendClaimRequest}
      />

      {/* Coach Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginCoach}
      />

      {isHelpModalOpen && (
        <HelpRequestModal
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
          onSubmit={handleAddHelpRequest}
          students={students}
          selectedSession={selectedSession}
        />
      )}

      {/* Mobile Bottom Nav Quick Switch for Coach */}
      {currentCoach && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex items-center justify-around pb-safe md:hidden">
          <button 
            onClick={() => setActiveTab('tv')}
            className={`flex-1 py-3.5 flex flex-col items-center gap-1 transition-colors ${activeTab === 'tv' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-wider font-semibold">Bảng điểm</span>
          </button>
          
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
          
          <button 
            onClick={() => setActiveTab('coach')}
            className={`flex-1 py-3.5 flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'coach' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-wider font-semibold">Điều khiển</span>
            {/* Notification dot for help requests or claims */}
            {(helpRequests.length > 0 || claimRequests.filter(c => c.status === 'pending' && c.session_id === selectedSession).length > 0) && (
              <span className="absolute top-2 right-1/4 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>
      )}

      {/* Footer Branding & Status */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>LabScore Live © 2026 • Hệ Thống Vinh Danh & Tích Điểm Tức Thì Cho Lớp Học</span>
          <span className="text-slate-500 dark:text-slate-400">
            Đồng bộ Live DB với <code className="text-amber-500 dark:text-amber-400 font-mono">Google Sheet Report Cuối Buổi</code>
          </span>
        </div>
      </footer>

    </div>
  );
}
