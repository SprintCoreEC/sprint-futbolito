import { useEffect } from "react";
import { useSystemConfig } from "@/hooks/use-system-config";

// Función para convertir color hex a HSL
function hexToHsl(hex: string): string {
  // Remover el # si existe
  hex = hex.replace('#', '');
  
  // Convertir a RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Convertir a grados y porcentajes
  const hDeg = Math.round(h * 360);
  const sPerc = Math.round(s * 100);
  const lPerc = Math.round(l * 100);

  return `${hDeg}, ${sPerc}%, ${lPerc}%`;
}

export function DynamicTheme() {
  const { primaryColor, secondaryColor } = useSystemConfig();

  useEffect(() => {
    if (primaryColor && secondaryColor) {
      const root = document.documentElement;
      
      // Convertir colores hex a HSL para CSS variables
      const primaryHsl = hexToHsl(primaryColor);
      const secondaryHsl = hexToHsl(secondaryColor);
      
      // Aplicar colores primarios
      root.style.setProperty('--primary', `hsl(${primaryHsl})`);
      root.style.setProperty('--ring', `hsl(${primaryHsl})`);
      root.style.setProperty('--sidebar-primary', `hsl(${primaryHsl})`);
      root.style.setProperty('--sidebar-accent-foreground', `hsl(${primaryHsl})`);
      root.style.setProperty('--sidebar-ring', `hsl(${primaryHsl})`);
      
      // Para modo oscuro, ajustar colores primarios
      const darkRoot = document.querySelector('.dark') || document.documentElement;
      if (document.documentElement.classList.contains('dark')) {
        darkRoot.style?.setProperty?.('--primary', `hsl(${primaryHsl})`);
        darkRoot.style?.setProperty?.('--ring', `hsl(${primaryHsl})`);
      }
    }
  }, [primaryColor, secondaryColor]);

  return null; // Este componente no renderiza nada visible
}