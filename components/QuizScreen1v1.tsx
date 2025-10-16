import React, { useState, useEffect, useMemo } from 'react';
import { Question } from '../types';
import Timer from './Timer';

type AnswerInfo = { isCorrect: boolean; selectedIndex: number | null } | null;

interface QuizScreen1v1Props {
  question: Question;
  onAnswer: (playerIndex: 1 | 2, isCorrect: boolean, selectedIndex: number | null) => void;
  onTimeUp: () => void;
  questionNumber: number;
  totalQuestions: number;
  timePerQuestion: number;
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  p1Answer: AnswerInfo;
  p2Answer: AnswerInfo;
}

type ShuffledOptions = { text: string; originalIndex: number }[];

const shuffleOptions = (options: string[]): ShuffledOptions => {
  return [...options]
    .map((option, index) => ({ text: option, originalIndex: index }))
    .sort(() => Math.random() - 0.5);
};

const PlayerUI: React.FC<{
  playerIndex: 1 | 2;
  playerName: string;
  options: ShuffledOptions;
  correctAnswerIndex: number;
  onAnswer: (playerIndex: 1 | 2, isCorrect: boolean, selectedIndex: number | null) => void;
  playerAnswer: AnswerInfo;
  otherPlayerAnswer: AnswerInfo;
  revealAnswers: boolean;
}> = ({ playerIndex, playerName, options, correctAnswerIndex, onAnswer, playerAnswer, otherPlayerAnswer, revealAnswers }) => {

  const hasAnswered = playerAnswer !== null;

  const handleAnswerClick = (selectedIndex: number, originalIndex: number) => {
    if (hasAnswered) return;
    const isCorrect = originalIndex === correctAnswerIndex;
    onAnswer(playerIndex, isCorrect, selectedIndex);
  };

  const getButtonClass = (optionOriginalIndex: number, buttonIndex: number) => {
    if (revealAnswers) {
        if (optionOriginalIndex === correctAnswerIndex) {
            return "bg-green-600 animate-pulse-correct";
        }
        if (playerAnswer && buttonIndex === playerAnswer.selectedIndex) {
            return "bg-red-600";
        }
        return "bg-slate-700 opacity-60";
    }

    if (playerAnswer && buttonIndex === playerAnswer.selectedIndex) {
        return "bg-indigo-500 ring-2 ring-indigo-300";
    }

    return "bg-slate-700 hover:bg-slate-600";
  };

  const isLocked = hasAnswered || otherPlayerAnswer?.isCorrect === true;

  return (
    <div className={`p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 flex flex-col ${isLocked ? 'opacity-70' : ''}`}>
      <h3 className="text-xl font-bold text-center mb-4">{playerName}</h3>
      <div className="grid grid-cols-1 gap-3 flex-grow">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerClick(index, option.originalIndex)}
            disabled={isLocked}
            className={`w-full h-full p-3 rounded-lg text-md font-semibold transition-all duration-300 ease-in-out text-left
              ${getButtonClass(option.originalIndex, index)}
              ${isLocked ? "cursor-not-allowed" : "transform hover:scale-105"}
            `}
          >
            <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span> {option.text}
          </button>
        ))}
      </div>
    </div>
  );
};


