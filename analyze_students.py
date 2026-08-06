import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/initialData.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

students = data['students']
print(f"Total students: {len(students)}")

ext_students = [s for s in students if s['id'].startswith('HV-EXT-')]
official_students = [s for s in students if s['id'].startswith('2A20260')]
other_students = [s for s in students if not s['id'].startswith('HV-EXT-') and not s['id'].startswith('2A20260')]

print(f"Official students (2A20260...): {len(official_students)}")
print(f"Extension students (HV-EXT-...): {len(ext_students)}")
print(f"Other students: {len(other_students)}")

print("\nFirst 10 extension students:")
for s in ext_students[:15]:
    print(f"- ID: {s['id']}, Name: {repr(s['name'])}, Class: {s['class_name']}, Course: {s['course']}")
