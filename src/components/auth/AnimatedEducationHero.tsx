'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  GraduationCap, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Star, 
  Lightbulb,
  FileCheck
} from 'lucide-react';

interface AnimatedEducationHeroProps {
  schoolName: string;
  campusName: string;
  sessionTitle: string;
}

export function AnimatedEducationHero({
  schoolName,
  campusName,
  sessionTitle,
}: AnimatedEducationHeroProps) {
  return (
    <div className="relative w-full h-full min-h-[580px] lg:min-h-[680px] p-8 sm:p-10 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0c1a30] via-[#0f2a4a] to-[#16335c] text-white select-none">
      
      {/* Background Animated Floating Knowledge Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        
        {/* Floating Math & Alpha Symbols */}
        <motion.div
          animate={{ y: [0, -25, 0], opacity: [0.2, 0.45, 0.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-12 left-10 text-blue-300/30 font-black text-2xl font-mono"
        >
          A + B = C
        </motion.div>

        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, 15, 0], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-32 right-14 text-amber-300/30 font-black text-3xl font-mono"
        >
          ∑ π %
        </motion.div>

        <motion.div
          animate={{ y: [0, -18, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-28 left-16 text-rose-300/30 font-black text-2xl font-mono"
        >
          100%
        </motion.div>

        {/* Ambient Radial Lighting */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-blue-500/25 blur-[100px]" />
        <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-amber-500/15 blur-[110px]" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-rose-500/15 blur-[100px]" />
      </div>

      {/* Top Header Badge */}
      <div className="relative z-10 space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            The Spirit School
          </span>
          <span className="bg-rose-600 text-white font-black text-[11px] tracking-wider uppercase px-2.5 py-1 rounded-full shadow-md shadow-rose-600/30">
            {campusName}
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-300 font-bold text-xs bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/25">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            Session {sessionTitle}
          </span>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-outfit leading-tight drop-shadow-sm">
            Shaping Bright Futures & Academic Excellence
          </h2>
          <p className="text-blue-100/70 text-xs sm:text-sm mt-1 max-w-lg leading-relaxed font-medium">
            Official Academic & Examination Terminal for Tabulation, Computerized Date Sheets, and Multi-Term Gazette Reports.
          </p>
        </div>
      </div>

      {/* Center Interactive Animated Illustration Scene */}
      <div className="relative z-10 my-4 sm:my-6 flex items-center justify-center">
        
        {/* Soft Circular Glow Behind Characters */}
        <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tr from-blue-600/30 via-indigo-500/20 to-amber-400/20 blur-2xl pointer-events-none" />

        {/* Floating Graduation Cap Above Scene */}
        <motion.div
          animate={{ 
            y: [0, -12, 0], 
            rotate: [-4, 4, -4],
          }}
          transition={{ 
            duration: 4.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute -top-10 sm:-top-12 z-20"
        >
          <div className="relative p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-xl shadow-amber-500/30 border border-amber-300/50 flex items-center gap-2">
            <GraduationCap className="h-7 w-7 sm:h-8 sm:w-8 text-slate-950" />
            <div className="pr-1">
              <p className="text-[10px] font-black uppercase tracking-wider leading-none">Excellence</p>
              <p className="text-xs font-black uppercase tracking-tight">Class of {sessionTitle.split('–')[1] || '2026'}</p>
            </div>
          </div>
        </motion.div>

        {/* Floating Achievement Card 1 (Top Right) */}
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            x: [0, 4, 0]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 0.5 
          }}
          className="absolute -right-2 sm:right-2 top-8 z-20 hidden sm:flex items-center gap-2.5 p-2.5 px-3.5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-emerald-500/40 shadow-xl shadow-emerald-950/40"
        >
          <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-emerald-300">Grade A+</span>
              <span className="text-[10px] font-bold text-emerald-400/80">• 98.6%</span>
            </div>
            <p className="text-[10px] text-slate-300 font-semibold">Class Position Holder</p>
          </div>
        </motion.div>

        {/* Floating Card 2 (Bottom Left) */}
        <motion.div
          animate={{ 
            y: [0, 10, 0],
            x: [0, -4, 0]
          }}
          transition={{ 
            duration: 5.5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1 
          }}
          className="absolute -left-2 sm:left-2 bottom-6 z-20 hidden sm:flex items-center gap-2.5 p-2.5 px-3.5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-blue-400/40 shadow-xl shadow-blue-950/40"
        >
          <div className="h-8 w-8 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-black text-white">Smart Date Sheets</p>
            <p className="text-[10px] text-blue-200/80 font-semibold">QR-Verified Roll No Slips</p>
          </div>
        </motion.div>

        {/* Floating Card 3 (Bottom Right) */}
        <motion.div
          animate={{ 
            y: [0, -8, 0],
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1.5 
          }}
          className="absolute -right-2 sm:right-4 bottom-2 z-20 hidden sm:flex items-center gap-2 p-2 px-3 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-amber-400/40 shadow-xl shadow-amber-950/40"
        >
          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          <span className="text-[11px] font-black text-amber-200">100% Verified Gazette</span>
        </motion.div>

        {/* Main Students & Learning Vector Graphic (SVG) */}
        <motion.div
          animate={{ 
            y: [0, -6, 0] 
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="relative w-full max-w-[340px] sm:max-w-[400px] aspect-[4/3] flex items-center justify-center"
        >
          <svg 
            viewBox="0 0 500 380" 
            className="w-full h-full filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft Ambient Platform */}
            <ellipse cx="250" cy="350" rx="200" ry="24" fill="#09182d" opacity="0.8" />
            <ellipse cx="250" cy="346" rx="160" ry="16" fill="#162b4a" opacity="0.6" />

            {/* Stack of Books on Floor */}
            <g transform="translate(60, 270)">
              {/* Book 1 (Bottom, Crimson) */}
              <rect x="0" y="45" width="80" height="16" rx="3" fill="#be123c" />
              <rect x="5" y="48" width="70" height="10" rx="2" fill="#fda4af" opacity="0.3" />
              <rect x="74" y="47" width="5" height="12" fill="#fff" />
              
              {/* Book 2 (Middle, Royal Blue) */}
              <rect x="6" y="28" width="72" height="16" rx="3" fill="#1d4ed8" />
              <rect x="11" y="31" width="62" height="10" rx="2" fill="#93c5fd" opacity="0.3" />
              <rect x="72" y="30" width="5" height="12" fill="#fff" />

              {/* Book 3 (Top, Gold/Amber) */}
              <rect x="14" y="12" width="60" height="15" rx="3" fill="#d97706" />
              <rect x="18" y="15" width="52" height="9" rx="2" fill="#fde68a" opacity="0.4" />
              <rect x="68" y="14" width="5" height="11" fill="#fff" />

              {/* An Apple on top of books */}
              <circle cx="44" cy="5" r="9" fill="#e11d48" />
              <path d="M44 5 C45 0, 48 -2, 50 -1" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* STUDENT 1: Joyful School Boy (Left) */}
            <g transform="translate(110, 80)">
              {/* Backpack on side */}
              <rect x="12" y="120" width="30" height="65" rx="14" fill="#1e3a8a" />
              <rect x="16" y="130" width="22" height="45" rx="8" fill="#3b82f6" />
              
              {/* Body / School Uniform Blazer (Navy Blue) */}
              <path d="M45 125 L105 125 L115 220 L35 220 Z" fill="#0f2a4a" />
              {/* White Shirt Collar */}
              <polygon points="60,125 75,155 90,125" fill="#ffffff" />
              {/* Red / Crimson School Tie */}
              <polygon points="72,135 78,135 81,180 75,190 69,180" fill="#dc2626" />
              <polygon points="71,130 79,130 81,138 69,138" fill="#991b1b" />
              {/* School Crest on Blazer Pocket */}
              <rect x="48" y="150" width="14" height="16" rx="3" fill="#1e3a8a" stroke="#d97706" strokeWidth="1" />
              <path d="M55 152 L55 163" stroke="#d97706" strokeWidth="1.2" />

              {/* Trousers (Charcoal/Navy) */}
              <rect x="42" y="220" width="28" height="55" rx="4" fill="#1e293b" />
              <rect x="78" y="220" width="28" height="55" rx="4" fill="#1e293b" />
              {/* Shoes */}
              <ellipse cx="54" cy="275" rx="16" ry="7" fill="#0f172a" />
              <ellipse cx="94" cy="275" rx="16" ry="7" fill="#0f172a" />

              {/* Arms holding an Open Book */}
              <path d="M38 135 L15 170 L35 180 L52 150" fill="#0f2a4a" />
              <path d="M112 135 L135 170 L118 180 L102 150" fill="#0f2a4a" />

              {/* Hands (Skin Tone) */}
              <circle cx="30" cy="180" r="7" fill="#fed7aa" />
              <circle cx="122" cy="180" r="7" fill="#fed7aa" />

              {/* Open Book held in hands */}
              <g transform="translate(30, 165)">
                <path d="M10 20 C28 15, 46 22, 47 38 C47 38, 28 32, 10 36 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <path d="M84 20 C66 15, 48 22, 47 38 C47 38, 66 32, 84 36 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <path d="M8 22 C28 17, 46 24, 47 40 C47 40, 28 34, 8 38 Z" fill="#3b82f6" opacity="0.9" />
                <path d="M86 22 C66 17, 48 24, 47 40 C47 40, 66 34, 86 38 Z" fill="#2563eb" opacity="0.9" />
                {/* Book text lines */}
                <line x1="18" y1="26" x2="40" y2="28" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="18" y1="31" x2="36" y2="33" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="54" y1="28" x2="76" y2="26" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="58" y1="33" x2="76" y2="31" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                
                {/* Golden Knowledge Sparkles emerging from Book */}
                <path d="M47 8 L49 14 L55 16 L49 18 L47 24 L45 18 L39 16 L45 14 Z" fill="#fbbf24" />
                <circle cx="34" cy="5" r="2.5" fill="#fde047" />
                <circle cx="62" cy="7" r="2" fill="#fde047" />
              </g>

              {/* Head & Face */}
              <circle cx="75" cy="85" r="30" fill="#fed7aa" />
              {/* Boy's Stylish Hair (Dark Brown) */}
              <path d="M45 80 C45 50, 80 40, 105 58 C108 70, 106 82, 104 84 C95 68, 80 66, 60 72 C50 75, 46 80, 45 80 Z" fill="#451a03" />
              {/* Ears */}
              <circle cx="45" cy="85" r="6" fill="#fbcfe8" opacity="0.5" />
              <circle cx="45" cy="85" r="5" fill="#fed7aa" />
              <circle cx="105" cy="85" r="6" fill="#fbcfe8" opacity="0.5" />
              <circle cx="105" cy="85" r="5" fill="#fed7aa" />
              
              {/* Happy Eyes (with cheerful arc) */}
              <circle cx="64" cy="82" r="3.5" fill="#1e293b" />
              <circle cx="65.5" cy="80.5" r="1.2" fill="#ffffff" />
              <circle cx="86" cy="82" r="3.5" fill="#1e293b" />
              <circle cx="87.5" cy="80.5" r="1.2" fill="#ffffff" />
              {/* Cheerful Eyebrows */}
              <path d="M59 74 Q64 71 70 73" stroke="#451a03" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M80 73 Q86 71 91 74" stroke="#451a03" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Rosy Cheeks */}
              <ellipse cx="58" cy="91" rx="5" ry="3" fill="#f43f5e" opacity="0.3" />
              <ellipse cx="92" cy="91" rx="5" ry="3" fill="#f43f5e" opacity="0.3" />
              {/* Wide Smile */}
              <path d="M66 92 Q75 104 84 92" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" fill="#e11d48" />
              {/* Sparkle on Teeth */}
              <path d="M69 94 Q75 97 81 94" fill="#ffffff" />
            </g>

            {/* STUDENT 2: Joyful School Girl (Right) */}
            <g transform="translate(265, 80)">
              {/* Girl's Hair in Twin Braids / Ribbons */}
              {/* Left Pigtail */}
              <path d="M30 85 C15 95, 10 130, 20 145 C25 135, 30 115, 36 98 Z" fill="#1c1917" />
              <circle cx="20" cy="142" r="5" fill="#e11d48" />
              {/* Right Pigtail */}
              <path d="M100 85 C115 95, 120 130, 110 145 C105 135, 100 115, 94 98 Z" fill="#1c1917" />
              <circle cx="110" cy="142" r="5" fill="#e11d48" />

              {/* Body / School Uniform Pinafore / Skirt */}
              <path d="M42 125 L92 125 L105 210 L28 210 Z" fill="#0f2a4a" />
              {/* White Blouse Collar */}
              <polygon points="50,125 67,150 84,125" fill="#ffffff" />
              {/* Red Ribbon Bow */}
              <circle cx="67" cy="138" r="4.5" fill="#e11d48" />
              <path d="M63 138 L54 133 L57 145 Z" fill="#be123c" />
              <path d="M71 138 L80 133 L77 145 Z" fill="#be123c" />

              {/* Pleated Skirt (Tartan or Navy) */}
              <path d="M30 210 L104 210 L112 240 L22 240 Z" fill="#1e3a8a" />
              <line x1="45" y1="210" x2="42" y2="240" stroke="#172554" strokeWidth="2" />
              <line x1="67" y1="210" x2="67" y2="240" stroke="#172554" strokeWidth="2" />
              <line x1="89" y1="210" x2="92" y2="240" stroke="#172554" strokeWidth="2" />

              {/* Legs in White Knee-High Socks */}
              <rect x="42" y="240" width="18" height="35" rx="3" fill="#ffffff" />
              <rect x="74" y="240" width="18" height="35" rx="3" fill="#ffffff" />
              {/* Shoes */}
              <ellipse cx="50" cy="275" rx="14" ry="7" fill="#0f172a" />
              <ellipse cx="84" cy="275" rx="14" ry="7" fill="#0f172a" />

              {/* Left Arm holding diploma / certificate */}
              <path d="M38 135 L20 165 L32 175 L48 145" fill="#0f2a4a" />
              <circle cx="22" cy="172" r="6" fill="#fed7aa" />
              {/* Rolled Diploma Scroll with Ribbon */}
              <rect x="8" y="158" width="18" height="32" rx="4" transform="rotate(-25 8 158)" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
              <rect x="13" y="168" width="5" height="10" transform="rotate(-25 13 168)" fill="#e11d48" />

              {/* Right Arm Waving Joyfully! */}
              <path d="M96 135 L125 105 L135 115 L106 148" fill="#0f2a4a" />
              <circle cx="130" cy="106" r="7" fill="#fed7aa" />
              {/* Holding a Big Golden Star */}
              <g transform="translate(132, 85)">
                <polygon 
                  points="14,0 18,9 28,10 20,18 22,28 14,22 6,28 8,18 0,10 10,9" 
                  fill="#fbbf24" 
                  stroke="#d97706" 
                  strokeWidth="1.5" 
                />
              </g>

              {/* Head & Face */}
              <circle cx="67" cy="85" r="29" fill="#fed7aa" />
              {/* Girl's Hair (Dark with bangs) */}
              <path d="M38 80 C38 48, 70 42, 96 55 C100 66, 98 78, 96 82 C90 68, 75 66, 55 68 C45 72, 40 78, 38 80 Z" fill="#1c1917" />
              <path d="M48 68 C56 75, 78 75, 86 68" stroke="#1c1917" strokeWidth="5" strokeLinecap="round" />
              {/* Red Ribbon Headband */}
              <path d="M42 66 Q67 52 92 66" stroke="#e11d48" strokeWidth="4" fill="none" />
              <circle cx="88" cy="62" r="5" fill="#e11d48" />

              {/* Ears */}
              <circle cx="38" cy="85" r="5" fill="#fed7aa" />
              <circle cx="96" cy="85" r="5" fill="#fed7aa" />
              
              {/* Cheerful Blinking Eyes */}
              <circle cx="56" cy="82" r="3.5" fill="#1e293b" />
              <circle cx="57.5" cy="80.5" r="1.2" fill="#ffffff" />
              <circle cx="78" cy="82" r="3.5" fill="#1e293b" />
              <circle cx="79.5" cy="80.5" r="1.2" fill="#ffffff" />
              {/* Eyebrows */}
              <path d="M51 74 Q56 72 62 74" stroke="#1c1917" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <path d="M72 74 Q78 72 83 74" stroke="#1c1917" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              {/* Rosy Cheeks */}
              <ellipse cx="50" cy="91" rx="5" ry="3" fill="#f43f5e" opacity="0.35" />
              <ellipse cx="84" cy="91" rx="5" ry="3" fill="#f43f5e" opacity="0.35" />
              {/* Bright Happy Smile */}
              <path d="M59 92 Q67 103 75 92" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" fill="#e11d48" />
              <path d="M62 94 Q67 96 72 94" fill="#ffffff" />
            </g>

            {/* Floating Educational Tools around the kids */}
            {/* Floating Sharp Pencil */}
            <g transform="translate(390, 180) rotate(-35)">
              <rect x="0" y="0" width="12" height="60" fill="#f59e0b" rx="2" />
              <polygon points="0,60 12,60 6,75" fill="#fed7aa" />
              <polygon points="4,70 8,70 6,75" fill="#1e293b" />
              <rect x="0" y="-8" width="12" height="10" fill="#ec4899" rx="2" />
              <rect x="0" y="0" width="12" height="4" fill="#cbd5e1" />
            </g>

            {/* Floating Science / Idea Lightbulb */}
            <g transform="translate(60, 150)">
              <circle cx="16" cy="16" r="14" fill="#fef08a" opacity="0.9" />
              <circle cx="16" cy="16" r="18" fill="#fde047" opacity="0.25" />
              <path d="M12 28 L20 28 L19 33 L13 33 Z" fill="#94a3b8" />
              <path d="M12 16 Q16 10 20 16" stroke="#ca8a04" strokeWidth="1.5" fill="none" />
            </g>
          </svg>
        </motion.div>
      </div>

      {/* Bottom Educational Quality Assurance Strip */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-100/75 font-semibold">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Integrated Award Lists & Multi-Term Gazette</span>
        </div>
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-blue-300" />
          <span>Automated Examination Roll Number Slips</span>
        </div>
      </div>
    </div>
  );
}
