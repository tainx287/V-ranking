import openpyxl

EXCEL_PATH = "d:/LabCoachK2/LabScoreLive/LabFlow – Dữ liệu Report cuối buổi.xlsx"

try:
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    ws = wb.active
    
    with open("inspect_student_output2.txt", "w", encoding="utf-8") as f:
        for row in ws.iter_rows(values_only=True):
            for cell in row:
                if cell and isinstance(cell, str) and 'Nguyễn Thành Đạt' in cell:
                    f.write(f"Match found in Excel: {cell}\n")
except Exception as e:
    print("Error:", e)
