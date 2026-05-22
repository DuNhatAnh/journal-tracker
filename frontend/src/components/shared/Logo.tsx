import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Document Icon */}
      <rect x="25" y="20" width="30" height="40" rx="2" fill="currentColor" className="text-surface" stroke="currentColor" strokeWidth="2" />
      <path d="M45 20L55 30V20H45Z" fill="currentColor" className="text-on-surface" />
      <line x1="30" y1="35" x2="50" y2="35" stroke="currentColor" className="text-primary" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="45" x2="50" y2="45" stroke="currentColor" className="text-on-surface-variant" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="55" x2="40" y2="55" stroke="currentColor" className="text-on-surface-variant" strokeWidth="2" strokeLinecap="round" />

      {/* Stylized 'S' */}
      <path
        d="M60 40C60 30 40 30 40 45C40 60 70 60 70 75C70 90 50 90 50 80"
        stroke="currentColor"
        className="text-on-surface"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Stylized 'T' */}
      <path
        d="M65 45H90M77.5 45V85"
        stroke="currentColor"
        className="text-on-surface"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* The Blue Upward Arrow */}
      <path
        d="M15 85L40 60L55 75L85 15"
        stroke="currentColor"
        className="text-primary"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M75 15H85V25"
        stroke="currentColor"
        className="text-primary"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
