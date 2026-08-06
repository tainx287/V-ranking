import openpyxl
import sys
from collections import Counter

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

reasons = [r[headers.index('Lý do')] for r in rows if r[headers.index('Lý do')] is not None]
raw_lines = [r[headers.index('Dòng gốc')] for r in rows if r[headers.index('Dòng gốc')] is not None]

print("Total parsed reasons:", len(reasons))
print("Top 20 parsed reasons in Điểm cộng:")
for reason, count in Counter(reasons).most_common(20):
    print(f"- {reason}: {count}")

print("\nExtracting from raw lines directly (last parts):")
inferred_reasons = []
for line in raw_lines:
    parts = [p.strip() for p in line.split('-')]
    if len(parts) >= 3:
        inferred_reasons.append(parts[-1])

print("Top 25 inferred reasons from raw lines:")
for r, count in Counter(inferred_reasons).most_common(25):
    print(f"- {r}: {count}")
