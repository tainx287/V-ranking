import re

filepath = r"d:\LabCoachK2\LabScoreLive\src\components\TVPresentationView.jsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    # Fix duplicates
    r'dark:text-slate-400 dark:text-slate-500': 'dark:text-slate-400',
    r'dark:text-slate-500 dark:text-slate-400': 'dark:text-slate-400',

    # Amber card (Top 1)
    r'\btext-amber-900\b': 'text-amber-900 dark:text-amber-100',
    r'\bbg-amber-200\b': 'bg-amber-200 dark:bg-amber-900/60',
    r'\bborder-amber-300\b': 'border-amber-300 dark:border-amber-700',
    r'\btext-amber-800\b': 'text-amber-800 dark:text-amber-200',

    # Orange card (Top 3)
    r'\btext-orange-700\b': 'text-orange-700 dark:text-orange-300',
    r'\btext-orange-500\b': 'text-orange-500 dark:text-orange-400',
    r'\bbg-orange-50/50\b': 'bg-orange-50/50 dark:bg-orange-900/30',
    r'\bborder-orange-200\b': 'border-orange-200 dark:border-orange-800',

    # List ranks (4+)
    r'\bbg-emerald-50/30\b': 'bg-emerald-50/30 dark:bg-emerald-900/20',
    r'\bhover:bg-emerald-50/50\b': 'hover:bg-emerald-50/50 dark:hover:bg-emerald-900/40',
    r'\bbg-slate-50/50\b': 'bg-slate-50/50 dark:bg-slate-900/50',
    r'\bhover:bg-slate-50/80\b': 'hover:bg-slate-50/80 dark:hover:bg-slate-800',
    r'\bbg-amber-50/80\b': 'bg-amber-50/80 dark:bg-amber-900/30',
    
    r'\btext-indigo-700\b': 'text-indigo-700 dark:text-indigo-300',
    r'\btext-indigo-600\b': 'text-indigo-600 dark:text-indigo-400',

    r'\bbg-emerald-50\b': 'bg-emerald-50 dark:bg-emerald-900/30',
    r'\btext-emerald-600\b': 'text-emerald-600 dark:text-emerald-400',
    r'\bborder-emerald-200\b': 'border-emerald-200 dark:border-emerald-800',
    r'\bborder-emerald-100\b': 'border-emerald-100 dark:border-emerald-800',

    r'\bbg-purple-100/70\b': 'bg-purple-100/70 dark:bg-purple-900/40',
    r'\bborder-purple-200\b': 'border-purple-200 dark:border-purple-800',
    r'\btext-purple-800\b': 'text-purple-800 dark:text-purple-300',
    r'\btext-purple-900\b': 'text-purple-900 dark:text-purple-200',
    r'\bbg-purple-50/20\b': 'bg-purple-50/20 dark:bg-purple-900/20',

    # Feed header
    r'\bbg-slate-100\b': 'bg-slate-100 dark:bg-slate-800/80',
    r'\btext-slate-300\b': 'text-slate-300 dark:text-slate-600',
}

new_content = content
for pattern, replacement in replacements.items():
    new_content = re.sub(pattern + r'(?! dark:)', replacement, new_content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done phase 2.")
