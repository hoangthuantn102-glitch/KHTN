import React, { useState, useEffect, useCallback } from 'react';
import { Question } from '../types';
import Timer from './Timer';

interface QuizScreenTeamProps {
  question: Question;
  onAnswer: (isCorrect: boolean, selectedIndex: number | null) => void;
  questionNumber: number;
  totalQuestions: number;
  timePerQuestion: number;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  activeTeam1Count: number;
  activeTeam2Count: number;
  currentPlayerName: string;
  currentTeamName: string;
}

const QuizScreenTeam: React.FC<QuizScreenTeamProps> = ({
  question, onAnswer, questionNumber, totalQuestions, timePerQuestion,
  team1Name, team2Name, team1Score, team2Score,
  activeTeam1Count, activeTeam2Count, currentPlayerName, currentTeamName
}) => {
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
      handleAnswerClick(null);
    }
  }, [isAnswered, handleAnswerClick]);

  useEffect(() => {
    setSelectedAnswerIndex(null);
    setIsAnswered(false);
  }, [question]);

  const getButtonClass = (index: number) => {
    if (!isAnswered) return "bg-slate-700 hover:bg-slate-600";
    if (index === question.correctAnswerIndex) return "bg-green-600 animate-pulse-correct";
    if (index === selectedAnswerIndex) return "bg-red-600";
    return "bg-slate-700 opacity-60";
  };

  const leftText = ['Đồng', 'tâm', 'hiệp', 'lực'];
  const rightText = ['Chung', 'sức', 'thành', 'công'];

  return (
    <div className="w-full flex items-center justify-center gap-8 animate-fade-in-fast" style={{ minHeight: '85vh' }}>
      <div className="hidden xl:flex items-center justify-center flex-1">
        <div className="font-calligraphy text-7xl text-white/10 select-none transform -rotate-15 text-center leading-tight calligraphy-container">
            {leftText.map(word => <span key={word}>{word}</span>)}
        </div>
      </div>
      <div className="bg-slate-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-7xl">
        <div className="flex justify-between items-center mb-2 text-slate-300 text-lg font-bold">
          <div><span className="text-cyan-400">{team1Name}:</span> {team1Score} điểm (còn {activeTeam1Count})</div>
          <div><span className="text-orange-400">{team2Name}:</span> {team2Score} điểm (còn {activeTeam2Count})</div>
        </div>
        <div className="text-center text-yellow-400 font-semibold mb-3 text-xl">Lượt của: {currentPlayerName} ({currentTeamName})</div>
        
        <div className="relative h-2 bg-slate-700 rounded-full mb-4">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-400 to-cyan-300 rounded-full"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%`, transition: 'width 0.5s ease-in-out' }}
          ></div>
        </div>

        <div className="flex justify-center mb-4">
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
              className={`w-full p-4 rounded-lg text-lg font-semibold transition-all duration-300 ease-in-out text-left ${getButtonClass(index)} ${isAnswered ? "cursor-not-allowed" : "transform hover:scale-105"}`}>
              <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span> {option}
            </button>
          ))}
        </div>
      </div>
      <div className="hidden xl:flex items-center justify-center flex-1">
        <div className="font-calligraphy text-7xl text-white/10 select-none transform rotate-15 text-center leading-tight calligraphy-container">
            {rightText.map(word => <span key={word}>{word}</span>)}
        </div>
      </div>
    </div>
  );
};

export default QuizScreenTeam;