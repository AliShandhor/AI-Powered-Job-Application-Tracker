'use client'
import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Application = {
  id: string
  company_name: string
  job_title: string
  status: string
  applied_date: string
  job_description?: string
}

type Note = {
  id: string
  application_id: string
  content: string
  created_at: string
}

type AIAnalysis = {
  required_skills: string[]
  preferred_skills: string[]
  seniority_level: string
  estimated_yoe: number
  key_requirements: string[]
  culture_signals: string[]
  compensation: { min: number; max: number; currency: string } | null
}

const STATUS_OPTIONS = ['applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn']

const statusColors: Record<string, string> = {
  applied: 'bg-blue-500/10 text-blue-400',
  screening: 'bg-yellow-500/10 text-yellow-400',
  interview: 'bg-purple-500/10 text-purple-400',
  offer: 'bg-green-500/10 text-green-400',
  rejected: 'bg-red-500/10 text-red-400',
  withdrawn: 'bg-gray-500/10 text-gray-400',
}

export default function Home() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [coverLetterApp, setCoverLetterApp] = useState<Application | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [generatingCL, setGeneratingCL] = useState(false)
  const [background, setBackground] = useState('')
  const [tone, setTone] = useState('professional')
  const [copied, setCopied] = useState(false)
  const [interviewApp, setInterviewApp] = useState<Application | null>(null)
  const [interviewPrep, setInterviewPrep] = useState<any>(null)
  const [generatingIP, setGeneratingIP] = useState(false)
  const [interviewBackground, setInterviewBackground] = useState('')
  const [activeTab, setActiveTab] = useState<'behavioral' | 'technical' | 'to_ask' | 'red_flags'>('behavioral')
  const [notesApp, setNotesApp] = useState<Application | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [form, setForm] = useState({
    company_name: '',
    job_title: '',
    status: 'applied',
    applied_date: '',
    job_description: ''
  })

  useEffect(() => { fetchApps() }, [])

  async function fetchApps() {
    const res = await fetch(`${API}/api/v1/applications/`)
    const data = await res.json()
    setApps(data)
    setLoading(false)
  }

  async function addApp() {
    await fetch(`${API}/api/v1/applications/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        applied_date: form.applied_date || new Date().toISOString().split('T')[0]
      })
    })
    setShowForm(false)
    setForm({ company_name: '', job_title: '', status: 'applied', applied_date: '', job_description: '' })
    setAnalysis(null)
    fetchApps()
  }

  async function deleteApp(id: string) {
    if (!confirm('Delete this application?')) return
    setDeletingId(id)
    await fetch(`${API}/api/v1/applications/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    fetchApps()
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id)
    await fetch(`${API}/api/v1/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    setUpdatingId(null)
    fetchApps()
  }

  async function analyzeJob() {
    if (!form.job_description || form.job_description.length < 50) return
    setAnalyzing(true)
    const res = await fetch(`${API}/api/v1/ai/analyze-job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_description: form.job_description })
    })
    const data = await res.json()
    setAnalysis(data)
    setAnalyzing(false)
  }

  async function analyzeExisting(app: Application) {
    if (!app.job_description) return
    setSelectedApp(app)
    setAnalyzing(true)
    setAnalysis(null)
    const res = await fetch(`${API}/api/v1/ai/analyze-job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_description: app.job_description })
    })
    const data = await res.json()
    setAnalysis(data)
    setAnalyzing(false)
  }

  async function generateCoverLetter() {
    if (!coverLetterApp || !background) return
    setGeneratingCL(true)
    setCoverLetter('')
    const res = await fetch(`${API}/api/v1/ai/cover-letter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_description: coverLetterApp.job_description || coverLetterApp.job_title,
        company_name: coverLetterApp.company_name,
        job_title: coverLetterApp.job_title,
        your_background: background,
        tone
      })
    })
    const data = await res.json()
    setCoverLetter(data.cover_letter)
    setGeneratingCL(false)
  }

  async function generateInterviewPrep() {
    if (!interviewApp) return
    setGeneratingIP(true)
    setInterviewPrep(null)
    const res = await fetch(`${API}/api/v1/ai/interview-prep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_description: interviewApp.job_description || interviewApp.job_title,
        company_name: interviewApp.company_name,
        job_title: interviewApp.job_title,
        your_background: interviewBackground
      })
    })
    const data = await res.json()
    setInterviewPrep(data)
    setGeneratingIP(false)
  }

  async function fetchNotes(appId: string) {
    const res = await fetch(`${API}/api/v1/applications/${appId}/notes`)
    const data = await res.json()
    setNotes(data)
  }

  async function addNote() {
    if (!notesApp || !newNote.trim()) return
    setSavingNote(true)
    await fetch(`${API}/api/v1/applications/${notesApp.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newNote.trim() })
    })
    setNewNote('')
    setSavingNote(false)
    fetchNotes(notesApp.id)
  }

  async function deleteNote(noteId: string) {
    if (!notesApp) return
    await fetch(`${API}/api/v1/applications/${notesApp.id}/notes/${noteId}`, {
      method: 'DELETE'
    })
    fetchNotes(notesApp.id)
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(coverLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const stats = [
    { label: 'Total Applied', value: apps.length },
    { label: 'In Progress', value: apps.filter(a => ['screening', 'interview'].includes(a.status)).length },
    { label: 'Interviews', value: apps.filter(a => a.status === 'interview').length },
    { label: 'Offers', value: apps.filter(a => a.status === 'offer').length },
  ]

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold text-violet-400">JobTracker AI</span>
          <a href="/analytics" className="text-gray-400 hover:text-white text-sm transition">Analytics</a>
        </div>
        <button onClick={() => { setShowForm(true); setAnalysis(null) }} className="bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition">
          + Add Application
        </button>
      </nav>

      {/* Add Application Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">New Application</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input placeholder="Company name" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500" />
              <input placeholder="Job title" value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500" />
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              <input type="date" value={form.applied_date} onChange={e => setForm({ ...form, applied_date: e.target.value })} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500" />
            </div>
            <textarea placeholder="Paste job description here for AI analysis (optional)..." value={form.job_description} onChange={e => setForm({ ...form, job_description: e.target.value })} rows={5} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 resize-none mb-3" />
            {form.job_description.length >= 50 && !analysis && (
              <button onClick={analyzeJob} disabled={analyzing} className="w-full bg-violet-900/50 hover:bg-violet-800/50 border border-violet-700 text-violet-300 text-sm py-2 rounded-lg transition mb-3 disabled:opacity-50">
                {analyzing ? '🤖 Analyzing...' : '🤖 Analyze with AI'}
              </button>
            )}
            {analysis && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-3 text-sm">
                <p className="text-violet-400 font-medium mb-3">AI Analysis</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-gray-400 text-xs mb-1">Seniority</p><p className="text-white capitalize">{analysis.seniority_level} · {analysis.estimated_yoe}+ yrs</p></div>
                  {analysis.compensation && <div><p className="text-gray-400 text-xs mb-1">Compensation</p><p className="text-white">${analysis.compensation.min / 1000}k – ${analysis.compensation.max / 1000}k</p></div>}
                  <div className="col-span-2"><p className="text-gray-400 text-xs mb-1">Required Skills</p><div className="flex flex-wrap gap-1">{analysis.required_skills.map(s => <span key={s} className="bg-blue-500/10 text-blue-400 text-xs px-2 py-0.5 rounded-full">{s}</span>)}</div></div>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={addApp} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm py-2 rounded-lg transition">Save</button>
              <button onClick={() => { setShowForm(false); setAnalysis(null) }} className="flex-1 bg-gray-800 hover:bg-gray-700 text-sm py-2 rounded-lg transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">AI Analysis — {selectedApp.company_name}</h2>
              <button onClick={() => { setSelectedApp(null); setAnalysis(null) }} className="text-gray-400 hover:text-white">✕</button>
            </div>
            {analyzing && <p className="text-gray-400 text-sm text-center py-8">🤖 Analyzing...</p>}
            {analysis && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Seniority</p><p className="text-white capitalize font-medium">{analysis.seniority_level}</p></div>
                  <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Experience</p><p className="text-white font-medium">{analysis.estimated_yoe}+ years</p></div>
                </div>
                {analysis.compensation && (
                  <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Compensation</p><p className="text-green-400 font-medium">${analysis.compensation.min.toLocaleString()} – ${analysis.compensation.max.toLocaleString()} {analysis.compensation.currency}</p></div>
                )}
                <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-2">Required Skills</p><div className="flex flex-wrap gap-1">{analysis.required_skills.map(s => <span key={s} className="bg-blue-500/10 text-blue-400 text-xs px-2 py-0.5 rounded-full">{s}</span>)}</div></div>
                {analysis.preferred_skills.length > 0 && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-2">Nice to Have</p><div className="flex flex-wrap gap-1">{analysis.preferred_skills.map(s => <span key={s} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">{s}</span>)}</div></div>}
                <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-2">Key Requirements</p><ul className="space-y-1">{analysis.key_requirements.map(r => <li key={r} className="text-gray-300 text-xs flex gap-2"><span className="text-violet-400">→</span>{r}</li>)}</ul></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cover Letter Modal */}
      {coverLetterApp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">✍️ Cover Letter — {coverLetterApp.company_name}</h2>
              <button onClick={() => { setCoverLetterApp(null); setCoverLetter('') }} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Your Background & Experience</label>
                <textarea placeholder="Be specific and honest — e.g. 2 years React experience, built 3 personal projects, CS degree, proficient in Python and JavaScript." value={background} onChange={e => setBackground(e.target.value)} rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 resize-none" />
                <p className="text-yellow-500/70 text-xs mt-1">⚠️ Be specific — vague input leads to fabricated details.</p>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Tone</label>
                <select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500">
                  <option value="professional">Professional</option>
                  <option value="conversational">Conversational</option>
                  <option value="startup">Startup</option>
                </select>
              </div>
              <button onClick={generateCoverLetter} disabled={generatingCL || background.length < 30} className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm py-2 rounded-lg transition disabled:opacity-50">
                {generatingCL ? '🤖 Generating...' : '🤖 Generate Cover Letter'}
              </button>
            </div>
            {coverLetter && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-violet-400 text-sm font-medium">Generated Cover Letter</p>
                  <button onClick={copyToClipboard} className="text-xs text-gray-400 hover:text-white transition">{copied ? '✓ Copied!' : 'Copy'}</button>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{coverLetter}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interview Prep Modal */}
      {interviewApp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">🎯 Interview Prep — {interviewApp.company_name}</h2>
              <button onClick={() => { setInterviewApp(null); setInterviewPrep(null) }} className="text-gray-400 hover:text-white">✕</button>
            </div>
            {!interviewPrep && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Your Background (optional)</label>
                  <textarea placeholder="e.g. 3 years Python experience, built REST APIs, familiar with AWS..." value={interviewBackground} onChange={e => setInterviewBackground(e.target.value)} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 resize-none" />
                </div>
                <button onClick={generateInterviewPrep} disabled={generatingIP} className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm py-2 rounded-lg transition disabled:opacity-50">
                  {generatingIP ? '🤖 Generating...' : '🎯 Generate Interview Questions'}
                </button>
              </div>
            )}
            {generatingIP && <div className="text-center py-8 text-gray-400 text-sm">🤖 Generating tailored questions...</div>}
            {interviewPrep && (
              <div>
                <div className="flex gap-2 mb-4 flex-wrap">
                  {(['behavioral', 'technical', 'to_ask', 'red_flags'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`text-xs px-3 py-1.5 rounded-lg transition ${activeTab === tab ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                      {tab === 'behavioral' && '🧠 Behavioral'}
                      {tab === 'technical' && '⚙️ Technical'}
                      {tab === 'to_ask' && '❓ Ask Them'}
                      {tab === 'red_flags' && '🚩 Red Flags'}
                    </button>
                  ))}
                </div>
                {activeTab === 'behavioral' && (
                  <div className="space-y-3">
                    {interviewPrep.behavioral.map((item: any, i: number) => (
                      <div key={i} className="bg-gray-800 rounded-lg p-4">
                        <p className="text-white text-sm font-medium mb-2">Q{i + 1}: {item.question}</p>
                        <p className="text-violet-300 text-xs">💡 {item.tip}</p>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'technical' && (
                  <div className="space-y-3">
                    {interviewPrep.technical.map((item: any, i: number) => (
                      <div key={i} className="bg-gray-800 rounded-lg p-4">
                        <p className="text-white text-sm font-medium mb-2">Q{i + 1}: {item.question}</p>
                        <p className="text-teal-300 text-xs">🔧 {item.hint}</p>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'to_ask' && (
                  <div className="space-y-3">
                    {interviewPrep.to_ask.map((q: string, i: number) => (
                      <div key={i} className="bg-gray-800 rounded-lg p-4">
                        <p className="text-white text-sm">❓ {q}</p>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'red_flags' && (
                  <div className="space-y-3">
                    {interviewPrep.red_flags.map((flag: string, i: number) => (
                      <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <p className="text-red-400 text-sm">🚩 {flag}</p>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => setInterviewPrep(null)} className="mt-4 w-full bg-gray-800 hover:bg-gray-700 text-sm py-2 rounded-lg transition text-gray-400">Regenerate</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {notesApp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">📝 Notes — {notesApp.company_name}</h2>
              <button onClick={() => { setNotesApp(null); setNotes([]) }} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="flex gap-2 mb-4">
              <textarea
                placeholder="Add a note — interview feedback, follow-up reminder, contact info..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                rows={2}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 resize-none"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote() } }}
              />
              <button onClick={addNote} disabled={savingNote || !newNote.trim()} className="bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 rounded-lg transition disabled:opacity-50 self-end py-2">
                Add
              </button>
            </div>
            {notes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-2xl mb-2">📝</p>
                <p className="text-sm">No notes yet. Add your first note above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map(note => (
                  <div key={note.id} className="bg-gray-800 rounded-lg p-4 group">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-gray-300 text-sm leading-relaxed flex-1">{note.content}</p>
                      <button onClick={() => deleteNote(note.id)} className="text-gray-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100 text-xs flex-shrink-0">✕</button>
                    </div>
                    <p className="text-gray-600 text-xs mt-2">{formatDate(note.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map(stat => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className="text-3xl font-semibold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-medium">Applications</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : apps.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-medium text-gray-300">No applications yet</p>
              <button onClick={() => setShowForm(true)} className="mt-4 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition">+ Add Application</button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Applied</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map(app => (
                  <tr key={app.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                    <td className="px-6 py-4 font-medium">{app.company_name}</td>
                    <td className="px-6 py-4 text-gray-400">{app.job_title}</td>
                    <td className="px-6 py-4">
                      <select value={app.status} disabled={updatingId === app.id} onChange={e => updateStatus(app.id, e.target.value)} className={`text-xs px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${statusColors[app.status] || 'bg-gray-700 text-gray-300'}`}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{app.applied_date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {app.job_description && (
                          <button onClick={() => analyzeExisting(app)} className="text-xs text-violet-400 hover:text-violet-300 transition">🤖 Analyze</button>
                        )}
                        <button onClick={() => { setCoverLetterApp(app); setCoverLetter('') }} className="text-xs text-green-400 hover:text-green-300 transition">✍️ Letter</button>
                        <button onClick={() => { setInterviewApp(app); setInterviewPrep(null) }} className="text-xs text-yellow-400 hover:text-yellow-300 transition">🎯 Prep</button>
                        <button onClick={() => { setNotesApp(app); fetchNotes(app.id) }} className="text-xs text-blue-400 hover:text-blue-300 transition">📝 Notes</button>
                        <button onClick={() => deleteApp(app.id)} disabled={deletingId === app.id} className="text-xs text-red-400 hover:text-red-300 transition disabled:opacity-50">
                          {deletingId === app.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}