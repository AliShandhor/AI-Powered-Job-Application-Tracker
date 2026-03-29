'use client'
import { useState, useEffect } from 'react'

type Application = {
  id: string
  company_name: string
  job_title: string
  status: string
  applied_date: string
  job_description?: string
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
  const [form, setForm] = useState({
    company_name: '',
    job_title: '',
    status: 'applied',
    applied_date: '',
    job_description: ''
  })

  useEffect(() => { fetchApps() }, [])

  async function fetchApps() {
    const res = await fetch('http://localhost:8000/api/v1/applications/')
    const data = await res.json()
    setApps(data)
    setLoading(false)
  }

  async function addApp() {
    await fetch('http://localhost:8000/api/v1/applications/', {
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
    await fetch(`http://localhost:8000/api/v1/applications/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    fetchApps()
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id)
    await fetch(`http://localhost:8000/api/v1/applications/${id}`, {
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
    const res = await fetch('http://localhost:8000/api/v1/ai/analyze-job', {
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
    const res = await fetch('http://localhost:8000/api/v1/ai/analyze-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_description: app.job_description })
    })
    const data = await res.json()
    setAnalysis(data)
    setAnalyzing(false)
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
        <span className="text-lg font-semibold text-violet-400">JobTracker AI</span>
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
              <input
                placeholder="Company name"
                value={form.company_name}
                onChange={e => setForm({ ...form, company_name: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
              <input
                placeholder="Job title"
                value={form.job_title}
                onChange={e => setForm({ ...form, job_title: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <input
                type="date"
                value={form.applied_date}
                onChange={e => setForm({ ...form, applied_date: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <textarea
              placeholder="Paste job description here for AI analysis (optional)..."
              value={form.job_description}
              onChange={e => setForm({ ...form, job_description: e.target.value })}
              rows={5}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 resize-none mb-3"
            />

            {form.job_description.length >= 50 && !analysis && (
              <button
                onClick={analyzeJob}
                disabled={analyzing}
                className="w-full bg-violet-900/50 hover:bg-violet-800/50 border border-violet-700 text-violet-300 text-sm py-2 rounded-lg transition mb-3 disabled:opacity-50"
              >
                {analyzing ? '🤖 Analyzing...' : '🤖 Analyze with AI'}
              </button>
            )}

            {analysis && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-3 text-sm">
                <p className="text-violet-400 font-medium mb-3">AI Analysis</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Seniority</p>
                    <p className="text-white capitalize">{analysis.seniority_level} · {analysis.estimated_yoe}+ yrs</p>
                  </div>
                  {analysis.compensation && (
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Compensation</p>
                      <p className="text-white">${analysis.compensation.min / 1000}k – ${analysis.compensation.max / 1000}k</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs mb-1">Required Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.required_skills.map(s => (
                        <span key={s} className="bg-blue-500/10 text-blue-400 text-xs px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                  {analysis.preferred_skills.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-gray-400 text-xs mb-1">Nice to Have</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.preferred_skills.map(s => (
                          <span key={s} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs mb-1">Culture</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.culture_signals.map(s => (
                        <span key={s} className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
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

      {/* AI Analysis Panel for existing app */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">AI Analysis — {selectedApp.company_name}</h2>
              <button onClick={() => { setSelectedApp(null); setAnalysis(null) }} className="text-gray-400 hover:text-white">✕</button>
            </div>
            {analyzing && <p className="text-gray-400 text-sm text-center py-8">🤖 Analyzing job description...</p>}
            {analysis && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Seniority</p>
                    <p className="text-white capitalize font-medium">{analysis.seniority_level}</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Experience</p>
                    <p className="text-white font-medium">{analysis.estimated_yoe}+ years</p>
                  </div>
                </div>
                {analysis.compensation && (
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Compensation</p>
                    <p className="text-green-400 font-medium">${analysis.compensation.min.toLocaleString()} – ${analysis.compensation.max.toLocaleString()} {analysis.compensation.currency}</p>
                  </div>
                )}
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.required_skills.map(s => (
                      <span key={s} className="bg-blue-500/10 text-blue-400 text-xs px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
                {analysis.preferred_skills.length > 0 && (
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-2">Nice to Have</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.preferred_skills.map(s => (
                        <span key={s} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-2">Key Requirements</p>
                  <ul className="space-y-1">
                    {analysis.key_requirements.map(r => (
                      <li key={r} className="text-gray-300 text-xs flex gap-2"><span className="text-violet-400">→</span>{r}</li>
                    ))}
                  </ul>
                </div>
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
                      <select
                        value={app.status}
                        disabled={updatingId === app.id}
                        onChange={e => updateStatus(app.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${statusColors[app.status] || 'bg-gray-700 text-gray-300'}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{app.applied_date}</td>
                    <td className="px-6 py-4 flex items-center gap-3">
                      {app.job_description && (
                        <button
                          onClick={() => analyzeExisting(app)}
                          className="text-xs text-violet-400 hover:text-violet-300 transition"
                        >
                          🤖 Analyze
                        </button>
                      )}
                      <button
                        onClick={() => deleteApp(app.id)}
                        disabled={deletingId === app.id}
                        className="text-xs text-red-400 hover:text-red-300 transition disabled:opacity-50"
                      >
                        {deletingId === app.id ? 'Deleting...' : 'Delete'}
                      </button>
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