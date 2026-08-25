import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * Hook para hacer scroll automático al input cuando el teclado aparece
 * Soluciona el problema en PWA donde el teclado tapa el input
 */
export function useKeyboardScroll<T extends HTMLElement = HTMLInputElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleFocus = () => {
      // Pequeño delay para que el teclado termine de aparecer
      setTimeout(() => {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 300);
    };

    element.addEventListener('focus', handleFocus);
    return () => {
      element.removeEventListener('focus', handleFocus);
    };
  }, []);

  return ref;
}
