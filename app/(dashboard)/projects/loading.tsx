export default function ProjectsLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6 2xl:max-w-[1800px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 rounded-md bg-muted" />
          <div className="h-4 w-56 rounded-md bg-muted" />
        </div>
        <div className="h-10 w-full rounded-lg bg-muted sm:w-36" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-4 rounded-xl border border-border/80 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="h-5 flex-1 rounded bg-muted" />
              <div className="h-6 w-20 shrink-0 rounded-full bg-muted" />
            </div>
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-[85%] rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
