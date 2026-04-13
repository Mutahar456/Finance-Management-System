export default function InventoryLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6 2xl:max-w-[1800px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-md bg-muted" />
          <div className="h-4 w-64 rounded-md bg-muted" />
        </div>
        <div className="h-10 w-full rounded-lg bg-muted sm:w-40" />
      </div>

      <div className="rounded-xl border border-border/80">
        <div className="grid grid-cols-6 gap-4 border-b border-border/60 bg-muted/40 p-4 [&>div]:h-4 [&>div]:rounded [&>div]:bg-muted">
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
        </div>
        <div className="divide-y divide-border/60">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="grid grid-cols-6 items-center gap-4 p-4 [&>div]:h-4 [&>div]:rounded [&>div]:bg-muted/80"
            >
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
