import { Skeleton } from "@/components/ui/skeleton";

export default function EmergenciesLoading() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="py-6 space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-lg" />
        ))}
      </div>

      {/* Emergency Cards Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div 
            key={i} 
            className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div>
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
