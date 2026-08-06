import openpyxl
import sys

sys.stdout.reconfigure(encoding='utf-8')

wb = openpyxl.load_workbook("LabFlow – Dữ liệu Report cuối buổi.xlsx", read_only=True)
sheet = wb['Form Responses 1']

rows = list(sheet.iter_rows(values_only=True))
header = rows[0]
points_col_idx = header.index('Danh sách học viên được cộng điểm')

print("Points column index:", points_col_idx)

non_empty_responses = []
for i, r in enumerate(rows[1:]):
    val = r[points_col_idx]
    if val:
        non_empty_responses.append((i + 2, val))

print(f"Total non-empty responses: {len(non_empty_responses)}")
for idx, (row_num, val) in enumerate(non_empty_responses[:20]):
    print(f"\n--- Row {row_num} ---")
    print(val)
