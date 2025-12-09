/**
 * Skeleton Loading Components
 * Provides shimmer loading states for better perceived performance
 */

interface SkeletonProps {
  className?: string;
}

// Base skeleton with shimmer animation
export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div 
    className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded ${className}`}
    style={{ animation: 'shimmer 1.5s infinite' }}
  />
);

// Product card skeleton for FeedPage grid
export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    {/* Image placeholder */}
    <Skeleton className="h-32 w-full rounded-none" />
    
    {/* Content */}
    <div className="p-3 space-y-2">
      {/* Title */}
      <Skeleton className="h-4 w-3/4" />
      
      {/* Price */}
      <Skeleton className="h-3 w-1/3" />
      
      {/* Buttons */}
      <div className="flex gap-2 mt-3">
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="h-8 flex-1 rounded-md" />
      </div>
    </div>
  </div>
);

// Feed page skeleton (2-column grid)
export const FeedPageSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-2 gap-3">
    {Array.from({ length: count }).map((_, index) => (
      <ProductCardSkeleton key={index} />
    ))}
  </div>
);

// Admin product card skeleton (full width)
export const AdminProductSkeleton = () => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
    {/* Header */}
    <div className="flex justify-between items-start mb-3">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-5 w-16" />
    </div>
    
    {/* Seller info */}
    <Skeleton className="h-3 w-1/3 mb-3" />
    
    {/* Tags */}
    <div className="flex gap-2 mb-3">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
    
    {/* Description */}
    <Skeleton className="h-16 w-full mb-4 rounded-lg" />
    
    {/* Image carousel placeholder */}
    <div className="flex gap-3 overflow-hidden mb-4">
      <Skeleton className="flex-shrink-0 w-64 h-56 rounded-xl" />
      <Skeleton className="flex-shrink-0 w-64 h-56 rounded-xl" />
    </div>
    
    {/* Buttons */}
    <div className="flex gap-3">
      <Skeleton className="h-10 flex-1 rounded-xl" />
      <Skeleton className="h-10 flex-1 rounded-xl" />
    </div>
  </div>
);

// Admin page skeleton (list of cards)
export const AdminPageSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <AdminProductSkeleton key={index} />
    ))}
  </div>
);

// Add shimmer keyframes to index.css or use this inline style
export const shimmerStyles = `
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;


