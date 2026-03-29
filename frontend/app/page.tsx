export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-semibold text-violet-400">JobTracker AI</span>
        <button className="bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition">
          + Add Application
        </button>
      </nav>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Applied', value: '0' },
            { label: 'In Progress', value: '0' },
            { label: 'Interviews', value: '0' },
            { label: 'Offers', value: '0' },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className="text-3xl font-semibold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-medium">Applications</h2>
            <input placeholder="Search..." className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none focus:border-violet-500 w-48" />
          </div>
          <div className="p-12 text-center text-gray-500">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium text-gray-300">No applications yet</p>
            <p className="text-sm mt-1">Add your first job application to get started</p>
            <button className="mt-4 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition">
              + Add Application
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}