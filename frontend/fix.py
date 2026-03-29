content = open('app/page.tsx', 'r', encoding='utf-8').read()
content = content.replace(
    'text-violet-400">JobTracker AI</span>',
    'text-violet-400">JobTracker AI</span>\n          <a href="/analytics" className="text-gray-400 hover:text-white text-sm transition">Analytics</a>'
)
content = content.replace(
    '<button onClick={() => deleteApp(app.id)}',
    '<button onClick={() => { setNotesApp(app); fetchNotes(app.id) }} className="text-xs text-blue-400 hover:text-blue-300 transition">Notes</button>\n                        <button onClick={() => deleteApp(app.id)}'
)
open('app/page.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
