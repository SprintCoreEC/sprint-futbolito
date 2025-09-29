import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface BackButtonProps {
  to?: string;
  label?: string;
}

export function BackButton({ to = "/dashboard", label = "Volver al Dashboard" }: BackButtonProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation(to);
  };

  return (
    <Button
      variant="ghost"
      onClick={handleBack}
      className="mb-4 h-9 px-3"
      data-testid="button-back"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}