export default function FinanceLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-8 2xl:max-w-[1800px]">
      <div className="flex flex-col gap-6 border-b border-border/60 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="h-9 w-56 rounded-md bg-muted md:w-72" />
          <div className="h-4 w-64 max-w-full rounded-md bg-muted" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="h-10 w-full rounded-lg bg-muted sm:w-32" />
          <div className="h-10 w-full rounded-lg bg-muted sm:w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border/80 p-4">
            <div className="flex justify-between">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-8 w-8 rounded-lg bg-muted" />
            </div>
            <div className="h-8 w-36 rounded bg-muted" />
            <div className="h-3 w-28 rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[280px] rounded-xl border border-border/80 bg-muted/30"
          />
        ))}
      </div>

      <div className="rounded-xl border border-border/80 p-4">
        <div className="mb-4 h-6 w-32 rounded bg-muted" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-3 border-b border-border/40 py-3 last:border-0"
            >
              <div className="h-4 flex-1 min-w-[120px] rounded bg-muted" />
              <div className="h-6 w-16 rounded-full bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 flex-1 min-w-[100px] rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
