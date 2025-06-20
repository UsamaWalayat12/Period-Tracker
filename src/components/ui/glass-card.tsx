import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, className, onClick }: GlassCardProps) {
  const { theme } = useAppPreferences();

  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div 
      className={cn(
        isDarkMode ? "glass-card-dark" : "glass-card",
        "p-5 transition-all duration-300 hover:shadow-xl", 
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
