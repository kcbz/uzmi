import { MediaType } from "@/pages/HomePage";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Image, Video, Layout } from "lucide-react";

interface MediaTypeSelectorProps {
  value: MediaType;
  onChange: (value: MediaType) => void;
}

export default function MediaTypeSelector({ value, onChange }: MediaTypeSelectorProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => {
        if (val) {
          onChange(val as MediaType);
        }
      }}
      className="justify-center"
    >
      <ToggleGroupItem value="images" aria-label="Images">
        <Image className="h-4 w-4 mr-2" />
        Images
      </ToggleGroupItem>
      <ToggleGroupItem value="videos" aria-label="Videos">
        <Video className="h-4 w-4 mr-2" />
        Videos
      </ToggleGroupItem>
      <ToggleGroupItem value="both" aria-label="Both">
        <Layout className="h-4 w-4 mr-2" />
        Both
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
