export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6 2xl:max-w-[1800px]">
      <div className="space-y-2">
        <div className="h-8 w-40 rounded-md bg-muted md:h-10 md:w-48" />
        <div className="h-4 w-64 max-w-full rounded-md bg-muted" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-4 w-4 rounded bg-muted" />
            </div>
            <div className="h-8 w-20 rounded bg-muted" />
            <div className="mt-2 h-3 w-24 rounded bg-muted" />
          </div>
        ))}
        <div className="rounded-xl border p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-4 w-4 rounded bg-muted" />
          </div>
          <div className="h-8 w-20 rounded bg-muted" />
          <div className="mt-2 h-3 w-24 rounded bg-muted" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border p-4">
          <div className="mb-2 h-5 w-40 rounded bg-muted" />
          <div className="mb-4 h-4 w-56 rounded bg-muted" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-md border p-3">
                <div className="mb-2 flex justify-between gap-2">
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
                <div className="h-3 w-full rounded bg-muted" />
                <div className="mt-2 h-3 w-20 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="mb-2 h-5 w-32 rounded bg-muted" />
          <div className="mb-4 h-4 w-40 rounded bg-muted" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-10 rounded-md bg-muted" />
            <div className="h-10 rounded-md bg-muted" />
            <div className="h-10 rounded-md bg-muted" />
            <div className="h-10 rounded-md bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}
