export default function CampaignCardSkeleton() {
  return (
    <div className="campaign-card animate-pulse">
      {/* Image Skeleton */}
      <div className="campaign-image bg-muted rounded-lg"></div>
      
      {/* Badge Area Skeleton */}
      <div className="absolute top-2 right-2 flex flex-col gap-1.5">
        <div className="w-16 h-5 bg-muted rounded-md"></div>
      </div>
      
      {/* Content Skeleton */}
      <div className="campaign-content space-y-3">
        {/* Title */}
        <div className="h-5 bg-muted rounded w-3/4"></div>
        
        {/* Description */}
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded w-full"></div>
          <div className="h-3 bg-muted rounded w-2/3"></div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full w-full"></div>
          <div className="flex justify-between">
            <div className="h-3 bg-muted rounded w-16"></div>
            <div className="h-3 bg-muted rounded w-12"></div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-8"></div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-12"></div>
            </div>
          </div>
          <div className="w-8 h-8 bg-muted rounded-full"></div>
        </div>
      </div>
    </div>
  );
}