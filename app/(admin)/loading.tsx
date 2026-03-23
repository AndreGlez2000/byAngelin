export default function Loading() {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 space-y-4 animate-pulse">
      <div className="h-8 w-40 bg-olive/10 rounded-lg" />
      <div className="h-4 w-24 bg-olive/5 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-card px-4 py-6 h-24" />
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-card h-64" />
    </div>
  )
}
