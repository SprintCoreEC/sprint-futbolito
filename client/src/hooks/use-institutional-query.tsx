import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useInstitutionContext } from "./use-institution-context";

/**
 * Hook personalizado para queries que necesitan contexto institucional
 * Automáticamente agrega contextInstitutionId cuando el usuario está dentro de una institución
 */
export function useInstitutionalQuery<T = unknown>(
  baseQueryKey: string,
  options?: Omit<UseQueryOptions<T>, 'queryKey'>
) {
  const { currentInstitution } = useInstitutionContext();
  
  // Construir la query key con el contexto institucional
  let queryKey = baseQueryKey;
  if (currentInstitution) {
    const separator = baseQueryKey.includes('?') ? '&' : '?';
    queryKey = `${baseQueryKey}${separator}contextInstitutionId=${currentInstitution.id}`;
  }
  
  return useQuery<T>({
    queryKey: [queryKey],
    ...options
  });
}