import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MediaCardProps {
  result: {
    title: string;
    link: string;
    thumbnailUrl: string;
    pagemap?: {
      videoobject?: Array<{ duration?: string }>;
    };
  };
  isSelected: boolean;
  onToggleSelect: () => void;
}

export default function MediaCard({
  result,
  isSelected,
  onToggleSelect,
}: MediaCardProps) {
  const { toast } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);
  const isVideo = Boolean(result.pagemap?.videoobject);

  const handleDownload = async () => {
    try {
      toast({
        title: "Download started",
        description: `Starting ${isVideo ? "video" : "image"} download...`,
      });

      const response = await fetch(
        `/api/download?url=${encodeURIComponent(result.link)}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const contentType = response.headers.get("content-type");
      const extension = contentType?.includes("video")
        ? ".mp4"
        : contentType?.includes("image")
        ? ".jpg"
        : "";

      a.download = `${result.title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download complete",
        description: `${isVideo ? "Video" : "Image"} downloaded successfully`,
      });
    } catch (err) {
      console.error("Download error:", err);
      toast({
        title: "Download failed",
        description:
          err instanceof Error ? err.message : "There was an error downloading the file",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0 relative">
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
          />
        </div>
        <img
          src={result.thumbnailUrl}
          alt={result.title}
          className={`w-full h-48 object-cover transition-opacity duration-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.currentTarget.src = '/placeholder.png';
            setImageLoaded(true);
          }}
        />
        {result.pagemap?.videoobject && (
          <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-xs">
            {result.pagemap.videoobject[0].duration || 'Video'}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 p-4">
        <h3 className="text-sm font-medium line-clamp-2">{result.title}</h3>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleDownload}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
}
