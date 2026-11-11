'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface InteractiveStudentMascotProps {
  focusedField: 'email' | 'password' | null;
  showPassword: boolean;
  emailLength: number;
}

export function InteractiveStudentMascot({
  focusedField,
  showPassword,
  emailLength,
}: InteractiveStudentMascotProps) {
  // Calculate eye look position based on email text length
  const pupilX = focusedField === 'email' 
    ? Math.min(Math.max((emailLength - 12) * 0.35, -4.5), 4.5) 
    : 0;
  
  const pupilY = focusedField === 'email' ? 3.5 : 0;

  const isCoveringEyes = focusedField === 'password' && !showPassword;
  const isPeeking = focusedField === 'password' && showPassword;

  return (
    <div className="relative w-44 h-40 sm:w-48 sm:h-44 mx-auto flex items-center justify-center select-none pointer-events-none">
      <svg 
        viewBox="0 0 200 180" 
        className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)] overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft Shadow on Floor */}
        <ellipse cx="100" cy="172" rx="65" ry="8" fill="#000" opacity="0.25" />

        {/* ======================================================== */}
        {/* School Uniform Body (The Spirit School Navy Blazer & Tie) */}
        {/* ======================================================== */}
        <g id="body">
          {/* Shoulders & Blazer */}
          <path 
            d="M50 145 C50 120, 150 120, 150 145 L158 175 L42 175 Z" 
            fill="#0f2a4a" 
          />
          {/* White Shirt Collar */}
          <polygon points="80,128 100,150 120,128" fill="#ffffff" />
          {/* Red / Maroon School Tie */}
          <polygon points="96,134 104,134 106,168 100,175 94,168" fill="#c81e28" />
          <polygon points="95,130 105,130 107,136 93,136" fill="#991b1b" />
          {/* Gold Pocket Crest */}
          <rect x="62" y="148" width="12" height="14" rx="2" fill="#1e3a8a" stroke="#f59e0b" strokeWidth="1" />
          <path d="M68 150 L68 159" stroke="#f59e0b" strokeWidth="1.2" />
        </g>

        {/* ======================================================== */}
        {/* Head & Face */}
        {/* ======================================================== */}
        <g id="head">
          {/* Ears */}
          <circle cx="56" cy="85" r="9" fill="#fbcfe8" opacity="0.4" />
          <circle cx="56" cy="85" r="7.5" fill="#fcd34d" />
          <circle cx="144" cy="85" r="9" fill="#fbcfe8" opacity="0.4" />
          <circle cx="144" cy="85" r="7.5" fill="#fcd34d" />

          {/* Main Face Contour (Warm Friendly Tone) */}
          <ellipse cx="100" cy="85" rx="44" ry="42" fill="#fed7aa" />

          {/* Hair (Neat School Cut) */}
          <path 
            d="M56 75 C56 42, 144 42, 144 75 C146 88, 142 98, 140 100 C132 82, 118 80, 100 82 C82 80, 68 82, 60 100 C58 98, 54 88, 56 75 Z" 
            fill="#451a03" 
          />
          {/* Front Hair Bangs */}
          <path 
            d="M62 70 Q82 60 100 72 Q118 60 138 70" 
            stroke="#451a03" 
            strokeWidth="8" 
            strokeLinecap="round" 
            fill="none" 
          />

          {/* Graduation Cap (Tilted on top) */}
          <g transform="translate(100, 36) rotate(-6)">
            {/* Cap Diamond */}
            <polygon points="0,-16 48,-6 0,4 -48,-6" fill="#0f172a" />
            <polygon points="0,-13 42,-5 0,3 -42,-5" fill="#1e293b" />
            {/* Skull Cap Base */}
            <path d="M-22,-4 C-22,8 22,8 22,-4 Z" fill="#0f172a" />
            {/* Gold Button & Tassel */}
            <circle cx="0" cy="-6" r="3" fill="#f59e0b" />
            <path d="M0,-6 C12,-4 26,0 28,14" stroke="#f59e0b" strokeWidth="2" fill="none" />
            <polygon points="26,14 30,14 31,24 25,24" fill="#d97706" />
          </g>

          {/* Cheerful Eyebrows */}
          <motion.path 
            animate={{
              y: isCoveringEyes ? -2 : isPeeking ? -3 : 0,
              rotate: isPeeking ? 4 : 0
            }}
            d="M74 70 Q82 66 90 70" 
            stroke="#451a03" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none" 
          />
          <motion.path 
            animate={{
              y: isCoveringEyes ? -2 : isPeeking ? -4 : 0,
              rotate: isPeeking ? -5 : 0
            }}
            d="M110 70 Q118 66 126 70" 
            stroke="#451a03" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none" 
          />

          {/* Rosy Cheeks */}
          <ellipse cx="72" cy="95" rx="7" ry="4" fill="#f43f5e" opacity="0.35" />
          <ellipse cx="128" cy="95" rx="7" ry="4" fill="#f43f5e" opacity="0.35" />

          {/* ======================================================== */}
          {/* Eyes & Pupils (Interactive Gaze & Blink) */}
          {/* ======================================================== */}
          
          {/* Left Eye Sockets */}
          <ellipse cx="80" cy="84" rx="8" ry="9" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.8" />
          {/* Right Eye Sockets */}
          <ellipse cx="120" cy="84" rx="8" ry="9" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.8" />

          {/* Left Pupil (Animated Tracking) */}
          <motion.g
            animate={{
              x: pupilX,
              y: pupilY,
              scaleY: isCoveringEyes ? 0.1 : 1
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <circle cx="80" cy="84" r="5" fill="#0f172a" />
            <circle cx="82" cy="82" r="1.8" fill="#ffffff" />
          </motion.g>

          {/* Right Pupil (Animated Tracking or Winking) */}
          <motion.g
            animate={{
              x: pupilX,
              y: isPeeking ? 1 : pupilY,
              scaleY: isCoveringEyes ? 0.1 : 1
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <circle cx="120" cy="84" r="5" fill="#0f172a" />
            <circle cx="122" cy="82" r="1.8" fill="#ffffff" />
          </motion.g>

          {/* Dynamic Mouth / Smile */}
          <motion.g
            animate={{
              scale: isCoveringEyes ? 0.9 : 1
            }}
          >
            {isCoveringEyes ? (
              // Shy cute grin when covering eyes
              <path 
                d="M93 102 Q100 106 107 102" 
                stroke="#991b1b" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                fill="none" 
              />
            ) : isPeeking ? (
              // Cheeky smirk when peeking
              <path 
                d="M92 101 Q101 108 109 99" 
                stroke="#991b1b" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                fill="none" 
              />
            ) : (
              // Big bright happy student smile
              <>
                <path 
                  d="M90 98 Q100 112 110 98" 
                  stroke="#991b1b" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  fill="#e11d48" 
                />
                <path d="M93 100 Q100 103 107 100" fill="#ffffff" />
              </>
            )}
          </motion.g>
        </g>

        {/* ======================================================== */}
        {/* Animated Hands (Slide up to Cover Eyes on Password!) */}
        {/* ======================================================== */}
        
        {/* Left Hand */}
        <motion.g
          animate={
            isCoveringEyes
              ? { x: 0, y: -44, opacity: 1, rotate: 12 }
              : isPeeking
              ? { x: 0, y: -44, opacity: 1, rotate: 12 } // keeps covering left eye
              : { x: 0, y: 15, opacity: 0, rotate: 0 } // lowered
          }
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          style={{ transformOrigin: "75px 140px" }}
        >
          {/* Sleeve (Navy Blazer) */}
          <path d="M50 148 L70 120 L84 130 L66 156 Z" fill="#0f2a4a" />
          {/* Hand Palm & Fingers */}
          <circle cx="78" cy="120" r="13" fill="#fed7aa" />
          <circle cx="74" cy="114" r="5" fill="#fcd34d" />
          <circle cx="80" cy="112" r="5" fill="#fcd34d" />
          <circle cx="86" cy="115" r="4.5" fill="#fcd34d" />
          {/* Thumb */}
          <ellipse cx="86" cy="125" rx="4" ry="6" fill="#fed7aa" transform="rotate(20 86 125)" />
        </motion.g>

        {/* Right Hand */}
        <motion.g
          animate={
            isCoveringEyes
              ? { x: 0, y: -44, opacity: 1, rotate: -12 } // covers right eye
              : isPeeking
              ? { x: 8, y: -18, opacity: 1, rotate: -25 } // lowered slightly to PEEK!
              : { x: 0, y: 15, opacity: 0, rotate: 0 } // lowered
          }
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          style={{ transformOrigin: "125px 140px" }}
        >
          {/* Sleeve (Navy Blazer) */}
          <path d="M150 148 L130 120 L116 130 L134 156 Z" fill="#0f2a4a" />
          {/* Hand Palm & Fingers */}
          <circle cx="122" cy="120" r="13" fill="#fed7aa" />
          <circle cx="126" cy="114" r="5" fill="#fcd34d" />
          <circle cx="120" cy="112" r="5" fill="#fcd34d" />
          <circle cx="114" cy="115" r="4.5" fill="#fcd34d" />
          {/* Thumb */}
          <ellipse cx="114" cy="125" rx="4" ry="6" fill="#fed7aa" transform="rotate(-20 114 125)" />
        </motion.g>
      </svg>

      {/* Floating State Feedback Pill */}
      {isCoveringEyes && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute -bottom-2 bg-slate-900/90 text-amber-300 font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-amber-400/40 shadow-md backdrop-blur-sm"
        >
          🙈 Shh! Secure Password Mode
        </motion.div>
      )}

      {isPeeking && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute -bottom-2 bg-slate-900/90 text-emerald-300 font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-400/40 shadow-md backdrop-blur-sm"
        >
          👀 Peeking! Password Visible
        </motion.div>
      )}
    </div>
  );
}
