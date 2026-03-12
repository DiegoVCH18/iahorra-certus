import { useEffect, useMemo, useState } from 'react';
import { PiggyBank } from 'lucide-react';

type LogoMode = 'auto' | 'light' | 'dark';

interface BrandIsotipoProps {
  alt?: string;
  mode?: LogoMode;
  className?: string;
  fallbackClassName?: string;
}

function getSystemDarkMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getDocumentDarkClass() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

export default function BrandIsotipo({
  alt = 'IAhorra logo',
  mode = 'auto',
  className = 'w-full h-full object-contain',
  fallbackClassName = 'text-certus-blue w-5 h-5'
}: BrandIsotipoProps) {
  const [hasError, setHasError] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(getDocumentDarkClass() || getSystemDarkMode());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => setIsDarkTheme(getDocumentDarkClass() || media.matches);

    updateTheme();
    media.addEventListener('change', updateTheme);

    return () => media.removeEventListener('change', updateTheme);
  }, []);

  const src = useMemo(() => {
    const resolvedMode = mode === 'auto' ? (isDarkTheme ? 'dark' : 'light') : mode;
    return resolvedMode === 'dark'
      ? '/01_Brand_Core/isotipo/iahorra-isotipo-dark.png'
      : '/01_Brand_Core/isotipo/iahorra-isotipo-principal.png';
  }, [mode, isDarkTheme]);

  if (hasError) {
    return <PiggyBank className={fallbackClassName} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}