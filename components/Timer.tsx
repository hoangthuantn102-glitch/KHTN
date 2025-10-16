
import React, { useState, useEffect } from 'react';

interface TimerProps {
  key: number;
  initialTime: number;
  onTimeUp: () => void;
  isPaused: boolean;
}

const Timer: React.FC<TimerProps> = ({ initialTime, onTimeUp, isPaused }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (isPaused || timeLeft <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, isPaused]);

  useEffect(() => {
    if (timeLeft === 0) {
      onTimeUp();
    }
  }, [timeLeft, onTimeUp]);

  const percentage = (timeLeft / initialTime) * 100;
  const strokeDashoffset = 283 * (1 - percentage / 100);
  
  const getTimerColor = () => {
    if (timeLeft <= 5) return 'text-red-500';
    if (timeLeft <= 10) return 'text-yellow-500';
    return 'text-cyan-400';
  }

  return (
    <div className="relative w-24 h-24">
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-slate-700"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
        <circle
          className={`${getTimerColor()} transition-all duration-500 ease-linear`}
          strokeWidth="8"
          strokeDasharray="283"
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>
      <div className={`absolute top-0 left-0 w-full h-full flex items-center justify-center text-3xl font-bold ${getTimerColor()}`}>
        {timeLeft}
      </div>
    </div>
  );
};

export default Timer;
