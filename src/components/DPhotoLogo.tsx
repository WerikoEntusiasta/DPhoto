import React from 'react';

interface DPhotoLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  lightText?: boolean;
}

export const DPhotoLogo: React.FC<DPhotoLogoProps> = ({
  size = 'md',
  showText = true,
  lightText = false
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const badgeSizes = {
    sm: 'text-[9px] px-1.5 py-0.5',
    md: 'text-[10px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1',
    xl: 'text-xs px-3 py-1'
  };

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Visual Logo Mark */}
      <div
        className={`${iconSizes[size]} relative rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white font-black tracking-tighter shadow-md shadow-indigo-500/20 border border-indigo-400/30 overflow-hidden group-hover:scale-105 transition-all duration-300`}
      >
        {/* Stylized Lens / Aperture Lines Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent)]" />
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5 text-white drop-shadow-xs z-10"
        >
          {/* Stylized camera lens & letter D shutter */}
          <path
            d="M8 6C8 4.89543 8.89543 4 10 4H18C22.4183 4 26 7.58172 26 12V20C26 24.4183 22.4183 28 18 28H10C8.89543 28 8 27.1046 8 26V6Z"
            fill="currentColor"
            fillOpacity="0.25"
          />
          <path
            d="M6 10C6 8.89543 6.89543 8 8 8H16C20.4183 8 24 11.5817 24 16C24 20.4183 20.4183 24 16 24H8C6.89543 24 6 23.1046 6 22V10Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="14" cy="16" r="3.5" fill="currentColor" />
          <path d="M19 11L17.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`${textSizes[size]} font-black tracking-tight ${
                lightText ? 'text-white' : 'text-slate-900'
              } font-sans`}
            >
              D<span className="text-indigo-600">Photo</span>
            </span>
            <span
              className={`${badgeSizes[size]} rounded-full font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-200/60`}
            >
              Pro
            </span>
          </div>
          <span
            className={`text-[10px] font-semibold tracking-wider uppercase ${
              lightText ? 'text-indigo-300' : 'text-slate-500'
            } -mt-0.5`}
          >
            Plataforma para Fotógrafos
          </span>
        </div>
      )}
    </div>
  );
};
