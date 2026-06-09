import React from 'react';

const commonProps = (size, className, fill ="none") => ({
 width: size,
 height: size,
 viewBox:"0 0 24 24",
 fill: fill ==="currentColor" ?"currentColor" : fill,
 stroke:"currentColor",
 strokeWidth:"2",
 strokeLinecap:"round",
 strokeLinejoin:"round",
 className
});

export const BoxyPlay = ({ size = 24, className ="", fill }) => (
 <svg {...commonProps(size, className, fill)}>
 <polygon points="5 3 19 12 5 21 5 3" />
 </svg>
);

export const BoxyPause = ({ size = 24, className ="", fill }) => (
 <svg {...commonProps(size, className, fill)}>
 <rect x="6" y="4" width="4" height="16" />
 <rect x="14" y="4" width="4" height="16" />
 </svg>
);

export const BoxyInfo = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <circle cx="12" cy="12" r="10" />
 <line x1="12" y1="16" x2="12" y2="12" />
 <line x1="12" y1="8" x2="12.01" y2="8" />
 </svg>
);

export const BoxyClock = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <circle cx="12" cy="12" r="10" />
 <polyline points="12 6 12 12 16 14" />
 </svg>
);

export const BoxySearch = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <circle cx="11" cy="11" r="8" />
 <line x1="21" y1="21" x2="16.65" y2="16.65" />
 </svg>
);

export const BoxyUser = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
 <circle cx="12" cy="7" r="4" />
 </svg>
);

export const BoxyHeart = ({ size = 24, className ="", fill }) => (
 <svg {...commonProps(size, className, fill)}>
 <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
 </svg>
);

export const BoxyMessage = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
 </svg>
);

export const BoxyBookmark = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
 </svg>
);

export const BoxyShield = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
 </svg>
);

export const BoxyStar = ({ size = 24, className ="", fill }) => (
 <svg {...commonProps(size, className, fill)}>
 <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
 </svg>
);

export const BoxyChevron = ({ size = 24, className ="", direction ="right" }) => {
 const rotations = { right:"0", left:"180", up:"270", down:"90" };
 return (
 <svg {...commonProps(size, className)} style={{ transform: `rotate(${rotations[direction]}deg)` }}>
 <polyline points="9 18 15 12 9 6" />
 </svg>
 );
};

export const BoxyPlus = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <line x1="12" y1="5" x2="12" y2="19" />
 <line x1="5" y1="12" x2="19" y2="12" />
 </svg>
);

export const BoxyLogOut = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
 <polyline points="16 17 21 12 16 7" />
 <line x1="21" y1="12" x2="9" y2="12" />
 </svg>
);

export const BoxyList = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <line x1="8" y1="6" x2="21" y2="6" />
 <line x1="8" y1="12" x2="21" y2="12" />
 <line x1="8" y1="18" x2="21" y2="18" />
 <line x1="3" y1="6" x2="3.01" y2="6" />
 <line x1="3" y1="12" x2="3.01" y2="12" />
 <line x1="3" y1="18" x2="3.01" y2="18" />
 </svg>
);

export const BoxyShare = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <circle cx="18" cy="5" r="3" />
 <circle cx="6" cy="12" r="3" />
 <circle cx="18" cy="19" r="3" />
 <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
 <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
 </svg>
);

export const BoxyCalendar = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
 <line x1="16" y1="2" x2="16" y2="6" />
 <line x1="8" y1="2" x2="8" y2="6" />
 <line x1="3" y1="10" x2="21" y2="10" />
 </svg>
);

export const BoxyAlert = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
 <line x1="12" y1="9" x2="12" y2="13" />
 <line x1="12" y1="17" x2="12.01" y2="17" />
 </svg>
);

export const BoxyMenu = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <line x1="3" y1="12" x2="21" y2="12" />
 <line x1="3" y1="6" x2="21" y2="6" />
 <line x1="3" y1="18" x2="21" y2="18" />
 </svg>
);

export const BoxyX = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <line x1="18" y1="6" x2="6" y2="18" />
 <line x1="6" y1="6" x2="18" y2="18" />
 </svg>
);

export const BoxyEdit = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
 <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
 </svg>
);

export const BoxyCheck = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <polyline points="20 6 9 17 4 12" />
 </svg>
);

export const BoxyThumbsUp = ({ size = 24, className ="", fill }) => (
 <svg {...commonProps(size, className, fill)}>
 <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
 </svg>
);

export const BoxyCreditCard = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
 <line x1="1" y1="10" x2="23" y2="10" />
 </svg>
);

export const BoxyHelp = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <circle cx="12" cy="12" r="10" />
 <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
 <line x1="12" y1="17" x2="12.01" y2="17" />
 </svg>
);

export const BoxyExternal = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
 <polyline points="15 3 21 3 21 9" />
 <line x1="10" y1="14" x2="21" y2="3" />
 </svg>
);

export const BoxyMail = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
 <polyline points="22,6 12,13 2,6" />
 </svg>
);

export const BoxyKey = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zM15 10.5l4 4m-2.5-2.5l4 4" />
 </svg>
);

export const BoxyMaximize = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <polyline points="15 3 21 3 21 9" />
 <polyline points="9 21 3 21 3 15" />
 <line x1="21" y1="3" x2="14" y2="10" />
 <line x1="3" y1="21" x2="10" y2="14" />
 </svg>
);

export const BoxyFacebook = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
 </svg>
);

export const BoxyTwitter = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
 </svg>
);

export const BoxyInstagram = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
 <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
 <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
 </svg>
);

export const BoxyGithub = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
 </svg>
);
export const BoxyBell = ({ size = 24, className ="", fill }) => (
 <svg {...commonProps(size, className, fill)}>
 <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
 <path d="M13.73 21a2 2 0 0 1-3.46 0" />
 </svg>
);

export const BoxyHome = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
 <polyline points="9 22 9 12 15 12 15 22" />
 </svg>
);

export const BoxyTV = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
 <polyline points="17 2 12 7 7 2" />
 </svg>
);

export const BoxyVolume = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
 <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
 </svg>
);

export const BoxyVolumeX = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
 <line x1="23" y1="9" x2="17" y2="15" />
 <line x1="17" y1="9" x2="23" y2="15" />
 </svg>
);

export const BoxyGoogle = ({ size = 24, className ="" }) => (
 <svg viewBox="0 0 48 48" width={size} height={size} className={className}>
 <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
 <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
 <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
 <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
 <path fill="none" d="M0 0h48v48H0z"/>
 </svg>
);

export const BoxyReels = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <rect width="18" height="18" x="3" y="3" rx="2" />
 <path d="M7 3v18" />
 <path d="M3 7.5h4" />
 <path d="M3 12h18" />
 <path d="M3 16.5h4" />
 <path d="M17 3v18" />
 <path d="M17 7.5h4" />
 <path d="M17 16.5h4" />
 </svg>
);


export const BoxyMinimize = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
 </svg>
);

export const BoxyEye = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
 <circle cx="12" cy="12" r="3" />
 </svg>
);

export const BoxyThumbsDown = ({ size = 24, className ="", fill }) => (
 <svg {...commonProps(size, className, fill)}>
 <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
 </svg>
);

export const BoxyMoreVertical = ({ size = 24, className ="" }) => (
 <svg {...commonProps(size, className)}>
 <circle cx="12" cy="12" r="1" />
 <circle cx="12" cy="5" r="1" />
 <circle cx="12" cy="19" r="1" />
 </svg>
);
