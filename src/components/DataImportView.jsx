import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle, RefreshCw, Database, Search, AlertCircle, Link } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function DataImportView({
  pointsRecords,
  students,
  onImportNewPoints
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1oWYPF62vl06oSQ2nx9pakErCIUTj6Rdu-M6wNn8Io60/edit?gid=351297083#gid=351297083');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const sheetName = wb.SheetNames.includes('Điểm cộng') ? 'Điểm cộng' : wb.SheetNames[0];
        const worksheet = wb.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet);

        const newParsedRecords = rawData.map((row, idx) => ({
          id: `PTS-IMPORT-${idx + 1}`,
          session_id: row['Session ID'] || row['Mã buổi học / Session ID'] || 'K3-DAY01-LEC-D301',
          class_name: 'C401',
          timestamp: row['Thời gian gửi'] || new Date().toISOString(),
          coach_email: row['Email'] || row['Email Address'] || 'coach@labflow.edu.vn',
          student_id: row['Mã số học viên'] || '',
          student_name: row['Tên học viên'] || row['Dòng gốc'] || 'Học viên',
          points: parseFloat(row['Điểm cộng']) || 1.0,
          reason: row['Lý do'] || 'Phát biểu',
          raw_line: row['Dòng gốc'] || ''
        }));

        onImportNewPoints(newParsedRecords);
        setImportStatus(`Đã nạp thành công ${newParsedRecords.length} dòng dữ liệu điểm cộng từ file Excel!`);
      } catch (err) {
        console.error(err);
        setImportStatus('Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFetchGoogleSheets = async () => {
    setIsSyncing(true);
    setImportStatus('');
    try {
      // Extract docId and gid from URL
      const docIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      const gidMatch = sheetUrl.match(/gid=([0-9]+)/);
      
      const docId = docIdMatch ? docIdMatch[1] : '1oWYPF62vl06oSQ2nx9pakErCIUTj6Rdu-M6wNn8Io60';
      const gid = gidMatch ? gidMatch[1] : '351297083';

      const csvExportUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;
      
      const res = await fetch(csvExportUrl);
      if (!res.ok) throw new Error('Không thể tải CSV từ Google Sheet. Hãy đảm bảo Sheet đã bật quyền công khai đọc.');
      
      const csvText = await res.text();
      const wb = XLSX.read(csvText, { type: 'string' });
      const worksheet = wb.Sheets[wb.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(worksheet);

      const newParsedRecords = rawData.map((row, idx) => ({
        id: `PTS-GSHEET-${idx + 1}`,
        session_id: row['Session ID'] || row['Mã buổi học / Session ID'] || 'K3-DAY01-LEC-D301',
        class_name: 'C401',
        timestamp: row['Thời gian gửi'] || new Date().toISOString(),
        coach_email: row['Email'] || row['Email Address'] || 'coach@labflow.edu.vn',
        student_id: row['Mã số học viên'] || '',
        student_name: row['Tên học viên'] || row['Dòng gốc'] || 'Học viên',
        points: parseFloat(row['Điểm cộng']) || 1.0,
        reason: row['Lý do'] || 'Phát biểu',
        raw_line: row['Dòng gốc'] || ''
      }));

      onImportNewPoints(newParsedRecords);
      setImportStatus(`Đồng bộ thành công ${newParsedRecords.length} dòng điểm cộng từ Google Sheet live DB!`);
    } catch (err) {
      console.error(err);
      setImportStatus(`Thông báo: Đã kết nối link Google Sheet. Nếu Sheet chưa bật Publish to Web, bạn có thể chọn Upload File Excel để đồng bộ offline.`);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredPoints = pointsRecords.filter(p =>
    p.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.raw_line.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Live Google Sheets Link Sync Card */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Link className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-slate-100">Đồng Bộ Google Sheets DB Mặc Định</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Liên kết trực tiếp với Sheet Report cuối buổi để tự động đối chiếu điểm cộng daily.
            </p>
          </div>

          <button
            onClick={handleFetchGoogleSheets}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang Đồng Bộ DB...' : 'Đồng Bộ DB Ngay'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-amber-400 font-mono font-bold shrink-0">Sheet Link:</span>
          <input
            type="text"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            className="w-full bg-transparent text-slate-300 font-mono focus:outline-none text-[11px] truncate"
          />
        </div>
      </div>

      {/* Excel Upload Header */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">Đồng Bộ Dữ Liệu File Excel Offline</h2>
          </div>
          <p className="text-xs text-slate-400">
            Nạp file <code className="text-amber-300">LabFlow – Dữ liệu Report cuối buổi.xlsx</code> khi không có kết nối internet.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all">
            <Upload className="w-4 h-4" />
            <span>Nạp File Excel Mới (.xlsx)</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {importStatus && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Raw Data Inspection Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-slate-200">Dữ Liệu Điểm Cộng Gốc ({pointsRecords.length} Bản Ghi)</h3>
            <p className="text-xs text-slate-400">Danh sách các câu ghi chép thô và bản ghi điểm cộng của Lab Coach</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm kiếm dòng gốc, tên học viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-800 max-h-[460px] overflow-y-auto border border-slate-800 rounded-xl">
          {filteredPoints.slice(0, 100).map((p, idx) => (
            <div key={p.id || idx} className="p-3 bg-slate-950/60 hover:bg-slate-900 transition-colors text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
              <div className="min-w-0 pr-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
                    {p.session_id}
                  </span>
                  <span className="font-bold text-amber-300">{p.student_name || 'Học viên'}</span>
                  {p.student_id && <span className="text-slate-400">({p.student_id})</span>}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono truncate">
                  Dòng gốc: "{p.raw_line}"
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  +{p.points}đ
                </span>
                <span className="text-[10px] text-slate-500">{p.timestamp.split(' ')[0]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
