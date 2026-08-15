import React from 'react';

interface MediSathiLogoProps {
  size?: number;
  className?: string;
  variant?: 'light' | 'dark' | 'adaptive';
  showText?: boolean;
}

export function MediSathiLogo({
  size = 36,
  className = '',
  variant = 'adaptive',
  showText = true,
}: MediSathiLogoProps) {
  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Iconic Emblem */}
      <div
        style={{ width: size, height: size }}
        className={`relative inline-flex shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${
          isDark
            ? 'border border-[#2A4E49] bg-gradient-to-br from-[#102F2B] to-[#0F766E] text-[#5EEAD4] shadow-lg shadow-[#0F766E]/20'
            : 'bg-[#0F766E] text-[#FFFFFF] shadow-md shadow-[#0F766E]/20'
        }`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-3/4"
          aria-hidden="true"
        >
          {/* Medical Cross */}
          <path
            d="M16 8V24M10 16H22"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Concentric Voice Waveform Arcs */}
          <path
            d="M6 12C4.7 13.1 4 14.7 4 16.5C4 18.3 4.7 19.9 6 21"
            stroke="#5EEAD4"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d="M26 12C27.3 13.1 28 14.7 28 16.5C28 18.3 27.3 19.9 26 21"
            stroke="#5EEAD4"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* Companion Dot */}
          <circle cx="16" cy="16" r="1.5" fill={isDark ? '#FFFFFF' : '#D6A756'} />
        </svg>
      </div>

      {/* Uppercase MEDISATHI Brand Name */}
      {showText && (
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span
              className={`font-heading text-xl font-extrabold tracking-wider ${
                isDark ? 'text-[#F5FAF9]' : 'text-[#16302D]'
              }`}
            >
              MEDISATHI
            </span>
            <span
              className={`hidden rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase sm:inline-block ${
                isDark
                  ? 'border border-[#2A4E49] bg-[#163A35] text-[#5EEAD4]'
                  : 'border border-[#D6E5E1] bg-[#EEF5F3] text-[#0F766E]'
              }`}
            >
              Voice Health AI
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
