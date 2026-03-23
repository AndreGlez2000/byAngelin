export default function Loading() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      <div className="px-4 md:px-6 py-4 border-b border-olive/10 bg-parchment flex items-center justify-between shrink-0">
        <div>
          <div className="h-7 w-32 bg-olive/10 rounded-lg" />
          <div className="h-3 w-20 bg-olive/5 rounded mt-1" />
        </div>
      </div>
      <div className="flex-1 p-4 md:p-6 space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-card h-16" />
        ))}
      </div>
    </div>
  )
}
