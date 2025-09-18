import CampaignCardSkeleton from './CampaignCardSkeleton';

interface CampaignGridSkeletonProps {
  count?: number;
}

export default function CampaignGridSkeleton({ count = 6 }: CampaignGridSkeletonProps) {
  return (
    <div className="campaign-grid" data-testid="campaign-grid-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <CampaignCardSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
}