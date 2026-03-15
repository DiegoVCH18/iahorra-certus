interface FooterProps {
  light?: boolean;
}

export default function Footer({ light }: FooterProps) {
  return (
    <div className={`w-full text-center py-4 text-xs mt-auto ${light ? 'text-white/60' : 'text-gray-500'}`}>
      Desarrollado por:{' '}
      <a 
        href="https://linktr.ee/diegovch18" 
        target="_blank" 
        rel="noopener noreferrer" 
        aria-label="Abrir sitio web de Ing. Diego Vasquez"
        className={
          light
            ? 'font-medium underline underline-offset-2 text-white hover:text-certus-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-certus-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-certus-blue rounded-sm cursor-pointer transition-colors'
            : 'font-medium underline underline-offset-2 text-blue-600 hover:text-certus-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-certus-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-sm cursor-pointer transition-colors'
        }
      >
        Ing. Diego Vasquez
      </a>
      <br />
      <span className={light ? 'text-white/50' : 'text-gray-400'}>
        Docente de Adm. Financiera y Banca Digital en CERTUS
      </span>
    </div>
  );
}
