import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button 
      onClick={toggleTheme}
      variant="ghost" 
      size="sm" 
      className="card-standard border border-border/50 opacity-50 cursor-not-allowed w-10 h-10 p-0"
      data-testid="theme-toggle"
      disabled={true}
      title="Dark mode is disabled"
    >
      <Sun className="w-4 h-4 text-muted-foreground" />
    </Button>
  );
}