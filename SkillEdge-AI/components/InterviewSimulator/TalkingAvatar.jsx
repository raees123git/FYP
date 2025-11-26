"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TalkingAvatar({ isSpeaking }) {
  const [mouthOpen, setMouthOpen] = useState(0); // 0 to 1 for smooth animation
  const [blinkLeft, setBlinkLeft] = useState(false);
  const [blinkRight, setBlinkRight] = useState(false);
  const [headTilt, setHeadTilt] = useState(0);
  const [headY, setHeadY] = useState(0);

  // Lip sync animation when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(0);
      return;
    }

    const lipSyncInterval = setInterval(() => {
      setMouthOpen(Math.random() * 0.7 + 0.3); // Random between 0.3 and 1 for natural movement
    }, 120 + Math.random() * 80);

    return () => clearInterval(lipSyncInterval);
  }, [isSpeaking]);

  // Realistic blinking every 5 seconds
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkLeft(true);
      setBlinkRight(true);
      setTimeout(() => {
        setBlinkLeft(false);
        setBlinkRight(false);
      }, 180);
    }, 5000); // Blink every 5 seconds

    return () => clearInterval(blinkInterval);
  }, []);

  // Head movement when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setHeadTilt(0);
      setHeadY(0);
      return;
    }

    const headInterval = setInterval(() => {
      setHeadTilt(Math.random() * 4 - 2);
      setHeadY(Math.random() * 3 - 1.5);
    }, 1200);

    return () => clearInterval(headInterval);
  }, [isSpeaking]);

  return (
    <motion.div
      className="relative w-32 h-32 sm:w-48 sm:h-48"
      animate={{
        rotate: headTilt,
        y: headY,
      }}
      transition={{
        rotate: { duration: 0.8, ease: "easeInOut" },
        y: { duration: 0.8, ease: "easeInOut" },
      }}
    >
      {/* Avatar Face Container - Professional Male */}
      <div className="relative w-full h-full rounded-full border-4 border-primary overflow-hidden shadow-2xl">
        {/* Glow effect when speaking */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 bg-primary/20 rounded-full"
            />
          )}
        </AnimatePresence>

        {/* Realistic Face SVG */}
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          style={{ filter: "drop-shadow(1px 2px 4px rgba(0,0,0,0.15))" }}
        >
          <defs>
            {/* Gradients for mature skin tone */}
            <radialGradient id="skinGradient" cx="50%" cy="40%">
              <stop offset="0%" stopColor="#F4D4B3" />
              <stop offset="60%" stopColor="#E0C4A4" />
              <stop offset="100%" stopColor="#C9A882" />
            </radialGradient>
            
            <radialGradient id="shadowGradient" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
            </radialGradient>

            <linearGradient id="hairGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4A4A4A" />
              <stop offset="50%" stopColor="#3A3A3A" />
              <stop offset="100%" stopColor="#2A2A2A" />
            </linearGradient>

            <linearGradient id="grayHairGradient">
              <stop offset="0%" stopColor="#787878" />
              <stop offset="100%" stopColor="#5A5A5A" />
            </linearGradient>
          </defs>

          {/* Neck - thicker, more mature */}
          <rect x="72" y="158" width="56" height="42" fill="url(#skinGradient)" />
          <line x1="100" y1="165" x2="100" y2="180" stroke="#C9A882" strokeWidth="1.5" opacity="0.3" />
          
          {/* Professional shirt and tie */}
          <path
            d="M 62 178 L 72 165 L 85 178 L 85 200 L 62 200 Z"
            fill="#1e40af"
          />
          <path
            d="M 138 178 L 128 165 L 115 178 L 115 200 L 138 200 Z"
            fill="#1e40af"
          />
          <rect x="85" y="178" width="30" height="22" fill="#1e3a8a" />
          
          {/* Tie */}
          <path
            d="M 95 168 L 92 178 L 90 188 L 92 195 L 100 200 L 108 195 L 110 188 L 108 178 L 105 168 Z"
            fill="#991b1b"
            stroke="#7f1d1d"
            strokeWidth="1"
          />
          <path
            d="M 97 172 L 95 178 L 100 185 L 105 178 L 103 172 Z"
            fill="#7f1d1d"
            opacity="0.6"
          />

          {/* Head - More oval/realistic shape */}
          <ellipse
            cx="100"
            cy="95"
            rx="75"
            ry="85"
            fill="url(#skinGradient)"
          />

          {/* Facial structure shadows - cheekbones */}
          <ellipse
            cx="55"
            cy="100"
            rx="15"
            ry="25"
            fill="url(#shadowGradient)"
            opacity="0.35"
          />
          <ellipse
            cx="145"
            cy="100"
            rx="15"
            ry="25"
            fill="url(#shadowGradient)"
            opacity="0.35"
          />

          {/* Jawline shadow - more defined */}
          <ellipse
            cx="100"
            cy="140"
            rx="50"
            ry="20"
            fill="url(#shadowGradient)"
            opacity="0.2"
          />
          
          {/* Cheekbone highlights */}
          <ellipse
            cx="60"
            cy="95"
            rx="12"
            ry="8"
            fill="white"
            opacity="0.15"
          />
          <ellipse
            cx="140"
            cy="95"
            rx="12"
            ry="8"
            fill="white"
            opacity="0.15"
          />
          
          {/* Forehead highlight */}
          <ellipse
            cx="100"
            cy="65"
            rx="30"
            ry="20"
            fill="white"
            opacity="0.1"
          />

          {/* Mature professional hairstyle - shorter, graying */}
          <ellipse
            cx="100"
            cy="50"
            rx="76"
            ry="55"
            fill="url(#hairGradient)"
          />
          <path
            d="M 28 75 Q 25 65 32 55 Q 48 38 70 32 Q 90 28 110 32 Q 132 38 168 55 Q 175 65 172 75 L 168 85 Q 160 72 145 65 Q 120 58 100 58 Q 80 58 55 65 Q 40 72 32 85 Z"
            fill="url(#hairGradient)"
          />
          
          {/* Gray hair streaks at temples */}
          <path
            d="M 28 75 Q 30 68 35 63 L 40 70 Z"
            fill="url(#grayHairGradient)"
            opacity="0.8"
          />
          <path
            d="M 172 75 Q 170 68 165 63 L 160 70 Z"
            fill="url(#grayHairGradient)"
            opacity="0.8"
          />
          
          {/* Receding hairline - more forehead visible */}
          <ellipse
            cx="100"
            cy="65"
            rx="68"
            ry="48"
            fill="url(#skinGradient)"
          />
          
          {/* Hair over receding area */}
          <ellipse
            cx="100"
            cy="48"
            rx="72"
            ry="50"
            fill="url(#hairGradient)"
          />
          
          {/* Hair texture - graying effect */}
          <path
            d="M 65 48 Q 80 45 100 44 Q 120 45 135 48"
            stroke="rgba(150,150,150,0.3)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 50 58 Q 60 55 70 54"
            stroke="rgba(150,150,150,0.4)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 130 54 Q 140 55 150 58"
            stroke="rgba(150,150,150,0.4)"
            strokeWidth="2"
            fill="none"
          />

          {/* Ears - more detailed */}
          <g>
            <ellipse cx="20" cy="95" rx="12" ry="20" fill="#E0C4A4" />
            <ellipse cx="20" cy="95" rx="7" ry="12" fill="#D4A882" />
            <ellipse cx="20" cy="95" rx="4" ry="7" fill="#C9A882" />
            <path d="M 20 88 Q 22 95 20 102" stroke="#B89872" strokeWidth="0.8" fill="none" opacity="0.5" />
          </g>
          <g>
            <ellipse cx="180" cy="95" rx="12" ry="20" fill="#E0C4A4" />
            <ellipse cx="180" cy="95" rx="7" ry="12" fill="#D4A882" />
            <ellipse cx="180" cy="95" rx="4" ry="7" fill="#C9A882" />
            <path d="M 180 88 Q 178 95 180 102" stroke="#B89872" strokeWidth="0.8" fill="none" opacity="0.5" />
          </g>
          
          {/* Professional glasses - adds authority */}
          <g opacity="0.85">
            {/* Left lens */}
            <ellipse cx="65" cy="88" rx="18" ry="16" fill="none" stroke="#2A2A2A" strokeWidth="3" />
            <ellipse cx="65" cy="88" rx="18" ry="16" fill="white" opacity="0.05" />
            <ellipse cx="68" cy="85" rx="4" ry="3" fill="white" opacity="0.4" />
            
            {/* Right lens */}
            <ellipse cx="135" cy="88" rx="18" ry="16" fill="none" stroke="#2A2A2A" strokeWidth="3" />
            <ellipse cx="135" cy="88" rx="18" ry="16" fill="white" opacity="0.05" />
            <ellipse cx="138" cy="85" rx="4" ry="3" fill="white" opacity="0.4" />
            
            {/* Bridge */}
            <path d="M 83 88 L 117 88" stroke="#2A2A2A" strokeWidth="2.5" fill="none" />
            
            {/* Temples/Arms */}
            <path d="M 47 88 L 20 95" stroke="#2A2A2A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 153 88 L 180 95" stroke="#2A2A2A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>

          {/* Eyebrows - thicker, mature, slightly graying */}
          <path
            d="M 48 78 Q 58 74 72 76"
            stroke="#3A3A3A"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 52 79 Q 60 76 68 77"
            stroke="#656565"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M 128 76 Q 142 74 152 78"
            stroke="#3A3A3A"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 132 77 Q 140 76 148 79"
            stroke="#656565"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Left Eye - more realistic */}
          <g>
            {/* Eye socket shadow */}
            <ellipse
              cx="65"
              cy="88"
              rx="18"
              ry="14"
              fill="url(#shadowGradient)"
              opacity="0.15"
            />
            {/* Eye white with slight veins/texture */}
            <ellipse
              cx="65"
              cy="88"
              rx="15"
              ry={blinkLeft ? "2" : "12"}
              fill="#FAF9F6"
              stroke="#E8D5C4"
              strokeWidth="0.5"
            />
            {!blinkLeft && (
              <>
                {/* Iris outer ring */}
                <circle cx="65" cy="88" r="9" fill="#4A6F7F" />
                {/* Iris pattern */}
                <circle cx="65" cy="88" r="7.5" fill="#3B5F70" />
                <circle cx="65" cy="88" r="6" fill="#2C4A5A" opacity="0.8" />
                {/* Pupil */}
                <circle cx="65" cy="88" r="4" fill="#000" />
                {/* Light reflections - more prominent */}
                <circle cx="67" cy="86" r="2.5" fill="white" opacity="0.95" />
                <circle cx="64" cy="90" r="1.2" fill="white" opacity="0.6" />
                {/* Iris detail lines */}
                <circle cx="65" cy="88" r="5" fill="none" stroke="#234555" strokeWidth="0.5" opacity="0.4" />
              </>
            )}
            {/* Upper eyelid */}
            {!blinkLeft && (
              <>
                <ellipse
                  cx="65"
                  cy="81"
                  rx="15"
                  ry="5"
                  fill="#D4A882"
                  opacity="0.5"
                />
                <path
                  d="M 50 88 Q 65 82 80 88"
                  stroke="#B89872"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.6"
                />
              </>
            )}
            {/* Lower eyelid */}
            {!blinkLeft && (
              <path
                d="M 50 88 Q 65 92 80 88"
                stroke="#D4A882"
                strokeWidth="1"
                fill="none"
                opacity="0.4"
              />
            )}
            {/* Eye lashes - upper */}
            {!blinkLeft && (
              <path
                d="M 55 83 L 54 80 M 60 81 L 60 78 M 65 80 L 65 77 M 70 81 L 70 78 M 75 83 L 76 80"
                stroke="#2A2A2A"
                strokeWidth="0.8"
                strokeLinecap="round"
                opacity="0.7"
              />
            )}
          </g>

          {/* Right Eye */}
          <g>
            {/* Eye socket shadow */}
            <ellipse
              cx="135"
              cy="88"
              rx="18"
              ry="14"
              fill="url(#shadowGradient)"
              opacity="0.15"
            />
            {/* Eye white with slight veins/texture */}
            <ellipse
              cx="135"
              cy="88"
              rx="15"
              ry={blinkRight ? "2" : "12"}
              fill="#FAF9F6"
              stroke="#E8D5C4"
              strokeWidth="0.5"
            />
            {!blinkRight && (
              <>
                {/* Iris outer ring */}
                <circle cx="135" cy="88" r="9" fill="#4A6F7F" />
                {/* Iris pattern */}
                <circle cx="135" cy="88" r="7.5" fill="#3B5F70" />
                <circle cx="135" cy="88" r="6" fill="#2C4A5A" opacity="0.8" />
                {/* Pupil */}
                <circle cx="135" cy="88" r="4" fill="#000" />
                {/* Light reflections - more prominent */}
                <circle cx="137" cy="86" r="2.5" fill="white" opacity="0.95" />
                <circle cx="134" cy="90" r="1.2" fill="white" opacity="0.6" />
                {/* Iris detail lines */}
                <circle cx="135" cy="88" r="5" fill="none" stroke="#234555" strokeWidth="0.5" opacity="0.4" />
              </>
            )}
            {/* Upper eyelid */}
            {!blinkRight && (
              <>
                <ellipse
                  cx="135"
                  cy="81"
                  rx="15"
                  ry="5"
                  fill="#D4A882"
                  opacity="0.5"
                />
                <path
                  d="M 120 88 Q 135 82 150 88"
                  stroke="#B89872"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.6"
                />
              </>
            )}
            {/* Lower eyelid */}
            {!blinkRight && (
              <path
                d="M 120 88 Q 135 92 150 88"
                stroke="#D4A882"
                strokeWidth="1"
                fill="none"
                opacity="0.4"
              />
            )}
            {/* Eye lashes - upper */}
            {!blinkRight && (
              <path
                d="M 125 83 L 124 80 M 130 81 L 130 78 M 135 80 L 135 77 M 140 81 L 140 78 M 145 83 L 146 80"
                stroke="#2A2A2A"
                strokeWidth="0.8"
                strokeLinecap="round"
                opacity="0.7"
              />
            )}
          </g>

          {/* Nose - larger, more prominent (mature feature) */}
          <g>
            {/* Nose bridge */}
            <path
              d="M 98 80 L 96 110"
              stroke="#C9A882"
              strokeWidth="3"
              fill="none"
              opacity="0.5"
            />
            {/* Nose tip - larger */}
            <ellipse cx="100" cy="113" rx="10" ry="12" fill="#D4B494" />
            {/* Nostrils - larger */}
            <ellipse cx="92" cy="118" rx="4" ry="5" fill="#B4957A" opacity="0.8" />
            <ellipse cx="108" cy="118" rx="4" ry="5" fill="#B4957A" opacity="0.8" />
            {/* Nose highlight */}
            <ellipse cx="100" cy="109" rx="5" ry="6" fill="white" opacity="0.25" />
            {/* Nose shadow */}
            <ellipse cx="100" cy="120" rx="14" ry="4" fill="url(#shadowGradient)" opacity="0.3" />
          </g>

          {/* Mouth - Realistic lip-sync (positioned lower for mature face) */}
          <g>
            {mouthOpen > 0.4 && isSpeaking ? (
              <>
                {/* Open mouth */}
                <ellipse
                  cx="100"
                  cy="142"
                  rx={22 + mouthOpen * 5}
                  ry={9 + mouthOpen * 12}
                  fill="#5C2929"
                />
                {/* Tongue */}
                <ellipse
                  cx="100"
                  cy={146 + mouthOpen * 3}
                  rx="16"
                  ry="7"
                  fill="#D86B6B"
                  opacity="0.8"
                />
                {/* Upper teeth */}
                <rect x="82" y="136" width="36" height="6" fill="#F8F8F0" rx="2" opacity="0.95" />
                {/* Teeth separation lines */}
                <line x1="91" y1="136" x2="91" y2="142" stroke="#E8E8E0" strokeWidth="1" />
                <line x1="100" y1="136" x2="100" y2="142" stroke="#E8E8E0" strokeWidth="1" />
                <line x1="109" y1="136" x2="109" y2="142" stroke="#E8E8E0" strokeWidth="1" />
                {/* Lower teeth */}
                <rect x="86" y={147 + mouthOpen * 4} width="28" height="5" fill="#F8F8F0" rx="2" opacity="0.85" />
              </>
            ) : (
              <>
                {/* Closed/slightly open mouth */}
                {/* Upper lip - slightly thinner for mature look */}
                <path
                  d={`M 73 139 Q 82 ${137 - mouthOpen * 2} 100 ${136 - mouthOpen * 3} Q 118 ${137 - mouthOpen * 2} 127 139`}
                  fill="#A85C5C"
                  stroke="#8B4545"
                  strokeWidth="1.5"
                />
                {/* Lower lip */}
                <path
                  d={`M 75 140 Q 88 ${146 + mouthOpen * 3} 100 ${147 + mouthOpen * 4} Q 112 ${146 + mouthOpen * 3} 125 140`}
                  fill="#B86B6B"
                  stroke="#A85C5C"
                  strokeWidth="1.5"
                />
                {/* Lip highlight */}
                <path
                  d={`M 88 ${144 + mouthOpen * 2} Q 100 ${145 + mouthOpen * 3} 112 ${144 + mouthOpen * 2}`}
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.25"
                  strokeLinecap="round"
                />
              </>
            )}
          </g>

          {/* Wrinkles and age lines - more prominent */}
          {/* Crow's feet around eyes - multiple lines */}
          <g opacity="0.5">
            <path d="M 82 80 L 86 77" stroke="#B89872" strokeWidth="0.8" />
            <path d="M 83 84 L 87 82" stroke="#B89872" strokeWidth="0.8" />
            <path d="M 83 88 L 87 88" stroke="#B89872" strokeWidth="0.8" />
            <path d="M 82 92 L 86 93" stroke="#B89872" strokeWidth="0.8" />
          </g>
          <g opacity="0.5">
            <path d="M 118 80 L 114 77" stroke="#B89872" strokeWidth="0.8" />
            <path d="M 117 84 L 113 82" stroke="#B89872" strokeWidth="0.8" />
            <path d="M 117 88 L 113 88" stroke="#B89872" strokeWidth="0.8" />
            <path d="M 118 92 L 114 93" stroke="#B89872" strokeWidth="0.8" />
          </g>
          
          {/* Forehead lines - worry lines */}
          <path
            d="M 68 68 Q 100 66 132 68"
            stroke="#B89872"
            strokeWidth="1.2"
            fill="none"
            opacity="0.35"
          />
          <path
            d="M 65 63 Q 100 61 135 63"
            stroke="#B89872"
            strokeWidth="1"
            fill="none"
            opacity="0.3"
          />
          <path
            d="M 70 72 Q 100 70 130 72"
            stroke="#B89872"
            strokeWidth="0.8"
            fill="none"
            opacity="0.25"
          />
          
          {/* Glabella lines (between eyebrows) */}
          <path
            d="M 98 75 L 97 78"
            stroke="#B89872"
            strokeWidth="1"
            opacity="0.3"
          />
          <path
            d="M 102 75 L 103 78"
            stroke="#B89872"
            strokeWidth="1"
            opacity="0.3"
          />
          
          {/* Nasolabial folds (smile lines) */}
          <path
            d="M 92 118 Q 85 128 82 140"
            stroke="#C9A882"
            strokeWidth="2"
            fill="none"
            opacity="0.35"
          />
          <path
            d="M 108 118 Q 115 128 118 140"
            stroke="#C9A882"
            strokeWidth="2"
            fill="none"
            opacity="0.35"
          />

          {/* Facial hair - well-groomed beard/stubble */}
          <ellipse
            cx="100"
            cy="148"
            rx="48"
            ry="28"
            fill="#3A3A3A"
            opacity="0.15"
          />
          <ellipse
            cx="100"
            cy="155"
            rx="42"
            ry="22"
            fill="#2A2A2A"
            opacity="0.18"
          />
          
          {/* Gray patches in beard */}
          <ellipse
            cx="85"
            cy="152"
            rx="8"
            ry="6"
            fill="#707070"
            opacity="0.12"
          />
          <ellipse
            cx="115"
            cy="152"
            rx="8"
            ry="6"
            fill="#707070"
            opacity="0.12"
          />

          {/* Chin definition - stronger jawline */}
          <ellipse
            cx="100"
            cy="162"
            rx="35"
            ry="18"
            fill="url(#shadowGradient)"
            opacity="0.25"
          />
        </svg>

        {/* Sound waves effect when speaking */}
        <AnimatePresence>
          {isSpeaking && (
            <>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1.6, opacity: [0, 0.25, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                className="absolute inset-0 rounded-full border-2 border-primary"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1.6, opacity: [0, 0.25, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                className="absolute inset-0 rounded-full border-2 border-accent"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1.6, opacity: [0, 0.25, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }}
                className="absolute inset-0 rounded-full border-2 border-primary/60"
              />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Status indicator */}
      <motion.div
        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg"
        animate={{
          backgroundColor: isSpeaking
            ? "rgb(34, 197, 94)"
            : "rgb(100, 116, 139)",
        }}
        transition={{ duration: 0.3 }}
      >
        <span className="text-white flex items-center gap-1.5">
          {isSpeaking && (
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-white rounded-full"
            />
          )}
          {isSpeaking ? "Interviewer Speaking" : "Ready to Listen"}
        </span>
      </motion.div>
    </motion.div>
  );
}
