interface StatisticsSkeletonProps {
  count?: number;
}

export default function StatisticsSkeleton({ count = 3 }: StatisticsSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="statistics-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`stat-${index}`} className="card-standard p-6 animate-pulse">
          {/* Icon */}
          <div className="w-16 h-16 bg-primary/20 rounded-xl mx-auto mb-4"></div>
          
          {/* Title */}
          <div className="h-5 bg-muted rounded w-3/4 mx-auto mb-2"></div>
          
          {/* Value */}
          <div className="h-8 bg-muted rounded w-1/2 mx-auto mb-3"></div>
          
          {/* Description */}
          <div className="space-y-1">
            <div className="h-3 bg-muted rounded w-full"></div>
            <div className="h-3 bg-muted rounded w-2/3 mx-auto"></div>
          </div>
        </div>
      ))}
    </div>
  );
}