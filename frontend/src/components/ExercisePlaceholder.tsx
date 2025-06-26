import React from 'react';

const ExercisePlaceholder: React.FC = () => {
  return (
    <svg
      width="400"
      height="200"
      viewBox="0 0 400 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="400" height="200" fill="#1a1a1a"/>
      <g opacity="0.3">
        <path
          d="M140 100C140 72.3858 162.386 50 190 50C217.614 50 240 72.3858 240 100C240 127.614 217.614 150 190 150C162.386 150 140 127.614 140 100Z"
          stroke="#00D4FF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M170 90C170 84.4772 174.477 80 180 80H200C205.523 80 210 84.4772 210 90V110C210 115.523 205.523 120 200 120H180C174.477 120 170 115.523 170 110V90Z"
          fill="#00D4FF"
          opacity="0.2"
        />
        <path
          d="M190 70V130"
          stroke="#00D4FF"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M160 100H220"
          stroke="#00D4FF"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <text
        x="200"
        y="170"
        textAnchor="middle"
        fill="#666"
        fontSize="14"
        fontFamily="Arial, sans-serif"
      >
        운동 이미지
      </text>
    </svg>
  );
};

export default ExercisePlaceholder;
