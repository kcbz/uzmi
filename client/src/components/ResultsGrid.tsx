import { Checkbox } from "@/components/ui/checkbox";
import MediaCard from "./MediaCard";
import { Skeleton } from "@/components/ui/skeleton";

export interface Result {
  title: string;
  link: string;
  thumbnailUrl: string;
  sourceLink: string;
  downloadLink: string;
  isImage: boolean;
  pagemap?: {
    videoobject?: Array<{
      thumbnailurl?: string;
      duration?: string;
    }>;
    cse_image?: Array<{
      src: string;
    }>;
    cse_thumbnail?: Array<{
      src: string;
    }>;
  };
}

interface ResultsGridProps {
  results: Result[];
  isLoading: boolean;
  error: Error | null;
  selectedItems: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
}

export default function ResultsGrid({
  results,
  isLoading,
  error,
  selectedItems,
  onSelectionChange,
}: ResultsGridProps) {
  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        Error loading results: {error.message}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const toggleItem = (link: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(link)) {
      newSelected.delete(link);
    } else {
      newSelected.add(link);
    }
    onSelectionChange(newSelected);
  };

  const toggleAll = () => {
    if (selectedItems.size === results.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(results.map(r => r.link)));
    }
  };

  if (results.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        No results found. Try a different search term.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={selectedItems.size === results.length}
          onCheckedChange={toggleAll}
          id="select-all"
        />
        <label htmlFor="select-all" className="text-sm">
          Select All
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {results.map((result) => (
          <MediaCard
            key={result.link}
            result={result}
            isSelected={selectedItems.has(result.link)}
            onToggleSelect={() => toggleItem(result.link)}
          />
        ))}
      </div>
    </div>
  );
}
