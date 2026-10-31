"""Generate English-output (LTR) copies of the framework and the enhancement layer.

usage: python -I make_english.py <skill_assets_dir>
creates <assets>/framework-en and <assets>/enh-layer-en from <assets>/framework and <assets>/enh-layer.

What it does
 1. translates every Hebrew UI string (dictionary below, longest phrase first)
 2. flips the page to lang=en dir=ltr (CSS direction/text-align, dir attributes)
 3. disables the Hebrew/English bidi wrapper (bidiFix) because English needs no isolates
 4. hides the Hebrew-specific helpers (the "EN" toggle and the English gloss line) via CSS
Anything Hebrew that is not in the dictionary is reported so you can add it.
"""
import re, sys, shutil, pathlib

TR = {
 # --- definition cards, stations, summaries
 'מה זה': 'What it is', 'איך מחשבים': 'How it is computed', 'מה מסיקים': 'What to conclude',
 'איפה אנחנו': 'Where we are', 'מושגים שנשענים עליהם': 'Concepts this relies on', 'הנתונים': 'Data', 'המטרה': 'Goal',
 'בשורה אחת': 'In one line', 'מה נאמר בהרצאה': 'What the lecture said', 'תמצית מהתמלול': 'notes from the transcript',
 'מבוסס על תמלול הווידאו': 'Based on the video transcript', 'סיכום התחנה': 'Station summary', 'הגדרות': 'Definitions',
 'מסקנה': 'Conclusion', 'הגדרה מלאה:': 'Full definition:', 'קפוץ': 'Jump', 'מונחים קרובים באנגלית:': 'Related terms:',
 'וידאו': 'Video', 'מחברת': 'Notebook', 'מעבדה': 'Lab', 'ללא קבצים': 'No files',
 # --- bar, drawers, strip
 'מצב קריאה מקוצר פעיל: הערות והרחבות מוסתרות.': 'Short reading mode on: side notes and extensions are hidden.',
 'מצב "בלי קוד" פעיל: קטעי קוד, הערות ותמצית ההרצאה מוסתרים.': '"No code" mode on: code, side notes and lecture notes are hidden.',
 'הצג את המונח באנגלית ליד כל מושג מקושר': 'Show the English term next to every linked concept',
 'סמן את המקום הנוכחי כדי שאפשר יהיה לחזור אליו': 'Mark the current place so you can come back to it',
 'מסתיר קטעי קוד והערות צד': 'Hides code and side notes', 'מסתיר הערות צד והרחבות': 'Hides side notes and extensions',
 'מקומות שבהם היית (הקרוב ביותר למעלה)': 'Places you were (most recent first)',
 'חיפוש מושג בעברית או באנגלית': 'Search a concept', 'חיפוש נושא, קוד, מושג': 'Search topic, code, concept',
 'חיפוש בתוכן': 'Search the contents', 'חיפוש מושג': 'Search a concept', 'תוכן עניינים מפורט': 'Detailed contents',
 'מקומות קודמים': 'Previous places', 'נקה היסטוריה': 'Clear history', 'חזרה אל:': 'Back to:', 'המקום הקודם': 'Previous place',
 'מילון מושגים': 'Glossary', 'קפיצה לחלק': 'Jump to a part', 'קפיצה לתחנה': 'Jump to a station',
 'בלי קוד': 'No code', 'תמצית מנהלים': 'Executive summary', 'תמצית': 'Short mode', 'מילון': 'Glossary', 'תוכן': 'Contents',
 'חזרה': 'Back', 'סמן': 'Mark', 'סגור': 'Close', 'בטל': 'Cancel', 'העתק': 'Copy', 'הועתק': 'Copied', 'נשמר': 'Saved',
 'לא נמצא.': 'Not found.', 'סימנייה': 'Bookmark', 'תרשים': 'Chart', 'קוד: ': 'Code: ', 'חלקים': 'Parts',
 # --- structure labels
 'סיכום ותבנית עבודה': 'Summary and work template', 'מה אומת': 'What was verified', 'פתיחה: רקע ונתונים': 'Opening: background and data',
 'פתיחה': 'Opening', 'סיום': 'Wrap-up', 'סקשן': 'Section', 'מבוא לאשכולות': 'Introduction', 'סוגים נוספים': 'More topics',
 'מבוא לניתוח אשכולות': 'Introduction', 'סוגים נוספים של אשכול': 'More topics', 'קלאסטר אנליסיס 37–39': 'Learning page', 'קלאסטר אנליסיס': 'Learning page',
}
FLIPS = [
 ('direction:rtl', 'direction:ltr'), ('direction: rtl', 'direction: ltr'),
 ('text-align:right', 'text-align:left'), ('dir="rtl"', 'dir="ltr"'), ("dir='rtl'", "dir='ltr'"),
 ('lang="he" dir="rtl"', 'lang="en" dir="ltr"'), ('lang="he"', 'lang="en"'),
 ('document.documentElement.lang="he"', 'document.documentElement.lang="en"'),
 ('document.documentElement.dir="rtl"', 'document.documentElement.dir="ltr"'),
]
EN_CSS = """
/* English edition: hide the Hebrew-specific helpers */
html[lang=en] .en1,html[lang=en] #enb,html[lang=en] #enh-en,html[lang=en] .tn::after{display:none!important}
"""
HEB = re.compile(r'[֐-׿]')

def convert(src: pathlib.Path, dst: pathlib.Path):
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    left = []
    for f in dst.rglob('*'):
        if f.suffix not in ('.js', '.html', '.css', '.md', '.py') or not f.is_file():
            continue
        s = f.read_text(encoding='utf8')
        for he in sorted(TR, key=len, reverse=True):
            s = s.replace(he, TR[he])
        for a, b in FLIPS:
            s = s.replace(a, b)
        s = s.replace('function bidiFix(root){', 'function bidiFix(root){return;', 1)
        if f.suffix == '.css':
            s += EN_CSS
        if f.name == 'tpl3.html':
            s = s.replace('</style>', EN_CSS + '</style>', 1)
        f.write_text(s, encoding='utf8')
        for i, line in enumerate(s.splitlines(), 1):
            if HEB.search(line):
                left.append(f'{f.relative_to(dst)}:{i}: {HEB.findall(line)[:6]}')
    return left

if __name__ == '__main__':
    base = pathlib.Path(sys.argv[1])
    sys.stdout.reconfigure(encoding='utf-8')
    for name in ('framework', 'enh-layer'):
        left = convert(base / name, base / (name + '-en'))
        print(name + '-en', 'created;', len(left), 'lines still contain Hebrew (example content is expected to stay)')
        for l in left[:40]:
            print('  ', l)
