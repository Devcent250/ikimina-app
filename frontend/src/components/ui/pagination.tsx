import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage = 1,
  totalPages = 10,
  onPageChange = () => {},
  className = "",
}: PaginationProps) {
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 7;
    const ellipsis = "...";

    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pageNumbers.push(1);

    if (currentPage > 3) {
      pageNumbers.push(ellipsis);
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (currentPage < totalPages - 2) {
      pageNumbers.push(ellipsis);
    }

    pageNumbers.push(totalPages);

    return pageNumbers;
  };

  return (
    <nav
      className={`flex items-center justify-center space-x-2 ${className}`}
      aria-label="Pagination"
    >
      <Button
        className="h-8 w-8"
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {getPageNumbers().map((pageNumber, index) =>
        pageNumber === "..." ? (
          <span key={`ellipsis-${index}`} className="px-2">
            <MoreHorizontal className="h-4 w-4" />
          </span>
        ) : (
          <Button
            className="h-8 w-8"
            key={pageNumber}
            variant={currentPage === pageNumber ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(pageNumber as number)}
            aria-label={`Page ${pageNumber}`}
            aria-current={currentPage === pageNumber ? "page" : undefined}
          >
            {pageNumber}
          </Button>
        )
      )}
      <Button
        className="h-8 w-8"
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
