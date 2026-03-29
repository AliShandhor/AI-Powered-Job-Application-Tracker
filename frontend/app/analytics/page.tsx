'use client'
import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid
} from 'recharts'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Application = {
  id: string
  company_name: string
  job_title: string
  status: string
  applied_date: string
}

const STATUS_COLORS: Record<string, string> = {
  applied: '#60a5fa',
  screening: '#f59e0b',
  interview: '#a78bfa',
  offer: '#34d399',
  rejected: '#f87171',
  withdrawn: '#6b7280',
}

export default function Analytics() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/v1/applications/`)
      .then(r => r.json())
      .then(data => { setApps(data); setLoading(false) })
  }, [])

  if (loading) return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">Loading analytics...</p>
    </main>
  )

  // Status breakdown for pie chart
  const statusCounts = apps.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // Applications over time for line chart
  const byDate = apps.reduce((acc, app) => {
    const date = app.applied_date.slice(0, 7) // YYYY-MM
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const lineData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  // Top companies
  const companyCounts = apps.reduce((acc, app) => {
    acc[app.company_name] = (acc[app.company_name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const barData = Object.entries(companyCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  // Key metrics
  const total = apps.length
  const interviews = apps.filter(a => ['interview', 'offer'].includes(a.status)).length
  const offers = apps.filter(a => a.status === 'offer').length
  const rejected = apps.filter(a => a.status === 'rejected').length
  const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0
  const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0
  const rejectRate = total > 0 ? Math.round((rejected / total) * 100) : 0

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="text-gray-400 hover:text-white text-sm transition">← Back</a>
          <span className="text-lg font-semibold text-violet-400">Analytics</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Applied', value: total, color: 'text-white' },
            { label: 'Interview Rate', value: `${interviewRate}%`, color: 'text-purple-400' },
            { label: 'Offer Rate', value: `${offerRate}%`, color: 'text-green-400' },
            { label: 'Rejection Rate', value: `${rejectRate}%`, color: 'text-red-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className={`text-3xl font-semibold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Status Breakdown */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-medium mb-4 text-sm text-gray-400 uppercase tracking-wider">Status Breakdown</h3>
            {pieData.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                      formatter={(value, name) => [value, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pieData.map(entry => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[entry.name] || '#6b7280' }} />
                      <span className="text-xs text-gray-400 capitalize">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Applications Over Time */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-medium mb-4 text-sm text-gray-400 uppercase tracking-wider">Applications Over Time</h3>
            {lineData.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                  <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Companies */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-medium mb-4 text-sm text-gray-400 uppercase tracking-wider">Applications by Company</h3>
          {barData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="count" fill="#6c63ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </main>
  )
}