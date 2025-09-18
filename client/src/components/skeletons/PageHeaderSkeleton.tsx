export default function PageHeaderSkeleton() {
  return (
    <section className="section-spacing-lg surface-secondary">
      <div className="container-main">
        <div className="text-center space-y-6 animate-pulse">
          {/* Icon */}
          <div className="w-16 h-16 bg-muted rounded-full mx-auto"></div>
          
          {/* Title */}
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
          </div>
        </div>
      </div>
    </section>
  );
}