export default function Loading() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      <div className="px-4 md:px-6 py-4 border-b border-olive/10 bg-parchment flex items-center justify-between shrink-0">
        <div className="h-7 w-40 bg-olive/10 rounded-lg" />
      </div>
      <div className="flex-1 p-4 md:p-6">
        <div className="bg-white rounded-xl shadow-card h-96" />
      </div>
    </div>
  )
}
