interface FormSkeletonProps {
  fields?: number;
  showSubmitButton?: boolean;
}

export default function FormSkeleton({ fields = 4, showSubmitButton = true }: FormSkeletonProps) {
  return (
    <div className="space-y-6 animate-pulse" data-testid="form-skeleton">
      {/* Form Header */}
      <div className="space-y-2">
        <div className="h-6 bg-muted rounded w-1/3"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
      </div>
      
      {/* Form Fields */}
      {Array.from({ length: fields }).map((_, index) => (
        <div key={`field-${index}`} className="space-y-2">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-10 bg-muted rounded w-full"></div>
        </div>
      ))}
      
      {/* Submit Button */}
      {showSubmitButton && (
        <div className="pt-4">
          <div className="h-11 bg-primary/20 rounded w-32"></div>
        </div>
      )}
    </div>
  );
}