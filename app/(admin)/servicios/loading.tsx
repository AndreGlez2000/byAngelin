export default function Loading() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      <div className="px-4 md:px-6 py-4 border-b border-olive/10 bg-parchment flex items-center justify-between shrink-0">
        <div>
          <div className="h-7 w-48 bg-olive/10 rounded-lg" />
          <div className="h-3 w-24 bg-olive/5 rounded mt-1" />
        </div>
      </div>
      <div className="flex-1 p-6 space-y-6">
        <div className="h-3 w-20 bg-olive/5 rounded" />
        <div className="bg-white rounded-xl shadow-card h-48" />
        <div className="h-3 w-28 bg-olive/5 rounded" />
        <div className="bg-white rounded-xl shadow-card h-32" />
      </div>
    </div>
  )
}
