export default function Loading() {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 space-y-4 animate-pulse">
      <div className="h-5 w-20 bg-olive/5 rounded" />
      <div className="h-8 w-48 bg-olive/10 rounded-lg" />
      <div className="h-4 w-32 bg-olive/5 rounded" />
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 w-20 bg-olive/5 rounded-lg" />
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-card h-64" />
    </div>
  )
}
