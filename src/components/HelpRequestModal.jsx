import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Hand, Send, DoorOpen, MessageSquareText } from 'lucide-react';

const ROOMS = [
  'Phòng D301', 'Phòng D302', 'Phòng D303', 'Phòng D304', 'Phòng D305',
  'Phòng C401', 'Phòng C402',
  'Phòng E401', 'Phòng E402', 'Phòng E403',
  'Hội Trường B'
];

const PREDEFINED_NOTES = [
  { id: 'bug', label: '🐛 Lỗi Code/Bug' },
  { id: 'logic', label: '🧠 Cần check logic' },
  { id: 'req', label: '🤔 Không hiểu đề' },
  { id: 'env', label: '💻 Lỗi môi trường' },
  { id: 'review', label: '💯 Chấm điểm/Review' },
  { id: 'other', label: '✏️ Khác' }
];

export default function HelpRequestModal({ isOpen, onClose, onSubmit, students, selectedSession }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [selectedRoom, setSelectedRoom] = useState('');
  const [locationText, setLocationText] = useState('');
  const [selectedNoteType, setSelectedNoteType] = useState('');
  const [customNote, setCustomNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter students based on search
  const filteredStudents = students
    .filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 5); // Limit to top 5 results

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedStudent(null);
      setSelectedRoom('');
      setLocationText('');
      setSelectedNoteType('');
      setCustomNote('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRoom || !locationText || !selectedNoteType) return;
    
    setIsSubmitting(true);
    
    let finalNote = PREDEFINED_NOTES.find(n => n.id === selectedNoteType)?.label || '';
    if (selectedNoteType === 'other' || customNote.trim().length > 0) {
      finalNote = selectedNoteType === 'other' ? customNote : `${finalNote} - ${customNote}`;
    }
    
    // Fake network delay for better UX
    setTimeout(() => {
      onSubmit({
        student_id: selectedStudent ? selectedStudent.id : 'Ẩn danh',
        student_name: selectedStudent ? selectedStudent.name : 'Một học viên',
        room: selectedRoom,
        location: locationText,
        note: finalNote || 'Không có ghi chú',
        session_id: selectedSession
      });
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-rose-500 p-5 text-white relative flex-shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Hand className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-black">Gọi Lab Coach</h2>
          </div>
          <p className="text-rose-100 text-sm font-medium">
            Điền vị trí của bạn để Lab Coach có thể tìm đến hỗ trợ nhanh nhất nhé!
          </p>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <form id="help-request-form" onSubmit={handleSubmit} className="p-5 space-y-5">
            
            {/* Step 1: Who are you */}
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700 dark:text-slate-300">
                1. Bạn là ai? <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
              </label>
              
              {!selectedStudent ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Gõ tên hoặc MSSV để tìm..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all dark:text-white text-sm font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  
                  {/* Search Results Dropdown */}
                  {searchQuery.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-20 max-h-48 overflow-y-auto">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map(student => (
                          <button
                            key={student.id}
                            type="button"
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 last:border-0 flex items-center justify-between group transition-colors"
                            onClick={() => {
                              setSelectedStudent(student);
                              setSearchQuery('');
                            }}
                          >
                            <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 text-sm">
                              {student.name}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {student.id}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-500 text-center">
                          Không tìm thấy học viên
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-xl">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedStudent.name}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      {selectedStudent.id} • {selectedStudent.class_name}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-100 dark:bg-rose-900/50 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Thay đổi
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Room (Required) */}
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700 dark:text-slate-300">
                2. Bạn đang ở phòng nào? <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  required
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all dark:text-white text-sm font-medium appearance-none"
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                >
                  <option value="" disabled>-- Chọn phòng học --</option>
                  {ROOMS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {/* Step 3: Location (Required) */}
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700 dark:text-slate-300">
                3. Vị trí chỗ ngồi của bạn? <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="text"
                  placeholder="VD: Dãy giữa, bàn 3 gần cửa sổ..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all dark:text-white text-sm font-medium"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                />
              </div>
            </div>

            {/* Step 4: Issue */}
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700 dark:text-slate-300">
                4. Vấn đề bạn gặp phải? <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_NOTES.map(note => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setSelectedNoteType(note.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      selectedNoteType === note.id
                        ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/30 dark:border-rose-500/30 dark:text-rose-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-500/50'
                    }`}
                  >
                    {note.label}
                  </button>
                ))}
              </div>
              
              {(selectedNoteType === 'other' || selectedNoteType) && (
                <div className="relative mt-2 animate-in slide-in-from-top-1 fade-in">
                  <MessageSquareText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    rows="2"
                    placeholder="Mô tả thêm (Tùy chọn)..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all dark:text-white text-sm font-medium resize-none custom-scrollbar"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                  />
                </div>
              )}
            </div>
            
          </form>
        </div>

        {/* Footer / Submit */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
          <button
            type="submit"
            form="help-request-form"
            disabled={!selectedRoom || !locationText || !selectedNoteType || isSubmitting}
            className={`w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl font-black text-sm transition-all shadow-lg ${
              !selectedRoom || !locationText || !selectedNoteType || isSubmitting
                ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white hover:-translate-y-0.5 shadow-rose-500/25'
            }`}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Gọi Lab Coach Ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
