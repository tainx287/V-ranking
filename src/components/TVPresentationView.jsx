import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Trophy, Medal, Award, Flame, Zap, Shield, Users, Sparkles, TrendingUp, Clock, Search, Send, User, Filter, List, Activity, School, Crown, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to capitalize initials of student names & trim spaces
const normalizeName = (name) => {
  if (!name) return '';
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export default function TVPresentationView({
  students,
  pointsRecords,
  selectedSession,
  sessions,
  searchStudentQuery,
  searchCohort,
  onOpenClaimModal
}) {
  const [mainPage, setMainPage] = useState('campus'); // 'campus' | 'class'
  const [subTab, setSubTab] = useState('daily'); // 'daily' | 'season'
  const [classFilter, setClassFilter] = useState('ALL'); // 'ALL' | ClassName
  const [pointCategoryFilter, setPointCategoryFilter] = useState('ALL'); // 'ALL' | 'INDIVIDUAL' | 'TEAM' | 'SUPPORT'
  const [cohortFilter, setCohortFilter] = useState('Toàn Sever'); // 'Khóa 3' | 'Khóa 4' | 'Toàn Sever'

  const listContainerRef = useRef(null);

  // Auto-scroll logic for Class List Rank 4+
  useEffect(() => {
    const scrollContainer = listContainerRef.current;
    if (!scrollContainer) return;

    let scrollAmount = 0.5; // pixels per frame
    let animationFrameId;
    let isPaused = false;

    const handleMouseEnter = () => (isPaused = true);
    const handleMouseLeave = () => (isPaused = false);
    
    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);

    const step = () => {
      if (!isPaused && scrollContainer) {
        scrollContainer.scrollTop += scrollAmount;
        
        // Reset to top if we reached the bottom
        if (scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 1) {
          isPaused = true;
          setTimeout(() => {
            if (scrollContainer) {
              scrollContainer.scrollTop = 0;
              isPaused = false;
            }
          }, 3000);
        }
      }
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (scrollContainer) {
        scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
        scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [mainPage, classFilter, cohortFilter, students.length, subTab]);

  // Military Ranks Helper
  const getMilitaryRank = (pts) => {
    if (pts > 2000) return { title: 'Tướng Quân', icon: '⚡' };
    if (pts > 1200) return { title: 'Đại Tá', icon: '👑' };
    if (pts > 900) return { title: 'Thiếu Tá', icon: '🌟' };
    if (pts > 600) return { title: 'Đại Úy', icon: '🦅' };
    if (pts > 400) return { title: 'Trung Úy', icon: '⚔️' };
    if (pts > 250) return { title: 'Thiếu Úy', icon: '🎖️' };
    if (pts > 150) return { title: 'Thượng Sĩ', icon: '🥇' };
    if (pts > 100) return { title: 'Trung Sĩ', icon: '🥈' };
    if (pts > 50) return { title: 'Hạ Sĩ', icon: '🥉' };
    if (pts > 30) return { title: 'Binh Nhất', icon: '🛡️' };
    if (pts > 10) return { title: 'Binh Nhì', icon: '🪖' };
    return { title: 'Tân Binh', icon: '🔰' };
  };

  // Wrap heavy ranking calculations in useMemo
  const { allStudentsRanked, classOptions, sessionPoints } = useMemo(() => {
    // Clean data pipeline: Deduplicate and Normalize names
    const uniqueStudentsMap = new Map();
    students.forEach(s => {
      if (s && s.id) {
        uniqueStudentsMap.set(s.id, {
          ...s,
          name: normalizeName(s.name)
        });
      }
    });
    const normalizedStudents = Array.from(uniqueStudentsMap.values());

    // Extract unique classes dynamically
    const classOpts = ['ALL', ...new Set(normalizedStudents.map(s => s.class_name).filter(Boolean))].sort();

    // Filter points based on selectedSession & category filter
    let sessionPoints = pointsRecords.filter(p => p.session_id === selectedSession);
    if (pointCategoryFilter !== 'ALL') {
      sessionPoints = sessionPoints.filter(p => p.type === pointCategoryFilter);
    }

    // Calculate scores per student
    const studentScoresMap = {};
    normalizedStudents.forEach(s => {
      studentScoresMap[s.id] = {
        ...s,
        dailyPoints: 0,
        seasonPoints: 0,
        dailyRecordCount: 0,
        recentReason: ''
      };
    });

    // Calculate daily points
    sessionPoints.forEach(p => {
      if (studentScoresMap[p.student_id]) {
        studentScoresMap[p.student_id].dailyPoints += Number(p.points || 0);
        studentScoresMap[p.student_id].dailyRecordCount += 1;
        studentScoresMap[p.student_id].recentReason = p.reason || 'Phát biểu';
      }
    });

    // Calculate season overall points
    pointsRecords.forEach(p => {
      if (pointCategoryFilter !== 'ALL' && p.type !== pointCategoryFilter) return;
      if (studentScoresMap[p.student_id]) {
        studentScoresMap[p.student_id].seasonPoints += Number(p.points || 0);
      }
    });

    let ranked = Object.values(studentScoresMap);

    // Sorting logic based on current page
    if (mainPage === 'class') {
      ranked.sort((a, b) => (subTab === 'daily' ? b.dailyPoints - a.dailyPoints : b.seasonPoints - a.seasonPoints) || a.name.localeCompare(b.name));
    } else {
      ranked.sort((a, b) => b.seasonPoints - a.seasonPoints || a.name.localeCompare(b.name));
    }

    return { allStudentsRanked: ranked, classOptions: classOpts, sessionPoints };
  }, [students, pointsRecords, selectedSession, pointCategoryFilter, mainPage, subTab]);

  // Find rank of searched student across campus & class
  let searchedStudent = null;
  let campusRank = -1;
  let classRank = -1;

  if (searchStudentQuery.trim()) {
    const q = searchStudentQuery.toLowerCase();
    // Apply cohort filter to search scope if set
    const searchPool = (searchCohort && searchCohort !== 'ALL')
      ? allStudentsRanked.filter(s => s.course === searchCohort)
      : allStudentsRanked;
    const foundIdx = searchPool.findIndex(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
    if (foundIdx !== -1) {
      searchedStudent = searchPool[foundIdx];
      campusRank = allStudentsRanked.findIndex(s => s.id === searchedStudent.id) + 1;

      const sameClassStudents = allStudentsRanked.filter(s => s.class_name === searchedStudent.class_name);
      classRank = sameClassStudents.findIndex(s => s.id === searchedStudent.id) + 1;
    }
  }

  // Filter based on View Mode (Campus or Class)
  let activeLeaderboardList = [...allStudentsRanked];
  if (cohortFilter !== 'Toàn Sever') {
    activeLeaderboardList = activeLeaderboardList.filter(s => s.course === cohortFilter);
  }
  if (mainPage === 'class' && classFilter !== 'ALL') {
    activeLeaderboardList = activeLeaderboardList.filter(s => s.class_name === classFilter);
  }

  // Podium (Top 1-2-3) & Rest (4+)
  const top1 = activeLeaderboardList[0];
  const top2 = activeLeaderboardList[1];
  const top3 = activeLeaderboardList[2];
  const restRanks = activeLeaderboardList.slice(3);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const getInitials = (name) => {
    if (!name) return 'HV';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 min-h-screen pb-16 font-sans antialiased transition-colors duration-300">
      
      {/* Search Result Banner */}
      {searchedStudent && (
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white font-black flex items-center justify-center text-lg shadow-md shadow-amber-500/20">
              #{mainPage === 'class' ? classRank : campusRank}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{searchedStudent.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 dark:text-slate-600 font-mono font-bold">
                  {searchedStudent.id}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Lớp ({searchedStudent.class_name}): <strong className="text-slate-900 dark:text-white">#{classRank}</strong> • Toàn trường: <strong className="text-slate-900 dark:text-white">#{campusRank}</strong> • Điểm hôm nay: <strong className="text-amber-600">+{searchedStudent.dailyPoints}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onOpenClaimModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-colors flex items-center space-x-1.5 shadow-md shadow-amber-500/10"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi Yêu Cầu Tích Điểm</span>
          </button>
        </div>
      )}

      {/* Page Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
        <div className="flex items-center bg-slate-200 dark:bg-slate-700/60 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMainPage('campus')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
              mainPage === 'campus'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
            }`}
          >
            <School className="w-4 h-4 text-amber-500" />
            <span>Ranking Toàn Trường</span>
          </button>
          <button
            onClick={() => setMainPage('class')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
              mainPage === 'class'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
            }`}
          >
            <List className="w-4 h-4 text-indigo-500" />
            <span>Chi Tiết Lớp Học</span>
          </button>
        </div>

        {/* Global Confetti action */}
        <button
          onClick={triggerConfetti}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900 text-xs font-bold shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Ăn Mừng 🎉</span>
        </button>
      </div>

      {/* FILTER BAR - High Contrast & Compact */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Daily vs Season Sub tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setSubTab('daily')}
              className={`flex items-center space-x-1 px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                subTab === 'daily'
                  ? 'bg-white dark:bg-slate-800 text-slate-955 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
              <span>Hôm Nay</span>
            </button>
            <button
              onClick={() => setSubTab('season')}
              className={`flex items-center space-x-1 px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                subTab === 'season'
                  ? 'bg-white dark:bg-slate-800 text-slate-955 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Cả Khóa</span>
            </button>
          </div>

          {/* Point Category Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {['ALL', 'INDIVIDUAL', 'TEAM', 'SUPPORT'].map((cat) => (
              <button
                key={cat}
                onClick={() => setPointCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  pointCategoryFilter === cat
                    ? 'bg-white dark:bg-slate-800 text-slate-905 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'Tất cả' : cat === 'INDIVIDUAL' ? 'Cá nhân' : cat === 'TEAM' ? 'Nhóm' : 'Hỗ trợ'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Cohort Filter toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {['Khóa 3', 'Khóa 4', 'Toàn Sever'].map((cohort) => (
              <button
                key={cohort}
                onClick={() => setCohortFilter(cohort)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  cohortFilter === cohort
                    ? 'bg-amber-500 text-white shadow-sm font-black border border-amber-600'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
                }`}
              >
                {cohort}
              </button>
            ))}
          </div>

          {/* Class Filter (only for Class page) */}
          {mainPage === 'class' && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-[200px] sm:max-w-xs md:max-w-none">
              {classOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => setClassFilter(c)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    classFilter === c
                      ? 'bg-white dark:bg-slate-800 text-slate-905 shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
                  }`}
                >
                  {c === 'ALL' ? 'Tất cả lớp' : c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MAIN LAYOUT GRID (Leaderboard 75% | Live Feed Sidebar 25%) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Podium & Rankings (3 Columns out of 4) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* HERO PODIUM SECTION (Top 1-2-3 as 3D Elevated Cards) */}
          <div className="grid grid-cols-3 gap-4 items-end pt-8 pb-4 max-w-3xl mx-auto">
            
            {/* Rank 2 (Left) */}
            {top2 ? (
              <div className="flex flex-col items-center order-1 animate-fadeIn relative group">
                <div className="w-full bg-white dark:bg-slate-800 p-5 rounded-2xl text-center border border-slate-200 dark:border-slate-700 flex flex-col justify-between min-h-[160px] relative shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 dark:text-slate-600 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-slate-300 flex items-center shadow-sm">
                    <Medal className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-slate-500" /> #2
                  </span>
                  
                  <div className="mt-2 flex flex-col items-center">
                    {/* Circle initials avatar */}
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-300 text-slate-600 dark:text-slate-400 flex items-center justify-center font-black text-sm mb-2 shadow-inner">
                      {getInitials(top2.name)}
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate max-w-full">
                      {top2.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                      <span className="inline-block px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-black border border-indigo-200 dark:border-indigo-800 mr-1">{top2.course || 'Khóa 3'}</span>
                      Lớp {top2.class_name} • Nhóm {top2.team_code}
                    </p>
                    
                    <span className="mt-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-[9px] text-slate-600 dark:text-slate-400 font-extrabold border border-slate-200 dark:border-slate-700">
                      {getMilitaryRank(subTab === 'daily' ? top2.dailyPoints : top2.seasonPoints).icon} {getMilitaryRank(subTab === 'daily' ? top2.dailyPoints : top2.seasonPoints).title}
                    </span>
                  </div>

                  <div className="mt-3 text-slate-700 dark:text-slate-300 dark:text-slate-600 font-black text-base bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-1">
                    +{subTab === 'daily' ? top2.dailyPoints : top2.seasonPoints}đ
                  </div>
                </div>
              </div>
            ) : (
              <div className="order-1 min-h-[160px]" />
            )}

            {/* Rank 1 (Middle) - Elevated, Gold Crown */}
            {top1 ? (
              <div className="flex flex-col items-center order-2 -mt-4 animate-fadeIn relative group z-10">
                <div className="w-full bg-amber-50/50 dark:bg-amber-900/20 p-6 rounded-2xl text-center border-2 border-amber-400 dark:border-amber-500/50 flex flex-col justify-between min-h-[200px] relative shadow-2xl hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all duration-300 hover:-translate-y-2">
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-black px-3.5 py-1 rounded-full flex items-center shadow-lg border border-amber-400 dark:border-amber-500/50">
                    <Crown className="w-4 h-4 mr-1" /> TOP 1
                  </span>
                  
                  <div className="mt-2 flex flex-col items-center">
                    {/* Gold Avatar Circle */}
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-400 dark:border-amber-500/50 text-amber-700 dark:text-amber-400 flex items-center justify-center font-black text-lg mb-2 shadow-md relative">
                      {getInitials(top1.name)}
                      <span className="absolute -top-2 -right-2 text-lg">👑</span>
                    </div>

                    <h3 className="font-black text-base text-slate-900 dark:text-white truncate max-w-full">
                      {top1.name}
                    </h3>
                    <p className="text-[10px] text-amber-900 dark:text-amber-100 font-extrabold mt-0.5">
                      <span className="inline-block px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 font-black border border-amber-300 dark:border-amber-700 mr-1">{top1.course || 'Khóa 3'}</span>
                      Lớp {top1.class_name} • Nhóm {top1.team_code}
                    </p>

                    <span className="mt-1 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-[9px] text-amber-800 dark:text-amber-200 font-extrabold border border-amber-300 dark:border-amber-700">
                      {getMilitaryRank(subTab === 'daily' ? top1.dailyPoints : top1.seasonPoints).icon} {getMilitaryRank(subTab === 'daily' ? top1.dailyPoints : top1.seasonPoints).title}
                    </span>
                  </div>

                  <div className="mt-4 text-amber-700 dark:text-amber-400 font-black text-xl bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded-xl py-1.5 shadow-sm">
                    +{subTab === 'daily' ? top1.dailyPoints : top1.seasonPoints}đ
                  </div>
                </div>
              </div>
            ) : (
              <div className="order-2 min-h-[200px]" />
            )}

            {/* Rank 3 (Right) */}
            {top3 ? (
              <div className="flex flex-col items-center order-3 animate-fadeIn relative group">
                <div className="w-full bg-white dark:bg-slate-800 p-5 rounded-2xl text-center border border-slate-200 dark:border-slate-700 flex flex-col justify-between min-h-[160px] relative shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-800 flex items-center shadow-sm">
                    <Award className="w-3.5 h-3.5 mr-1 text-orange-500 dark:text-orange-400" /> #3
                  </span>
                  
                  <div className="mt-2 flex flex-col items-center">
                    {/* Bronze Avatar Circle */}
                    <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-500/50 text-orange-700 dark:text-orange-300 flex items-center justify-center font-black text-sm mb-2 shadow-inner">
                      {getInitials(top3.name)}
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate max-w-full">
                      {top3.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                      <span className="inline-block px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-black border border-indigo-200 dark:border-indigo-800 mr-1">{top3.course || 'Khóa 3'}</span>
                      Lớp {top3.class_name} • Nhóm {top3.team_code}
                    </p>

                    <span className="mt-1 px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-900/20 text-[9px] text-orange-700 dark:text-orange-300 font-extrabold border border-orange-200 dark:border-orange-800">
                      {getMilitaryRank(subTab === 'daily' ? top3.dailyPoints : top3.seasonPoints).icon} {getMilitaryRank(subTab === 'daily' ? top3.dailyPoints : top3.seasonPoints).title}
                    </span>
                  </div>

                  <div className="mt-3 text-orange-700 dark:text-orange-300 font-black text-base bg-orange-50 dark:bg-orange-900/20/50 border border-orange-200 dark:border-orange-800 rounded-xl py-1">
                    +{subTab === 'daily' ? top3.dailyPoints : top3.seasonPoints}đ
                  </div>
                </div>
              </div>
            ) : (
              <div className="order-3 min-h-[160px]" />
            )}
          </div>

          {/* LIST RANK 4+ (Card Row Layout, High Contrast, Auto-Scrollable) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <div className="flex items-center space-x-2">
                <List className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span>Bảng Xếp Hạng ({cohortFilter})</span>
              </div>
              <span>Tổng Điểm</span>
            </div>

            <div 
              ref={listContainerRef} 
              className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto scroll-smooth pr-1"
            >
              {restRanks.map((student, idx) => {
                const rank = idx + 4;
                const pts = subTab === 'daily' ? student.dailyPoints : student.seasonPoints;
                const isSearched = searchStudentQuery && student.name.toLowerCase().includes(searchStudentQuery.toLowerCase());
                
                // Progress Bar calculation
                const maxPts = top1 ? (subTab === 'daily' ? top1.dailyPoints : top1.seasonPoints) : 1;
                const percent = Math.min(100, Math.max(0, (pts / (maxPts || 1)) * 100));
                
                const totalStudents = activeLeaderboardList.length;
                const isTop20 = rank <= Math.ceil(totalStudents * 0.2);
                const isBottom20 = rank >= Math.floor(totalStudents * 0.8);
                
                let tierClasses = 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900/80';
                if (student.isNew) {
                  tierClasses = 'bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500 animate-pulse';
                } else if (isSearched) {
                  tierClasses = 'bg-amber-50/80 dark:bg-amber-900/30 border-l-4 border-amber-500';
                } else if (isTop20) {
                  tierClasses = 'bg-emerald-50 dark:bg-emerald-900/20/30 border-l-4 border-emerald-400 hover:bg-emerald-50 dark:bg-emerald-900/20/50';
                } else if (isBottom20) {
                  tierClasses = 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:bg-slate-900';
                }
                
                return (
                  <div
                    key={student.id}
                    className={`px-6 py-4 flex items-center justify-between transition-all relative overflow-hidden group border-b border-slate-100 dark:border-slate-800 ${tierClasses}`}
                  >
                    {/* Custom high-contrast progress underlay bar */}
                    <div 
                      className="absolute bottom-0 left-0 h-[3px] bg-slate-200 dark:bg-slate-700 group-hover:bg-indigo-300/40 transition-all duration-500" 
                      style={{ width: `${percent}%` }}
                    />

                    <div className="flex items-center space-x-4 min-w-0 z-10">
                      <div className="w-10 flex flex-col items-center justify-center shrink-0">
                        <span className="font-black text-slate-800 dark:text-slate-200 text-base">
                          {rank}
                        </span>
                        {/* Trend Badge */}
                        <span className="flex items-center text-[10px] mt-0.5">
                          {student.trend === 'up' && <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center">▲ 1</span>}
                          {student.trend === 'down' && <span className="text-rose-600 font-extrabold flex items-center">▼ 1</span>}
                          {(!student.trend || student.trend === 'flat') && <Minus className="w-3 h-3 text-slate-300 dark:text-slate-600" />}
                        </span>
                      </div>

                      {/* Letter initials badge for row */}
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 flex items-center justify-center font-extrabold text-xs shrink-0 border border-slate-200 dark:border-slate-700 shadow-inner">
                        {getInitials(student.name)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:text-indigo-400 transition-colors">
                            {student.name}
                          </h4>
                          
                          {/* Streaks */}
                          {student.streak >= 3 && (
                            <span className="flex items-center text-orange-600 text-[10px] font-black bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 px-2 py-0.5 rounded-full">
                              <Flame className="w-3 h-3 mr-0.5 text-orange-500 dark:text-orange-400 fill-orange-500" /> {student.streak}
                            </span>
                          )}

                          {/* Military rank tag */}
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 dark:text-slate-600 px-1.5 py-0.5 rounded-md font-bold">
                            {getMilitaryRank(pts).icon} {getMilitaryRank(pts).title}
                          </span>

                          {/* New Student flag */}
                          {student.isNew && (
                            <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest animate-bounce">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center flex-wrap gap-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">{student.course || 'Khóa 3'}</span>
                          <span>Lớp: <strong className="text-slate-700 dark:text-slate-300 dark:text-slate-600 font-bold">{student.class_name}</strong></span>
                          <span>• MSSV: <strong className="text-slate-700 dark:text-slate-300 dark:text-slate-600 font-mono font-bold">{student.id}</strong></span>
                          <span>• Team: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{student.team_code}</strong></span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right z-10 flex flex-col items-end shrink-0">
                      <span className="font-black text-lg text-slate-900 dark:text-white">
                        {pts}đ
                      </span>
                      {student.recentReason && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 italic max-w-[120px] truncate block mt-0.5">
                          "{student.recentReason}"
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {restRanks.length === 0 && (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-bold text-sm">
                  Không có học sinh nào ở thứ hạng này.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Activity Feed (1 Column out of 4) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-[500px]">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200">Hoạt Động Gần Đây</h3>
              </div>
              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                {sessionPoints.length} lượt
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[640px] pr-1">
              <AnimatePresence initial={false}>
                {sessionPoints.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 dark:text-slate-500 font-bold text-xs space-y-2">
                    <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 animate-spin" style={{ animationDuration: '6s' }} />
                    <p>Đang đợi cập nhật điểm...</p>
                  </div>
                ) : (
                  sessionPoints.slice().reverse().slice(0, 10).map((rec) => {
                    const student = students.find(s => s.id === rec.student_id);
                    const courseVal = rec.course || student?.course || 'Khóa 3';
                    const classVal = rec.class_name || student?.class_name || 'Phòng';
                    const isTeam = rec.type === 'TEAM' || rec.category_label?.includes('Nhóm');

                    return (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className={`p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group animate-fadeIn border-l-4 ${
                          isTeam ? 'border-l-purple-600 bg-purple-50 dark:bg-purple-900/20/20' : 'border-l-emerald-500'
                        }`}
                      >
                        {/* Top Header Row */}
                        <div className="flex items-center justify-between mb-1">
                          {isTeam ? (
                            <span className="font-black text-purple-900 dark:text-purple-200 text-xs truncate max-w-[150px] flex items-center" title={rec.team_code}>
                              <span className="bg-purple-600 text-white px-1.5 py-0.5 rounded text-[9px] font-black mr-1.5 uppercase shadow-sm">TEAM</span>
                              <span className="truncate">{rec.team_code || 'NHÓM'}</span>
                            </span>
                          ) : (
                            <span className="font-black text-slate-800 dark:text-slate-200 text-xs truncate max-w-[150px]" title={rec.student_name}>
                              {normalizeName(rec.student_name)}
                            </span>
                          )}

                          <span className={`font-black text-xs shrink-0 whitespace-nowrap px-1.5 py-0.5 rounded ${
                            isTeam 
                              ? 'text-purple-700 bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800' 
                              : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800'
                          }`}>
                            +{rec.points}đ
                          </span>
                        </div>

                        {/* Student Name (shown under Team Name for Group Points) */}
                        {isTeam && (
                          <div className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 dark:text-slate-600 mt-1 truncate flex items-center space-x-1">
                            <span className="text-slate-400 dark:text-slate-500 font-bold">HV:</span>
                            <span className="text-slate-900 dark:text-white font-black uppercase">{normalizeName(rec.student_name)}</span>
                          </div>
                        )}

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {rec.reason}
                        </p>

                        {/* Subline Row (Course & Room/Class) */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[9px] font-bold">
                          <span className={`px-1.5 py-0.5 rounded ${
                            isTeam 
                              ? 'bg-purple-100 dark:bg-purple-900/40/70 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800' 
                              : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          }`}>
                            {courseVal} • Lớp {classVal}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono">
                            {rec.timestamp.split(' ')[1] || 'Vừa xong'}
                          </span>
                        </div>

                        {/* Coach Info Row */}
                        <div className="bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded text-[9px] text-slate-600 dark:text-slate-400 font-bold mt-2 truncate flex items-center space-x-1 border border-slate-200 dark:border-slate-700">
                          <User className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />
                          <span><strong className="text-slate-900 dark:text-white font-black">COACH {rec.coach_name || 'Lab Coach'}</strong> ({rec.coach_room || 'Phòng'})</span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER TICKER - Live Activity Feed running marquee */}
      <div className="fixed bottom-0 left-0 right-0 h-10 bg-slate-900 text-white border-t-2 border-amber-500 flex items-center z-50 overflow-hidden px-6 shadow-2xl">
        <div className="flex items-center mr-4 bg-amber-500 text-slate-950 px-3.5 py-1 rounded-full text-[10px] font-black shrink-0 shadow-md whitespace-nowrap">
          <Activity className="w-3 h-3 mr-1.5 animate-pulse" />
          <span>TIN TỨC LIVE</span>
        </div>
        <div className="flex-1 overflow-hidden relative h-full">
          {sessionPoints.length > 0 ? (
            <div className="absolute whitespace-nowrap animate-marquee flex items-center h-full text-xs font-bold space-x-16">
              <span className="text-emerald-400 flex items-center">🟢 ĐÃ CẬP NHẬT {sessionPoints.length} LƯỢT ĐIỂM REALTIME</span>
              {sessionPoints.slice().reverse().slice(0, 5).map(p => (
                <span key={p.id} className="text-slate-200">
                  <span className="text-slate-400 dark:text-slate-500 font-mono">[{p.timestamp.split(' ')[1] || 'Vừa xong'}]</span>{' '}
                  <strong className="text-amber-400 uppercase">{normalizeName(p.student_name)}</strong> vừa nhận <strong className="text-indigo-300">+{p.points}đ</strong> từ <strong className="text-emerald-400">COACH {p.coach_name || 'Lab Coach'}</strong> ({p.coach_room || 'Phòng'}): "{p.reason}"
                </span>
              ))}
              {normalizedStudents.filter(s => s.isNew).slice(0,3).map(s => (
                <span key={`new-${s.id}`} className="text-rose-400 uppercase">
                  🎉 Chào mừng {s.name} (Tân binh) vừa gia nhập Bảng xếp hạng!
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center h-full text-xs text-slate-400 dark:text-slate-500 animate-pulse font-bold">
              Đang đợi ghi nhận lượt điểm mới từ lớp học...
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