const QuizScreen1v1: React.FC<QuizScreen1v1Props> = ({
  question, onAnswer, onTimeUp, questionNumber, totalQuestions, timePerQuestion,
  player1Name, player2Name, player1Score, player2Score, p1Answer, p2Answer
}) => {
  
  const [p1Options, setP1Options] = useState<ShuffledOptions>([]);
  const [p2Options, setP2Options] = useState<ShuffledOptions>([]);
  const [revealAnswers, setRevealAnswers] = useState(false);

  useEffect(() => {
    setP1Options(shuffleOptions(question.options));
    setP2Options(shuffleOptions(question.options));
    setRevealAnswers(false);
  }, [question]);

  const isPaused = p1Answer?.isCorrect === true || p2Answer?.isCorrect === true || (p1Answer !== null && p2Answer !== null);

  useEffect(() => {
    const p1Correct = p1Answer?.isCorrect === true;
    const p2Correct = p2Answer?.isCorrect === true;
    const bothAnswered = p1Answer !== null && p2Answer !== null;

    if (p1Correct || p2Correct || bothAnswered) {
      setRevealAnswers(true);
    }
  }, [p1Answer, p2Answer]);
  
  const leftText = ['Bạn', 'tài', 'giỏi'];
  const rightText = ['Tôi', 'cũng', 'thế'];

  return (
    <div className="w-full flex items-center justify-center gap-8 animate-fade-in-fast" style={{ minHeight: '85vh' }}>
        
        {/* Left decorative text */}
        <div className="hidden xl:flex items-center justify-center flex-1">
            <div className="font-calligraphy text-7xl text-white/10 select-none transform -rotate-15 text-center leading-tight calligraphy-container">
                {leftText.map(word => <span key={word}>{word}</span>)}
            </div>
        </div>

        {/* Main Game Panel */}
        <div className="bg-slate-900/30 backdrop-blur-sm p-4 md:p-6 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-7xl flex flex-col">
            {/* Header: Question Number & Progress Bar */}
            <header className="mb-4">
                <div className="flex justify-between items-center mb-2 text-slate-300">
                    <div className="text-lg font-semibold">Câu {questionNumber}/{totalQuestions}</div>
                </div>
                <div className="relative h-2 bg-slate-700 rounded-full">
                    <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-400 to-cyan-300 rounded-full"
                    style={{ width: `${(questionNumber / totalQuestions) * 100}%`, transition: 'width 0.5s ease-in-out' }}
                    ></div>
                </div>
            </header>
            
            {/* Main Content Area */}
            <main className="flex-grow flex flex-col items-center justify-center">
                <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 mb-6">
                    <div className="w-full md:w-3/5">
                        <h2 className="text-xl md:text-3xl font-bold text-center p-6 bg-slate-800/50 rounded-lg min-h-[150px] flex items-center justify-center">{question.question}</h2>
                    </div>
                    <div className="w-full md:w-auto">
                        <Timer
                            key={questionNumber}
                            initialTime={timePerQuestion}
                            onTimeUp={onTimeUp}
                            isPaused={isPaused}
                        />
                    </div>
                </div>

                {/* Player Answer Grids */}
                <div className="mt-4 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    {p1Options.length > 0 && (
                    <PlayerUI
                        playerIndex={1}
                        playerName={player1Name}
                        options={p1Options}
                        correctAnswerIndex={question.correctAnswerIndex}
                        onAnswer={onAnswer}
                        playerAnswer={p1Answer}
                        otherPlayerAnswer={p2Answer}
                        revealAnswers={revealAnswers}
                    />
                    )}
                    {p2Options.length > 0 && (
                    <PlayerUI
                        playerIndex={2}
                        playerName={player2Name}
                        options={p2Options}
                        correctAnswerIndex={question.correctAnswerIndex}
                        onAnswer={onAnswer}
                        playerAnswer={p2Answer}
                        otherPlayerAnswer={p1Answer}
                        revealAnswers={revealAnswers}
                    />
                    )}
                </div>
            </main>

            {/* Footer: Scores */}
            <footer className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
                <div className="text-2xl font-bold text-cyan-400">{player1Name}: {player1Score}</div>
                <div className="text-2xl font-bold text-orange-400">{player2Name}: {player2Score}</div>
            </footer>
        </div>

        {/* Right decorative text */}
        <div className="hidden xl:flex items-center justify-center flex-1">
             <div className="font-calligraphy text-7xl text-white/10 select-none transform rotate-15 text-center leading-tight calligraphy-container">
                {rightText.map(word => <span key={word}>{word}</span>)}
            </div>
        </div>
    </div>
  );
};

export default QuizScreen1v1;