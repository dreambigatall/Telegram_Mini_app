import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showPageInput?: boolean;
}

/**
 * Pagination Component
 * Reusable pagination controls for list pages
 */
export const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showPageInput = false,
}: PaginationProps) => {
  // Calculate display range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Don't show pagination if only one page or no items
  if (totalPages <= 1 || totalItems === 0) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Item Count */}
      <p className="text-sm text-gray-600">
        Showing <span className="font-semibold">{startItem}</span> to{' '}
        <span className="font-semibold">{endItem}</span> of{' '}
        <span className="font-semibold">{totalItems}</span> items
      </p>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
          <span className="text-sm font-medium">Prev</span>
        </button>

        {/* Page Info */}
        <div className="flex items-center gap-2 px-4">
          {showPageInput ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={handlePageInput}
                className="w-16 px-2 py-1 text-center border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-sm text-gray-600">of {totalPages}</span>
            </div>
          ) : (
            <span className="text-sm font-medium text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
          aria-label="Next page"
        >
          <span className="text-sm font-medium">Next</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

