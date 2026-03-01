import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  seconds: number;
  onTimeUp: () => void;
  size?: 'sm' | 'md' | 'lg';
  danger?: number;
}

export default function Timer({ seconds, onTimeUp, size = 'md', danger = 10 }: TimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onTimeUp();
      return;
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onTimeUp]);

  const isDanger = remaining <= danger;
  const progress = remaining / seconds;

  const sizes = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-3xl',
  };

  return (
    <motion.div
      animate={isDanger ? { scale: [1, 1.1, 1] } : {}}
      transition={isDanger ? { repeat: Infinity, duration: 0.5 } : {}}
      className={`relative ${sizes[size]} rounded-full flex items-center justify-center`}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={isDanger ? '#e94560' : '#2a3a5c'}
          strokeWidth="2.5"
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={isDanger ? '#e94560' : '#4ade80'}
          strokeWidth="2.5"
          strokeDasharray={`${progress * 100}, 100`}
          strokeLinecap="round"
        />
      </svg>
      <span className={`font-bold ${isDanger ? 'text-shelter-accent' : 'text-shelter-text'}`}>
        {remaining}
      </span>
    </motion.div>
  );
}
