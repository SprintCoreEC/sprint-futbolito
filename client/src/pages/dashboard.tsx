import { useAuth } from "@/lib/auth";
import SuperAdminDashboard from "./super-admin-dashboard";
import InstitutionSpecificDashboard from "./institution-specific-dashboard";
import { useInstitutionContext } from "@/hooks/use-institution-context";

export default function Dashboard() {
  const { user } = useAuth();
  const { currentInstitution } = useInstitutionContext();
  
  // Si hay una institución seleccionada, mostrar dashboard institucional
  if (currentInstitution) {
    return <InstitutionSpecificDashboard />;
  }
  
  // Si es Super Admin sin institución, mostrar dashboard estratégico
  if (user?.role === 'super_admin') {
    return <SuperAdminDashboard />;
  }
  
  // Para otros roles, mostrar dashboard institucional por defecto
  return <InstitutionSpecificDashboard />;

}
