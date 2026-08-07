export function cleanStudentName(name) {
  if (!name) return "";
  let cleanName = name.trim();
  // Remove leading hyphens, bullets or symbols
  cleanName = cleanName.replace(/^[-\s+*•]+/g, '');
  // Remove trailing plus signs or spaces
  cleanName = cleanName.replace(/[+\s]+$/g, '');
  
  const activityKeywords = [
    "phát biểu", "giơ tay phát biểu", "phát biểu xây dựng bài", 
    "phát biểu trong giờ", "lên demo lab", "demo bài lab", "demo lab", 
    "demo ý tưởng", "top 10 kahoot", "trong top 10 kahoots", "bonus quiz", 
    "trả lời câu hỏi lý thuyết", "tham gia hỏi đáp qa", 
    "hoàn thành bài sớm và hỗ trợ các bạn", "hỗ trợ các nhóm khác hoàn thành bài lab",
    "hỏi đáp qa", "demo sản phẩm bàn", "demo"
  ];
  
  const keywordPattern = new RegExp(`\\b(${activityKeywords.join('|')})\\b.*$`, 'i');
  cleanName = cleanName.replace(keywordPattern, '');
  
  cleanName = cleanName.trim();
  cleanName = cleanName.replace(/[-\s+*•]+$/g, '');
  cleanName = cleanName.replace(/^["'(\[{]+/g, '').trim();
  
  const words = cleanName.split(/\s+/);
  const result = words.map(w => {
    if (!w) return '';
    return w.length > 1 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase();
  });
  
  return result.join(' ');
}

export function extractStudentIdAndRaw(line) {
  const matchId = line.match(/([2T][A0-9]*\d{3,5}|\b\d{3,5}\b)/i);
  if (!matchId) return { studentId: null, rawId: null };
  
  const rawId = matchId[1];
  const digits = rawId.replace(/\D/g, '');
  if (digits.length < 3) return { studentId: null, rawId: null };
  
  const suffix = digits.slice(-4).padStart(4, '0');
  const studentId = `2A20260${suffix}`;
  
  return { studentId, rawId };
}

export function parseRawLine(line) {
  line = line.trim();
  if (!line) return null;
  
  const { studentId, rawId } = extractStudentIdAndRaw(line);
  if (!studentId) return null;
  
  let points = 1;
  const lineWithoutId = line.replace(rawId, ' [ID] ');
  const pointsMatch = lineWithoutId.match(/(?:\b|\s)\+?([1235])(?:\b|\s)/);
  if (pointsMatch) {
    points = parseInt(pointsMatch[1], 10);
  }
  
  let reason = "Phát biểu";
  const lowerLine = line.toLowerCase();
  if (lowerLine.includes("kahoot") || lowerLine.includes("quiz")) {
    reason = "Top Kahoot / Quiz";
  } else if (lowerLine.includes("demo")) {
    reason = "Demo Lab / Ý tưởng";
  } else if (lowerLine.includes("hỗ trợ") || lowerLine.includes("hoàn thành bài sớm")) {
    reason = "Hỗ trợ học viên khác";
  } else if (lowerLine.includes("phản biện")) {
    reason = "Phát biểu phản biện";
  } else if (lowerLine.includes("lý thuyết") || lowerLine.includes("hỏi đáp") || lowerLine.includes("qa")) {
    reason = "Phát biểu lý thuyết / Q&A";
  }
  
  let cleanedLine = line.replace(rawId, '');
  if (pointsMatch) {
    cleanedLine = cleanedLine.replace(pointsMatch[0], '');
  }
  
  const parts = cleanedLine.split(/[\t\-–—:,]/).map(p => p.trim()).filter(p => p);
  
  let nameCandidate = "";
  for (const p of parts) {
    const cleanedP = cleanStudentName(p);
    const hasKeyword = ["phát biểu", "demo", "kahoot", "quiz", "hỗ trợ", "bonus"].some(k => p.toLowerCase().includes(k));
    if (cleanedP.length > 4 && !hasKeyword) {
      nameCandidate = cleanedP;
      break;
    }
  }
  
  if (!nameCandidate && parts.length > 0) {
    for (const p of parts) {
      const cleanedP = cleanStudentName(p);
      if (cleanedP.length > 2) {
        nameCandidate = cleanedP;
        break;
      }
    }
  }
  
  if (!nameCandidate) {
    nameCandidate = cleanStudentName(cleanedLine);
  }
  
  return {
    student_id: studentId,
    student_name: nameCandidate,
    points: points,
    reason: reason,
    raw_line: line
  };
}

export function parseGoogleSheetsData(csvData) {
  const pointsRecords = [];
  
  csvData.forEach(row => {
    // Tên cột có thể bị thay đổi tuỳ theo file CSV
    const sessionCol = row["Mã buổi học / Session ID"] || row["Session ID"];
    const pointsListCol = row["Danh sách học viên được cộng điểm"] || row["Danh sách học viên"];
    const timestamp = row["Timestamp"] || new Date().toISOString();
    
    if (!sessionCol || !pointsListCol) return;
    
    const sessionId = sessionCol.trim();
    const rawLines = pointsListCol.split(/\r?\n/);
    
    rawLines.forEach(line => {
      const parsed = parseRawLine(line);
      if (parsed) {
        pointsRecords.push({
          id: `gs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          student_id: parsed.student_id,
          student_name: parsed.student_name,
          points: parsed.points,
          reason: parsed.reason,
          session_id: sessionId,
          timestamp: new Date(timestamp).toISOString(),
          raw_line: parsed.raw_line
        });
      }
    });
  });
  
  return pointsRecords;
}
