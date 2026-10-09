import React from 'react';

interface BrandLogoProps {
  collapsed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  collapsed = false,
  className = '',
  size = 'md',
}) => {
  const iconDimensions = {
    sm: { container: 'w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px]', svg: 18 },
    md: { container: 'w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px]', svg: 24 },
    lg: { container: 'w-11 h-11 min-w-[44px] min-h-[44px] max-w-[44px] max-h-[44px]', svg: 28 },
  };

  const dim = iconDimensions[size] || iconDimensions.md;

  return (
    <div className={`flex items-center gap-3 select-none shrink-0 ${className}`}>
      {/* Dynamic Modern W-Drop Icon */}
      <div
        className={`relative shrink-0 ${dim.container} rounded-xl flex items-center justify-center bg-gradient-to-tr from-primary-600 via-primary-500 to-secondary-400 p-[2px] shadow-glow-blue transition-transform duration-300 hover:scale-105 overflow-hidden`}
        style={{ width: `${dim.svg + 12}px`, height: `${dim.svg + 12}px` }}
      >
        <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center overflow-hidden relative">
          {/* Subtle water ripple background glow */}
          <div className="absolute inset-0 bg-washora-gradient-subtle opacity-70" />
          
          <svg
            viewBox="0 0 40 40"
            width={dim.svg}
            height={dim.svg}
            style={{ width: `${dim.svg}px`, height: `${dim.svg}px`, maxWidth: `${dim.svg}px`, maxHeight: `${dim.svg}px` }}
            className="z-10 shrink-0"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft backdrop swirl */}
            <path
              d="M8 20C8 13.3726 13.3726 8 20 8C26.6274 8 32 13.3726 32 20C32 26.6274 26.6274 32 20 32"
              stroke="url(#drop-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4 6"
              className="opacity-40"
            />
            {/* The crisp modern "W" formed by stylized garment folds & water droplet flow */}
            <path
              d="M10 14L15 28L20 18L25 28L30 14"
              stroke="url(#w-grad)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Droplet accent at peak */}
            <circle cx="20" cy="11" r="2.2" fill="#06B6D4" />

            <defs>
              <linearGradient id="w-grad" x1="10" y1="14" x2="30" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2563EB" />
                <stop offset="1" stopColor="#06B6D4" />
              </linearGradient>
              <linearGradient id="drop-grad" x1="8" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3B82F6" />
                <stop offset="1" stopColor="#22D3EE" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Wordmark and Tagline */}
      {!collapsed && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              Washora
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950/70 dark:text-primary-400 border border-primary-200/50">
              SaaS
            </span>
          </div>
          <span className="text-[10.5px] font-medium tracking-tight text-slate-500 dark:text-slate-400">
            Complete Laundry Business Management
          </span>
        </div>
      )}
    </div>
  );
};
