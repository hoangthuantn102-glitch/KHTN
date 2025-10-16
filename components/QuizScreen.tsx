import React, { useState, useEffect, useCallback } from 'react';
import { Question, GameMode } from '../types';
import Timer from './Timer';

interface QuizScreenProps {
  question: Question;
  onAnswer: (isCorrect: boolean, selectedIndex: number | null) => void;
  questionNumber: number;
  totalQuestions: number;
  score: number;
  timePerQuestion: number;
  gameMode: GameMode;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ question, onAnswer, questionNumber, totalQuestions, score, timePerQuestion, gameMode }) => {
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleAnswerClick = useCallback((index: number | null) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedAnswerIndex(index);
    const isCorrect = index !== null && index === question.correctAnswerIndex;
    onAnswer(isCorrect, index);
  }, [isAnswered, onAnswer, question.correctAnswerIndex]);
  
  const handleTimeUp = useCallback(() => {
    if (!isAnswered) {
      handleAnswerClick(null); // Treat time up as a wrong answer with null index
    }
  }, [isAnswered, handleAnswerClick]);

  useEffect(() => {
    setSelectedAnswerIndex(null);
    setIsAnswered(false);
  }, [question]);

  const getButtonClass = (index: number) => {
    if (!isAnswered) {
      return "bg-slate-700 hover:bg-slate-600";
    }
    if (index === question.correctAnswerIndex) {
      return "bg-green-600 animate-pulse-correct";
    }
    if (index === selectedAnswerIndex) {
      return "bg-red-600";
    }
    return "bg-slate-700 opacity-60";
  };
  
  let leftText: string[] = [];
  let rightText: string[] = [];
  let showDecorativeText = false;

  if (gameMode === GameMode.PRACTICE) {
      leftText = ['Khổ', 'luyện', 'thành', 'tài'];
      rightText = ['Chăm', 'chỉ', 'ngày', 'đêm'];
      showDecorativeText = true;
  } else if (gameMode === GameMode.HSG) {
      leftText = ['Luyện', 'mãi', 'thành', 'tài'];
      rightText = ['Miệt', 'mài', 'tất', 'giỏi'];
      showDecorativeText = true;
  }

  return (
    <div className="w-full flex items-center justify-center gap-8 animate-fade-in-fast" style={{ minHeight: '85vh' }}>
      {/* Left decorative text */}
      {showDecorativeText && (
        <div className="hidden xl:flex items-center justify-center flex-1">
            <div className="font-calligraphy text-7xl text-white/10 select-none transform -rotate-15 text-center leading-tight calligraphy-container">
                {leftText.map(word => <span key={word}>{word}</span>)}
            </div>
        </div>
      )}

      {/* Main Game Panel */}
      <div className="bg-slate-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-7xl">
        <div className="flex justify-between items-center mb-4 text-slate-300">
          <div className="text-lg font-semibold">Câu {questionNumber}/{totalQuestions}</div>
          <div className="text-lg font-bold text-cyan-400">Điểm: {score}</div>
        </div>
        
        <div className="relative h-2 bg-slate-700 rounded-full mb-6">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-400 to-cyan-300 rounded-full"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%`, transition: 'width 0.5s ease-in-out' }}
          ></div>
        </div>

        <div className="flex justify-center mb-6">
          <Timer
            key={questionNumber}
            initialTime={timePerQuestion}
            onTimeUp={handleTimeUp}
            isPaused={isAnswered}
          />
        </div>

        <h2 className="text-xl md:text-2xl font-bold mb-6 text-center min-h-[100px] flex items-center justify-center">{question.question}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerClick(index)}
              disabled={isAnswered}
              className={`w-full p-4 rounded-lg text-lg font-semibold transition-all duration-300 ease-in-out text-left
                ${getButtonClass(index)}
                ${isAnswered ? "cursor-not-allowed" : "transform hover:scale-105"}
              `}
            >
              <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span> {option}
            </button>
          ))}
        </div>
      </div>

      {/* Right decorative text */}
      {showDecorativeText && (
        <div className="hidden xl:flex items-center justify-center flex-1">
            <div className="font-calligraphy text-7xl text-white/10 select-none transform rotate-15 text-center leading-tight calligraphy-container">
                {rightText.map(word => <span key={word}>{word}</span>)}
            </div>
        </div>
      )}
    </div>
  );
};

export default QuizScreen;