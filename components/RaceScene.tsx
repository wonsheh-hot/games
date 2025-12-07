import React, { useEffect, useState } from 'react';
import { AVATARS } from '../constants';

interface RaceSceneProps {
  userAvatarId: number;
  feedback: 'none' | 'correct' | 'incorrect';
}

const RIVALS = [
  { avatar: "🤖", color: "#475569", name: "Robo-Racer" },
  { avatar: "👽", color: "#059669", name: "Alien-X" },
  { avatar: "👺", color: "#dc2626", name: "Red-Demon" },
  { avatar: "🤡", color: "#db2777", name: "Joker-Kart" },
  { avatar: "👻", color: "#64748b", name: "Ghost-Rider" },
  { avatar: "🧟", color: "#65a30d", name: "Zombie-Z" },
  { avatar: "🧛", color: "#7c3aed", name: "Vamp-V8" },
  { avatar: "🦹", color: "#d97706", name: "Villain-V" },
];

const KartSvg = ({ color, className, isFast = false }: { color: string; className?: string; isFast?: boolean }) => (
  <svg viewBox="0 0 100 60" className={`w-32 h-20 drop-shadow-xl ${className}`} xmlns="http://www.w3.org/2000/svg">
    {/* Exhaust Pipes */}
    <rect x="0" y="25" width="12" height="6" rx="2" fill="#555" />
    <rect x="0" y="33" width="12" height="6" rx="2" fill="#555" />
    <circle cx="2" cy="28" r="3" fill="#333" />
    <circle cx="2" cy="36" r="3" fill="#333" />

    {/* Engine Block / Rear */}
    <path d="M10 20 L30 20 L32 42 L10 42 Z" fill="#333" />

    {/* Main Body */}
    <path 
      d="M25 42 L25 25 L40 25 L50 32 L90 34 Q98 35 92 42 Z" 
      fill={color} 
      stroke="#222" 
      strokeWidth="1"
    />
    
    {/* Side Stripe / Decal */}
    <path d="M30 35 L80 37" stroke="white" strokeWidth="4" strokeOpacity="0.8" strokeLinecap="round" />
    
    {/* Steering Wheel */}
    <path d="M65 32 L62 20" stroke="#111" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="62" cy="20" rx="6" ry="2" fill="none" stroke="#111" strokeWidth="2" transform="rotate(-15 62 20)" />

    {/* Front Bumper / Nose */}
    <path d="M85 42 L95 42 Q100 42 98 38 L90 34" fill="#eee" opacity="0.5" />

    {/* Rear Wheel (Larger) */}
    <g className={isFast ? "animate-wheel-spin-fast" : "animate-wheel-spin"} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
      <circle cx="20" cy="45" r="13" fill="#111" /> {/* Tire */}
      <circle cx="20" cy="45" r="7" fill="#fbbf24" /> {/* Rim (Yellow/Gold) */}
      <circle cx="20" cy="45" r="3" fill="#b45309" /> {/* Hub */}
      <path d="M20 38 L20 52 M13 45 L27 45" stroke="#b45309" strokeWidth="2" />
    </g>

    {/* Front Wheel (Smaller) */}
    <g className={isFast ? "animate-wheel-spin-fast" : "animate-wheel-spin"} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
      <circle cx="82" cy="48" r="10" fill="#111" /> {/* Tire */}
      <circle cx="82" cy="48" r="5" fill="#fbbf24" /> {/* Rim */}
      <circle cx="82" cy="48" r="2" fill="#b45309" /> {/* Hub */}
      <path d="M82 43 L82 53 M77 48 L87 48" stroke="#b45309" strokeWidth="2" />
    </g>
  </svg>
);

