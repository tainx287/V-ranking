import openpyxl
import sys

sys.stdout.reconfigure(encoding='utf-8')

wb = openpyxl.load_workbook("LabFlow – Dữ liệu Report cuối buổi.xlsx", read_only=True)
sheet = wb['Form Responses 1']

for row in sheet.iter_rows(values_only=True):
    print("Headers of Form Responses 1:")
    for idx, col in enumerate(row):
        print(f"{idx}: {col}")
    break
