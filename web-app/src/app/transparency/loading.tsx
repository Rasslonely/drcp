import { Skeleton } from "@/components/ui/skeleton";

export default function TransparencyLoading() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="py-6 space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        {/* Centered badge skeleton */}
        <div className="flex justify-center">
          <Skeleton className="h-10 w-48 rounded-full" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center space-x-4"
          >
            <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-7 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Fund Flow Skeleton */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>

      {/* Chart Skeleton */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-[350px] w-full rounded-xl" />
      </div>

      {/* Transactions Skeleton */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className="flex items-center justify-between p-3 rounded-xl bg-white/5"
          >
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-5 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