const RaceScene: React.FC<RaceSceneProps> = ({ userAvatarId, feedback }) => {
  // Player is at 30% (Left), Rival is at 70% (Right) initially.
  const [playerPos, setPlayerPos] = useState(30); 
  const [rivalPos, setRivalPos] = useState(70);   
  
  const [rivalIndex, setRivalIndex] = useState(0);
  const [effect, setEffect] = useState<'none' | 'boost' | 'stumble'>('none');
  const [isTransitioning, setIsTransitioning] = useState(true);

  const currentRival = RIVALS[rivalIndex];

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (feedback === 'correct') {
      // PHASE 1: OVERTAKE
      setEffect('boost');
      setIsTransitioning(true);
      
      // Player zooms forward, Rival drops back off-screen left
      setPlayerPos(85); 
      setRivalPos(-50); 

      // PHASE 2: SPAWN NEW RIVAL AHEAD & PLAYER DECELERATE
      timer = setTimeout(() => {
        // 1. Turn off boost effects
        setEffect('none');
        
        // 2. Snap Rival to start line (off-screen right) without transition
        setIsTransitioning(false);
        setRivalIndex((prev) => (prev + 1) % RIVALS.length);
        setRivalPos(150); 
        
        // Note: We leave playerPos at 85 temporarily so it doesn't jump

        // 3. Smoothly glide everything back to "Cruising" positions
        requestAnimationFrame(() => {
             requestAnimationFrame(() => {
                setIsTransitioning(true);
                setPlayerPos(30); // Player drifts back from 85 -> 30 (Decelerate/Return to lane)
                setRivalPos(70);  // New rival approaches from 150 -> 70
             });
        });

      }, 1000); // 1s boost duration
    } 
    else if (feedback === 'incorrect') {
      // PHASE 1: BE OVERTAKEN
      // A new car appears from behind (left) and zooms past the player

      // Instant Setup: Spawn new rival behind
      setIsTransitioning(false);
      setRivalPos(-40); 
      setRivalIndex((prev) => (prev + 1) % RIVALS.length);

      // Animation: Rival zooms from left to right (overtaking)
      requestAnimationFrame(() => {
         requestAnimationFrame(() => {
            setEffect('stumble');
            setIsTransitioning(true);
            setRivalPos(120); // Zoom past player off-screen right
            setPlayerPos(20); // Player slows/stumbles back
         });
      });

      timer = setTimeout(() => {
        setEffect('none');
        setIsTransitioning(false);
        
        // Reset for next question: Rival settles at target position ahead
        setRivalPos(70);
        setPlayerPos(30);
        
        requestAnimationFrame(() => {
             requestAnimationFrame(() => {
                 setIsTransitioning(true);
             });
        });
      }, 1200);
    }

    return () => clearTimeout(timer);
  }, [feedback]);

  return (
    <div className="relative w-full h-48 bg-gradient-to-b from-sky-400 to-sky-200 rounded-t-3xl overflow-hidden border-b-8 border-gray-700 shadow-inner group">
      {/* Background Scenery */}
      <div className="absolute top-4 right-10 text-5xl opacity-90 animate-pulse text-yellow-300">☀️</div>
      <div className="absolute top-8 left-10 text-5xl opacity-80 animate-bounce-short text-white">☁️</div>
      <div className="absolute top-16 right-1/3 text-4xl opacity-60 animate-pulse text-white">☁️</div>

      {/* Speed Lines (Visible only on Boost) */}
      {effect === 'boost' && (
        <div className="absolute inset-0 z-0 opacity-60 pointer-events-none mix-blend-overlay">
          <div className="w-full h-1 bg-white absolute top-10 animate-slide-in" style={{animationDuration: '0.1s'}}></div>
          <div className="w-full h-1 bg-white absolute top-24 animate-slide-in" style={{animationDuration: '0.15s', animationDelay: '0.05s'}}></div>
          <div className="w-full h-2 bg-white absolute top-32 animate-slide-in" style={{animationDuration: '0.08s'}}></div>
          <div className="w-full h-1 bg-white absolute top-40 animate-slide-in" style={{animationDuration: '0.12s'}}></div>
        </div>
      )}

      {/* The Road */}
      <div className="absolute bottom-0 w-full h-20 bg-gray-600 flex items-center overflow-hidden border-t-4 border-gray-500">
        {/* Animated Road Lines - Faster and blurrier when boosting */}
        <div 
            className={`absolute top-1/2 w-[150%] h-3 flex gap-16 ${effect === 'boost' ? 'animate-road-scroll-fast opacity-70 blur-[1px]' : 'animate-road-scroll'}`}
        >
           {Array.from({ length: 15 }).map((_, i) => (
             <div key={i} className="w-24 h-3 bg-yellow-400 skew-x-[-20deg] shadow-sm" />
           ))}
        </div>
      </div>

      {/* Rival Racer */}
      <div 
        className="absolute bottom-4 z-10"
        style={{ 
            left: `${rivalPos}%`, 
            transform: `translateY(${effect === 'stumble' ? '-5px' : '0'})`,
            transition: isTransitioning ? 'left 1s cubic-bezier(0.5, 0, 0.2, 1)' : 'none' 
        }}
      >
        <div className="relative animate-rumble">
             <div className="absolute -top-7 left-8 text-5xl z-0 transform scale-x-[-1] drop-shadow-md">{currentRival.avatar}</div>
             {/* If rival is overtaking from behind (incorrect), they are fast too */}
             <KartSvg color={currentRival.color} className="relative z-10" isFast={feedback === 'incorrect'} />
             
             {/* Smoke if rival is just cruising or being passed? Maybe speed lines if they are overtaking us? */}
             {feedback === 'incorrect' && (
                <div className="absolute top-8 -left-16 text-4xl animate-slide-in opacity-50 rotate-90">💨</div>
             )}
        </div>
      </div>

      {/* Player Racer */}
      <div 
        className={`absolute bottom-2 z-20 ${effect === 'stumble' ? 'animate-shake opacity-80' : ''}`}
        style={{ 
            left: `${playerPos}%`,
            transition: isTransitioning ? 'left 1s cubic-bezier(0.5, 0, 0.2, 1)' : 'none' 
        }}
      >
        <div className="relative group">
            {/* Nitro Flame */}
            {effect === 'boost' && (
                <div className="absolute top-8 -left-16 text-6xl animate-pulse scale-150 rotate-90 origin-right z-0 filter drop-shadow-lg text-orange-500">
                    🔥
                </div>
            )}
            
            {/* Avatar & Car Wrapper with Rumble & Tilt */}
            <div className={`transition-transform duration-300 ${effect === 'boost' ? '-rotate-1 scale-105' : ''}`}>
                <div className="animate-rumble">
                    <div className="text-5xl absolute -top-8 left-8 z-0 drop-shadow-md transform -scale-x-100">{AVATARS[userAvatarId]}</div>
                    {/* Wheels spin faster on boost */}
                    <KartSvg color="#ef4444" className="relative z-10" isFast={effect === 'boost'} />
                </div>
            </div>

            {/* Smoke on Stumble */}
            {effect === 'stumble' && (
                <div className="absolute top-0 right-0 text-4xl animate-ping opacity-60">💨</div>
            )}
            
            {/* Speech Bubble */}
            {effect === 'boost' && (
                <div className="absolute -top-16 left-0 bg-white px-3 py-1 rounded-xl text-sm font-bold border-b-4 border-indigo-200 animate-bounce shadow-lg text-indigo-600 whitespace-nowrap z-30">
                    Bye Bye! 👋
                </div>
            )}
            {effect === 'stumble' && (
                <div className="absolute -top-16 left-0 bg-white px-3 py-1 rounded-xl text-sm font-bold border-b-4 border-red-200 animate-pulse shadow-lg text-red-500 whitespace-nowrap z-30">
                    Oh no! 🐢
                </div>
            )}
        </div>
      </div>

      <style>{`
        @keyframes road-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-road-scroll {
          animation: road-scroll 0.6s linear infinite;
        }
        .animate-road-scroll-fast {
          animation: road-scroll 0.15s linear infinite;
        }
        @keyframes wheel-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-wheel-spin {
          animation: wheel-spin 0.5s linear infinite;
        }
        .animate-wheel-spin-fast {
          animation: wheel-spin 0.1s linear infinite;
        }
        @keyframes engine-rumble {
          0% { transform: translateY(0) scale(1); }
          25% { transform: translateY(-1px) scale(1.02); }
          50% { transform: translateY(0) scale(1); }
          75% { transform: translateY(1px) scale(0.98); }
          100% { transform: translateY(0) scale(1); }
        }
        .animate-rumble {
          animation: engine-rumble 0.15s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default RaceScene;