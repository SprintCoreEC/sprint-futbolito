import { useEffect } from "react";
import { useRoute } from "wouter";
import { useInstitutionContext } from "@/hooks/use-institution-context";

export default function InstitutionDashboard() {
  const [match, params] = useRoute("/institution/:id/dashboard");
  const { currentInstitution } = useInstitutionContext();

  useEffect(() => {
    // Redirigir al dashboard principal que ahora maneja el contexto institucional
    if (currentInstitution && match) {
      window.location.href = '/dashboard';
    }
  }, [currentInstitution, match]);

  // Mostrar una pantalla de carga mientras redirigimos
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirigiendo al dashboard institucional...</p>
      </div>
    </div>
  );
}