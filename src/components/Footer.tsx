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
        className="hover:text-certus-cyan transition-colors font-medium"
      >
        Ing Diego Armando Vasquez Chavez CIP: 337613
      </a>
    </div>
  );
}
