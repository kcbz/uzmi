import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchMedia } from "@/lib/api";
import SearchBar from "@/components/SearchBar";
import MediaTypeSelector from "@/components/MediaTypeSelector";
import ResultsGrid from "@/components/ResultsGrid";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export type MediaType = "images" | "videos" | "both";

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("both");
  const [resultCount, setResultCount] = useState([10]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["media", searchTerm, mediaType, resultCount[0]],
    queryFn: () => searchMedia(searchTerm, mediaType, resultCount[0]),
    enabled: searchTerm.length > 0,
  });

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setSelectedItems(new Set());
  };

  const handleDownloadAll = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to download",
        variant: "destructive",
      });
      return;
    }

    try {
      const itemsToDownload = data?.items.filter(item => 
        selectedItems.has(item.link)
      ) || [];

      for (const item of itemsToDownload) {
        const response = await fetch(`/api/download?url=${encodeURIComponent(item.link)}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: "Download complete",
        description: `Successfully downloaded ${selectedItems.size} items`,
      });
    } catch (err) {
      toast({
        title: "Download failed",
        description: "There was an error downloading the selected items",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
        Media Search
      </h1>

      <div className="space-y-6">
        <SearchBar onSearch={handleSearch} />

        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <div className="w-full sm:w-1/3">
            <MediaTypeSelector value={mediaType} onChange={setMediaType} />
          </div>

          <div className="w-full sm:w-2/3">
            <Label>Number of results: {resultCount[0]}</Label>
            <Slider
              value={resultCount}
              onValueChange={setResultCount}
              max={20}
              min={1}
              step={1}
              className="mt-2"
            />
          </div>
        </div>

        {selectedItems.size > 0 && (
          <div className="flex justify-between items-center p-4 bg-secondary/10 rounded-lg">
            <span>{selectedItems.size} items selected</span>
            <Button onClick={handleDownloadAll}>
              Download Selected
            </Button>
          </div>
        )}

        <ResultsGrid
          results={data?.items || []}
          isLoading={isLoading}
          error={error}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
        />
      </div>
    </div>
  );
}
