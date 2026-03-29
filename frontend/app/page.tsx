'use client'
import { useState, useEffect } from 'react'

type Application = {
  id: string
  company_name: string
  job_title: string
  status: string
  applied_date: string
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
  const [form, setForm] = useState({
    company_name: '',
    job_title: '',
    status: 'applied',
    applied_date: ''
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
    setForm({ company_name: '', job_title: '', status: 'applied', applied_date: '' })
    fetchApps()
  }

  async function deleteApp(id: string) {
    if (!confirm('Delete this application?')) return
    setDeletingId(id)
    await fetch(`http://localhost:8000/api/v1/applications/${id}`, {
      method: 'DELETE'
    })
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
        <button
          onClick={() => setShowForm(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition"
        >
          + Add Application
        </button>
      </nav>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">New Application</h2>
            <div className="space-y-3">
              <input
                placeholder="Company name"
                value={form.company_name}
                onChange={e => setForm({ ...form, company_name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
              <input
                placeholder="Job title"
                value={form.job_title}
                onChange={e => setForm({ ...form, job_title: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <input
                type="date"
                value={form.applied_date}
                onChange={e => setForm({ ...form, applied_date: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={addApp}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm py-2 rounded-lg transition"
              >
                Save
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-sm py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
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
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition"
              >
                + Add Application
              </button>
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
                    <td className="px-6 py-4">
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