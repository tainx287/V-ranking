import json

filepath = "d:/LabCoachK2/LabScoreLive/src/data/initialData.json"
try:
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    # We want to replace "Nguyễn Thành Đạt: Nguyễn Lê Quân" with "Nguyễn Lê Quân" everywhere
    # Also "Trọng Tiển: Đàm Vinh Quang" with "Đàm Vinh Quang"
    replacements = {
        "Nguyễn Thành Đạt: Nguyễn Lê Quân": "Nguyễn Lê Quân",
        "Trọng Tiển: Đàm Vinh Quang": "Đàm Vinh Quang"
    }

    changed = False

    for s in data.get("students", []):
        for bad_name, good_name in replacements.items():
            if bad_name in s.get("name", ""):
                s["name"] = s["name"].replace(bad_name, good_name)
                changed = True

    for p in data.get("points_records", []):
        for bad_name, good_name in replacements.items():
            if bad_name in p.get("student_name", ""):
                p["student_name"] = p["student_name"].replace(bad_name, good_name)
                changed = True

    if changed:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("Updated initialData.json successfully.")
    else:
        print("No matches found to replace.")
except Exception as e:
    print("Error:", e)
