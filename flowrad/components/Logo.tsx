import React from 'react';

export const Logo: React.FC = () => (
    <svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
        <defs>
            <linearGradient id="gradBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#009cde', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#005a9e', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="gradGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#9dd346', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#7cb518', stopOpacity: 1 }} />
            </linearGradient>
        </defs>
        
        <g transform="translate(5, 5) scale(0.7)">
            <path d="M 27 15 C 24 15, 22 20, 22 25 L 22 45 C 22 50, 24 55, 27 55" stroke="url(#gradBlue)" strokeWidth="2" fill="none" />
            <path d="M 27 20 H 23" stroke="url(#gradBlue)" strokeWidth="1.5" />
            <path d="M 27 25 H 23" stroke="url(#gradBlue)" strokeWidth="1.5" />
            <path d="M 27 30 H 22.5" stroke="url(#gradBlue)" strokeWidth="1.5" />
            <path d="M 27 35 H 22.5" stroke="url(#gradBlue)" strokeWidth="1.5" />
            <path d="M 27 40 H 23" stroke="url(#gradBlue)" strokeWidth="1.5" />
            <path d="M 27 45 H 23" stroke="url(#gradBlue)" strokeWidth="1.5" />
            <path d="M 50 50 C 50 30, 30 30, 27 30" stroke="url(#gradBlue)" strokeWidth="8" fill="none" />
            <path d="M 32 55 L 25 62 L 18 55 Z" fill="url(#gradBlue)" transform="translate(-1, -12)" />
            <path d="M 27 30 C 40 30, 50 15, 50 0" stroke="url(#gradGreen)" strokeWidth="8" fill="none" />
            <path d="M 50 25 L 65 30 L 50 35 Z" fill="url(#gradGreen)" />
            <g stroke="url(#gradGreen)" strokeWidth="1.5" fill="none">
                <path d="M 55 10 C 60 10, 65 5, 70 5" />
                <path d="M 55 15 C 65 15, 70 12, 75 12" />
                <path d="M 55 20 C 62 20, 65 20, 72 20" />
                <path d="M 60 25 C 68 25, 72 28, 80 28" />
            </g>
            <path d="M 66 30 L 70 30 L 72 27 L 74 33 L 76 30 L 78 30" stroke="#888" strokeWidth="1.5" fill="none" />
        </g>
        
        <text x="75" y="35" fontFamily="var(--font-inter), sans-serif" fontSize="24" fontWeight="bold">
            <tspan fill="#0084d4">Flow</tspan>
            <tspan fill="#8cc63f">Rad</tspan>
        </text>
        <text x="75" y="50" fontFamily="var(--font-inter), sans-serif" fontSize="8" fill="#6b7280">
            Optimizing Radiology Workflow
        </text>
    </svg>
);
