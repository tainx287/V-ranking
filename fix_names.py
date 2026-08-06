import json
import re

def normalize_name(name):
    if not name:
        return name
    name = name.strip()
    # Remove leading special chars: double quotes, single quotes, parens, brackets
    name = re.sub(r'^["\x27(\[{]+', '', name).strip()
    # Title case each word
    words = name.split()
    result = []
    for w in words:
        if w:
            result.append(w[0].upper() + w[1:] if len(w) > 1 else w.upper())
    return ' '.join(result)

with open('src/data/initialData.json', encoding='utf-8') as f:
    data = json.load(f)

fixed = 0
for s in data['students']:
    original = s['name']
    if original and (original[0] in '"\x27(' or not original[0].isalpha()):
        cleaned = normalize_name(original)
        s['name'] = cleaned
        fixed += 1

print(f'\nTotal fixed: {fixed}')

with open('src/data/initialData.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Saved successfully.')
