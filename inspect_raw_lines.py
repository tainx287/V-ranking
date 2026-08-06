import openpyxl
import sys

sys.stdout.reconfigure(encoding='utf-8')

wb = openpyxl.load_workbook("LabFlow – Dữ liệu Report cuối buổi.xlsx", read_only=True)
sheet = wb['Điểm cộng']

headers = None
rows = []
for row in sheet.iter_rows(values_only=True):
    if not headers:
        headers = row
        continue
    rows.append(row)

not_ok = [r for r in rows if r[headers.index('Trạng thái parse')] != 'OK']

print(f"Total not-OK rows: {len(not_ok)}")
print("Sample not-OK rows:")
for i, r in enumerate(not_ok[:40]):
    raw_line = r[headers.index('Dòng gốc')]
    status = r[headers.index('Trạng thái parse')]
    print(f"{i+1:02d}: Status: {status} | Raw Line: {repr(raw_line)}")
