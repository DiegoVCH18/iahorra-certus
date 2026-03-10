import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Download, CheckCircle2, Trophy } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ShareAchievementProps {
  title: string;
  subtitle: string;
  type: 'goal' | 'course';
  onClose?: () => void;
}

export default function ShareAchievement({ title, subtitle, type, onClose }: ShareAchievementProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [isShared, setIsShared] = useState(false);
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const generateImage = async () => {
      if (!cardRef.current) return;
      try {
        // Small delay to ensure fonts and layout are ready
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!cardRef.current) return;
        
        const canvas = await html2canvas(cardRef.current, {
          scale: 2,
          backgroundColor: '#0D1B4B', // certus-blue
          logging: false,
          useCORS: true,
        });
        
        const url = canvas.toDataURL('image/png');
        const res = await fetch(url);
        const blob = await res.blob();
        const file = new File([blob], 'logro-iahorra.png', { type: 'image/png' });
        
        if (mounted) {
          setDataUrl(url);
          setShareFile(file);
          setIsGenerating(false);
        }
      } catch (error) {
        console.error('Error generating image:', error);
        if (mounted) setIsGenerating(false);
      }
    };
    
    generateImage();
    
    return () => {
      mounted = false;
    };
  }, [title, subtitle, type]);

  const handleShare = async () => {
    if (!shareFile || !dataUrl) return;

    try {
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [shareFile] })) {
        await navigator.share({
          title: '¡Mi nuevo logro en IAhorra CERTUS!',
          text: `¡Acabo de completar: ${title}! Aprendiendo a manejar mi dinero con IAhorra CERTUS. 🚀💰`,
          files: [shareFile],
        });
        setIsShared(true);
      } else {
        // Fallback to download
        handleDownload(dataUrl);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // If user cancelled, don't show error. Otherwise fallback to download.
      if ((error as any).name !== 'AbortError') {
        handleDownload(dataUrl);
      }
    }
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.download = 'logro-iahorra.png';
    link.href = url;
    link.click();
    setIsShared(true);
  };

  const hiddenCard = (
    <div className="absolute left-[-9999px] top-[-9999px] z-[-1]">
      <div 
        ref={cardRef} 
        className="w-[1080px] h-[1080px] bg-certus-blue flex flex-col items-center justify-center p-16 relative overflow-hidden"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-certus-cyan blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-certus-magenta blur-3xl"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-3xl bg-white/10 backdrop-blur-md p-16 rounded-[3rem] border border-white/20 shadow-2xl">
          <div className="bg-white p-6 rounded-3xl mb-12 shadow-xl flex items-center justify-center">
            {type === 'goal' ? (
              <Trophy className="text-certus-yellow w-32 h-32" />
            ) : (
              <CheckCircle2 className="text-certus-green w-32 h-32" />
            )}
          </div>
          
          <h2 className="text-certus-cyan font-bold text-4xl uppercase tracking-widest mb-6">
            ¡Nuevo Logro Desbloqueado!
          </h2>
          
          <h1 className="text-white font-bold text-7xl mb-8 leading-tight">
            {title}
          </h1>
          
          <p className="text-white/80 text-3xl mb-16">
            {subtitle}
          </p>
          
          <div className="flex items-center gap-6 bg-white/5 px-10 py-6 rounded-full border border-white/10">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-2">
              <span className="text-certus-blue font-bold text-2xl">IA</span>
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-2xl">IAhorra CERTUS</p>
              <p className="text-certus-cyan text-xl">Educación Financiera del Futuro</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {typeof document !== 'undefined' && createPortal(hiddenCard, document.body)}

      {/* Visible UI */}
      <button
        onClick={handleShare}
        disabled={isGenerating || !dataUrl}
        className="w-full bg-certus-cyan/10 text-certus-cyan font-display font-bold py-3 rounded-xl hover:bg-certus-cyan/20 transition-colors flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <span className="animate-pulse">Preparando imagen...</span>
        ) : isShared ? (
          <>
            <CheckCircle2 size={20} /> ¡Compartido!
          </>
        ) : (
          <>
            <Share2 size={20} /> Compartir mi logro
          </>
        )}
      </button>
      
      {isShared && (
        <p className="text-xs text-gray-500 text-center">
          ¡Gracias por compartir tu progreso e inspirar a otros!
        </p>
      )}
    </div>
  );
}
