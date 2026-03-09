import { BookOpen, CheckCircle2, Lock, X, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { useState } from 'react';
import YouTube from 'react-youtube';
import ShareAchievement from '@/components/ShareAchievement';

type Course = {
  id: string;
  title: string;
  desc: string;
  duration: string;
  icon: string;
  forAll: boolean;
  videoIds?: string[];
  videoId?: string;
  recommendedFor?: string;
};

const COURSES: Course[] = [
  { 
    id: 'c1', 
    title: "Finanzas para empezar", 
    desc: "Aprende desde cero con esta serie completa de videos.", 
    duration: "45 min", 
    icon: "🚀", 
    forAll: true, 
    videoIds: [
      "2L9wh7SpPK0", "IFSWANzx4Hk", "GBUsRncSoc8", "eDjyhhztWNo", 
      "laAeQuTOfK0", "ylagSKyWSFQ", "Tk2zeFg7iaw", "vxCoBBhWLBs", 
      "Xn63bIp18Hg", "JDCCcoHhmTE"
    ] 
  },
  { 
    id: 'c2', 
    title: "SOS no logro ahorrar", 
    desc: "Descubre los conceptos básicos, fundamentos y estrategias prácticas para empezar a ahorrar.", 
    duration: "41 min", 
    icon: "💰", 
    forAll: true, 
    videoIds: [
      "17XSHAlePHQ", // Introducción al curso
      "HR7nwKU_MQ0", // Fundamentos del Ahorro
      "gc5KPl-CqEw", // Tomando decisiones financieras con claridad
      "ly38Qo32KDw", // Descifrando los sesgos financieros
      "n6H0BhprSnY"  // Estrategias prácticas de Ahorro e Inversión
    ] 
  },
  { 
    id: 'c3', 
    title: "Productos financieros", 
    desc: "Conoce los diferentes productos financieros que tienes a tu disposición.", 
    duration: "30 min", 
    icon: "💳", 
    forAll: true, 
    videoIds: [
      "kgaYHlXXZ_M",
      "gsYLoOjQi9o",
      "_Hs20bUMY8g",
      "jCacRqJYgJI",
      "-oMZUl8JAMM",
      "T6pkPAWucUY"
    ] 
  }
];

export default function Education() {
  const { user, updateUser, markVideoWatched } = useAppContext();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  if (!user) return null;

  const completedCourses = user.completedCourses || [];
  const watchedVideos = user.watchedVideos || [];
  const progressPercent = Math.round((completedCourses.length / COURSES.length) * 100);

  const handleCompleteCourse = async (courseId: string) => {
    if (isCompleting) return;
    setIsCompleting(true);
    
    try {
      if (!completedCourses.includes(courseId)) {
        await updateUser({
          completedCourses: [...completedCourses, courseId]
        });
      }
    } catch (error) {
      console.error("Error completing course", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleVideoEnd = async (videoId: string) => {
    await markVideoWatched(videoId);
    
    // Check if all videos for the current course are watched
    const course = COURSES.find(c => c.id === selectedCourse);
    if (!course) return;

    const newWatched = [...watchedVideos, videoId];
    
    let allWatched = false;
    if (course.videoIds) {
      allWatched = course.videoIds.every(id => newWatched.includes(id));
    } else if (course.videoId) {
      allWatched = newWatched.includes(course.videoId);
    }

    if (allWatched && !completedCourses.includes(course.id)) {
      handleCompleteCourse(course.id);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-certus-light pb-6">
      <div className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="text-certus-green shrink-0" />
          <h1 className="font-display text-lg font-bold text-certus-blue leading-tight">
            Aprende con <a href="https://finanzasaltoque.pe/" target="_blank" rel="noopener noreferrer" className="text-certus-cyan hover:underline">Finanzas al Toque</a> y <a href="https://www.certus.edu.pe/" target="_blank" rel="noopener noreferrer" className="text-certus-cyan hover:underline">Certus</a>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div className="bg-certus-green h-1.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <span>{progressPercent}% completado</span>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {COURSES.map(course => {
          const isCompleted = completedCourses.includes(course.id);
          const isRecommended = course.recommendedFor === user.ageProfile || course.forAll;
          
          return (
            <CourseCard 
              key={course.id}
              title={course.title} 
              desc={course.desc}
              duration={course.duration}
              progress={isCompleted ? 100 : 0}
              icon={course.icon}
              status={isCompleted ? 'completed' : 'available'}
              recommended={isRecommended}
              onClick={() => {
                setSelectedCourse(course.id);
                setActiveVideoIndex(0);
              }}
            />
          );
        })}
      </div>

      {/* Course Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-certus-blue/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-certus-blue p-4 flex justify-between items-center text-white">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <PlayCircle className="text-certus-cyan" size={20} />
                Lección Rápida
              </h3>
              <button onClick={() => setSelectedCourse(null)} className="text-white/70 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4 text-center">
              {COURSES.find(c => c.id === selectedCourse)?.videoIds ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden shadow-md bg-black relative">
                  <YouTube
                    videoId={COURSES.find(c => c.id === selectedCourse)?.videoIds?.[activeVideoIndex]}
                    opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1, rel: 0 } }}
                    onEnd={(e) => {
                      const videoId = COURSES.find(c => c.id === selectedCourse)?.videoIds?.[activeVideoIndex];
                      if (videoId) handleVideoEnd(videoId);
                    }}
                    className="w-full h-full absolute inset-0"
                    iframeClassName="w-full h-full"
                  />
                </div>
              ) : COURSES.find(c => c.id === selectedCourse)?.videoId ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden shadow-md bg-black relative">
                  <YouTube
                    videoId={COURSES.find(c => c.id === selectedCourse)?.videoId}
                    opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1, rel: 0 } }}
                    onEnd={(e) => {
                      const videoId = COURSES.find(c => c.id === selectedCourse)?.videoId;
                      if (videoId) handleVideoEnd(videoId);
                    }}
                    className="w-full h-full absolute inset-0"
                    iframeClassName="w-full h-full"
                  />
                </div>
              ) : (
                <div className="text-6xl mb-2">
                  {COURSES.find(c => c.id === selectedCourse)?.icon}
                </div>
              )}
              
              <h4 className="font-display font-bold text-certus-blue text-xl">
                {COURSES.find(c => c.id === selectedCourse)?.title}
              </h4>
              <p className="text-sm text-gray-600 mb-2 flex items-center justify-center gap-2">
                {COURSES.find(c => c.id === selectedCourse)?.videoIds 
                  ? `Video ${activeVideoIndex + 1} de ${COURSES.find(c => c.id === selectedCourse)?.videoIds?.length}`
                  : COURSES.find(c => c.id === selectedCourse)?.videoId 
                  ? "Mira este video de ASBANC para aprender más sobre este tema."
                  : "En esta lección aprenderás los conceptos clave sobre este tema. (Próximamente más videos)"}
                
                {((COURSES.find(c => c.id === selectedCourse)?.videoIds && watchedVideos.includes(COURSES.find(c => c.id === selectedCourse)?.videoIds?.[activeVideoIndex] || '')) || 
                  (COURSES.find(c => c.id === selectedCourse)?.videoId && watchedVideos.includes(COURSES.find(c => c.id === selectedCourse)?.videoId || ''))) && (
                  <CheckCircle2 size={16} className="text-certus-green" />
                )}
              </p>

              {COURSES.find(c => c.id === selectedCourse)?.videoIds && (
                <div className="flex justify-between items-center mb-2">
                  <button 
                    onClick={() => setActiveVideoIndex(Math.max(0, activeVideoIndex - 1))}
                    disabled={activeVideoIndex === 0}
                    className="px-3 py-1 bg-gray-100 text-certus-blue rounded-lg disabled:opacity-50 font-bold text-sm"
                  >
                    Anterior
                  </button>
                  <button 
                    onClick={() => setActiveVideoIndex(Math.min((COURSES.find(c => c.id === selectedCourse)?.videoIds?.length || 1) - 1, activeVideoIndex + 1))}
                    disabled={activeVideoIndex === (COURSES.find(c => c.id === selectedCourse)?.videoIds?.length || 1) - 1}
                    className="px-3 py-1 bg-gray-100 text-certus-blue rounded-lg disabled:opacity-50 font-bold text-sm"
                  >
                    Siguiente
                  </button>
                </div>
              )}
              
              {completedCourses.includes(selectedCourse) ? (
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="w-full bg-certus-blue text-white font-display font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={20} /> CURSO COMPLETADO (CERRAR)
                  </button>
                  <ShareAchievement 
                    title={COURSES.find(c => c.id === selectedCourse)?.title || ''} 
                    subtitle="¡He completado este curso de educación financiera!" 
                    type="course" 
                  />
                </div>
              ) : COURSES.find(c => c.id === selectedCourse)?.videoIds || COURSES.find(c => c.id === selectedCourse)?.videoId ? (
                <div className="w-full bg-gray-100 text-gray-500 font-display font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-sm">
                  Mira todos los videos para completar el curso
                </div>
              ) : (
                <button
                  onClick={() => handleCompleteCourse(selectedCourse)}
                  disabled={isCompleting}
                  className="w-full bg-certus-magenta text-white font-display font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCompleting ? 'Guardando...' : <><CheckCircle2 size={20} /> MARCAR COMO COMPLETADO</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CourseCard({ title, desc, duration, progress, icon, status, recommended, onClick }: { title: string, desc: string, duration: string, progress: number, icon: string, status: 'completed' | 'in-progress' | 'available' | 'locked', recommended?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white rounded-2xl p-4 shadow-sm border transition-all relative overflow-hidden",
        status === 'locked' ? "border-gray-100 opacity-70" : "border-gray-100 hover:shadow-md cursor-pointer",
        status === 'in-progress' && "border-certus-cyan"
      )}
    >
      {recommended && (
        <div className="absolute top-0 right-0 bg-certus-yellow text-certus-blue text-[10px] font-bold px-2 py-1 rounded-bl-lg">
          Recomendado
        </div>
      )}
      
      <div className="flex gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0",
          status === 'completed' ? "bg-green-50" : "bg-certus-light"
        )}>
          {icon}
        </div>
        
        <div className="flex-1">
          <h3 className="font-display font-bold text-certus-blue text-sm leading-tight mb-1">{title}</h3>
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{desc}</p>
          
          <div className="flex items-center justify-between mt-auto">
            <span className="text-[10px] text-gray-400 font-medium">{duration}</span>
            
            {status === 'completed' && <CheckCircle2 size={16} className="text-certus-success" />}
            {status === 'locked' && <Lock size={14} className="text-gray-400" />}
            {status === 'in-progress' && (
              <span className="text-[10px] font-bold text-certus-cyan">Continuar</span>
            )}
            {status === 'available' && (
              <span className="text-[10px] font-bold text-certus-blue">Empezar</span>
            )}
          </div>
        </div>
      </div>
      
      {status !== 'locked' && status !== 'available' && (
        <div className="w-full bg-gray-100 rounded-full h-1 mt-3">
          <div 
            className={cn("h-1 rounded-full", status === 'completed' ? "bg-certus-success" : "bg-certus-cyan")} 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
