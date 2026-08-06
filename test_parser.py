import re
import sys
import openpyxl

sys.stdout.reconfigure(encoding='utf-8')

def clean_student_name(name):
    if not name:
        return ""
    name = name.strip()
    name = re.sub(r'^[-\s+*•]+', '', name)
    name = re.sub(r'[+\s]+$', '', name)
    name = re.sub(r'(?i)\b(phát biểu|giơ tay phát biểu|phát biểu xây dựng bài|phát biểu trong giờ|lên demo lab|demo bài lab|demo lab|demo ý tưởng|top 10 kahoot|trong top 10 kahoots|bonus quiz|trả lời câu hỏi lý thuyết|tham gia hỏi đáp qa|hoàn thành bài sớm và hỗ trợ các bạn|hỗ trợ các nhóm khác hoàn thành bài lab)\b.*$', '', name)
    name = name.strip()
    name = re.sub(r'[-\s+*•]+$', '', name)
    name = ' '.join(w.capitalize() for w in name.split())
    return name

def parse_raw_line(line):
    line = line.strip()
    if not line:
        return None

    # Standardize student ID extraction
    # Matches: 2A..., T..., or standalone 3-5 digits
    match_id = re.search(r'([2T][A0-9]*\d{3,5}|\b\d{3,5}\b)', line)
    if not match_id:
        return None

    raw_id = match_id.group(1)
    digits = re.sub(r'\D', '', raw_id)
    if len(digits) < 3:
        return None
    suffix = digits[-4:].zfill(4)
    student_id = f"2A20260{suffix}"

    # Try to identify points
    points = 1
    # Remove raw_id first so we don't accidentally match digits in ID as points
    line_without_id = line.replace(raw_id, ' [ID] ')
    points_match = re.search(r'(?:\b|\s)\+?([1235])(?:\b|\s)', line_without_id)
    if points_match:
        points = int(points_match.group(1))

    # Standardize reason/activity
    reason = "Phát biểu"
    if "kahoot" in line.lower() or "quiz" in line.lower():
        reason = "Top Kahoot / Quiz"
    elif "demo" in line.lower():
        reason = "Demo Lab / Ý tưởng"
    elif "hỗ trợ" in line.lower() or "hoàn thành bài sớm" in line.lower():
        reason = "Hỗ trợ học viên khác"
    elif "phản biện" in line.lower():
        reason = "Phát biểu phản biện"
    elif "lý thuyết" in line.lower() or "hỏi đáp" in line.lower() or "qa" in line.lower():
        reason = "Phát biểu lý thuyết / Q&A"
    
    # Extract the name
    cleaned_line = line.replace(raw_id, '')
    if points_match:
        cleaned_line = cleaned_line.replace(points_match.group(0), '')
        
    parts = [p.strip() for p in re.split(r'[\t\-–—]', cleaned_line) if p.strip()]
    
    name_candidate = ""
    for p in parts:
        cleaned_p = clean_student_name(p)
        if len(cleaned_p) > 4 and not any(k in p.lower() for k in ["phát biểu", "demo", "kahoot", "quiz", "hỗ trợ", "bonus"]):
            name_candidate = cleaned_p
            break
    
    if not name_candidate and parts:
        for p in parts:
            cleaned_p = clean_student_name(p)
            if len(cleaned_p) > 2:
                name_candidate = cleaned_p
                break
                
    if not name_candidate:
        name_candidate = clean_student_name(cleaned_line)

    return {
        "student_id": student_id,
        "student_name": name_candidate,
        "points": points,
        "reason": reason,
        "raw_line": line
    }

if __name__ == "__main__":
    wb = openpyxl.load_workbook("LabFlow – Dữ liệu Report cuối buổi.xlsx", read_only=True)
    sheet = wb['Điểm cộng']
    rows = list(sheet.iter_rows(values_only=True))[1:]

    skipped = []
    success_count = 0
    for i, r in enumerate(rows):
        line = r[12]
        if not line: continue
        parsed = parse_raw_line(line)
        if parsed:
            success_count += 1
        else:
            skipped.append((i+2, line))

    print(f"Parsed {success_count}/{len(rows)} successfully.")
    print(f"Skipped {len(skipped)} lines:")
    for row_num, line in skipped:
        print(f"Row {row_num}: {repr(line)}")
