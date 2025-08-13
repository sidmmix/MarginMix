import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PlatformSelectionProps {
  onSelect: (platform: string) => void;
}

export function PlatformSelection({ onSelect }: PlatformSelectionProps) {
  const platforms = [
    {
      key: "Google Ads",
      label: "Google Ads",
      description: "Search & Display campaigns",
      icon: "fab fa-google",
      bgColor: "bg-red-500",
    },
    {
      key: "YouTube via DV360",
      label: "YouTube via DV360",
      description: "Video advertising platform",
      icon: "fab fa-youtube",
      bgColor: "bg-red-600",
    },
    {
      key: "Meta",
      label: "Meta",
      description: "Facebook & Instagram ads",
      icon: "fab fa-meta",
      bgColor: "bg-blue-600",
    },
    {
      key: "All of the above",
      label: "All of the Above",
      description: "Complete cross-platform strategy",
      icon: "fas fa-globe",
      bgColor: "bg-gradient-to-br from-primary to-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {platforms.map((platform) => (
        <Button
          key={platform.key}
          variant="outline"
          onClick={() => onSelect(platform.key)}
          className="p-4 h-auto border border-slate-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left justify-start"
        >
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${platform.bgColor} rounded-lg flex items-center justify-center`}>
              <i className={`${platform.icon} text-white`}></i>
            </div>
            <div>
              <p className="font-medium text-secondary">{platform.label}</p>
              <p className="text-xs text-slate-500">{platform.description}</p>
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
}