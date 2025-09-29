import { useState, useEffect } from 'react';
import { Institution } from '@shared/schema';

interface InstitutionContext {
  currentInstitution: Institution | null;
  isInInstitutionContext: boolean;
  setCurrentInstitution: (institution: Institution | null) => void;
  clearInstitutionContext: () => void;
  enterInstitution: (institution: Institution) => void;
  exitInstitution: () => void;
}

export const useInstitutionContext = (): InstitutionContext => {
  const [currentInstitution, setCurrentInstitution] = useState<Institution | null>(null);

  useEffect(() => {
    // Verificar si hay una institución seleccionada al cargar
    const savedInstitution = localStorage.getItem('selectedInstitution');
    if (savedInstitution) {
      try {
        const institution = JSON.parse(savedInstitution);
        setCurrentInstitution(institution);
      } catch (error) {
        console.error('Error parsing saved institution:', error);
        localStorage.removeItem('selectedInstitution');
      }
    }
  }, []);

  const enterInstitution = (institution: Institution) => {
    setCurrentInstitution(institution);
    localStorage.setItem('selectedInstitution', JSON.stringify(institution));
    
    // Aplicar branding
    applyInstitutionBranding(institution);
  };

  const exitInstitution = () => {
    // Restaurar tema original
    restoreOriginalBranding();
    
    // Limpiar contexto
    setCurrentInstitution(null);
    localStorage.removeItem('selectedInstitution');
    localStorage.removeItem('originalTheme');
  };

  const clearInstitutionContext = () => {
    exitInstitution();
  };

  const applyInstitutionBranding = (institution: Institution) => {
    const root = document.documentElement;
    
    // Guardar colores originales
    const originalTheme = {
      primary: getComputedStyle(root).getPropertyValue('--primary').trim(),
      primaryForeground: getComputedStyle(root).getPropertyValue('--primary-foreground').trim()
    };
    localStorage.setItem('originalTheme', JSON.stringify(originalTheme));

    // Aplicar colores de la institución
    if (institution.primaryColor) {
      // Convertir hex a HSL para CSS variables
      const primaryHSL = hexToHSL(institution.primaryColor);
      root.style.setProperty('--primary', primaryHSL);
    }
  };

  const restoreOriginalBranding = () => {
    const originalTheme = localStorage.getItem('originalTheme');
    if (originalTheme) {
      try {
        const theme = JSON.parse(originalTheme);
        const root = document.documentElement;
        root.style.setProperty('--primary', theme.primary);
        root.style.setProperty('--primary-foreground', theme.primaryForeground);
      } catch (error) {
        console.error('Error restoring original theme:', error);
      }
    }
  };

  // Función auxiliar para convertir HEX a HSL
  const hexToHSL = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;
    const l = sum / 2;

    let h = 0;
    let s = 0;

    if (diff !== 0) {
      s = l > 0.5 ? diff / (2 - sum) : diff / sum;

      switch (max) {
        case r:
          h = ((g - b) / diff) + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / diff + 2;
          break;
        case b:
          h = (r - g) / diff + 4;
          break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  return {
    currentInstitution,
    isInInstitutionContext: !!currentInstitution,
    setCurrentInstitution,
    clearInstitutionContext,
    enterInstitution,
    exitInstitution
  };
};