import React, { useState, useCallback, useEffect } from 'react';
import { GameState, Question, Subject, GameMode, UserAnswer, CompetitionResult, DifficultyLevel, QuestionFormat } from './types';
import { generateQuizQuestions } from './services/geminiService';
import StartScreen from './components/StartScreen';
import QuizScreen from './components/QuizScreen';
import QuizScreen1v1 from './components/QuizScreen1v1';
import QuizScreenTeam from './components/QuizScreenTeam';
import EndScreen from './components/EndScreen';
import LoadingSpinner from './components/LoadingSpinner';
import TopicSelectionScreen from './components/TopicSelectionScreen';
import ReviewScreen from './components/ReviewScreen';
import { DEFAULT_TIME_PER_QUESTION } from './constants';

interface StartGameOptions {
    subjects: Subject[];
    topics: string[];
    time: number;
    mode: GameMode;
    name?: string;
    name1?: string;
    name2?: string;
    team1Name?: string;
    team1Members?: string[];
    team2Name?: string;
    team2Members?: string[];
    questionCount: number;
    questionsFromFile?: Question[];
    difficulties?: DifficultyLevel[];
    questionFormats?: QuestionFormat[];
}

// Store settings to regenerate questions for next competitor
type GameSettings = Omit<StartGameOptions, 'name' | 'name1' | 'name2' | 'mode' | 'team1Name' | 'team1Members' | 'team2Name' | 'team2Members'>;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.CLASS_SELECTION);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [grade, setGrade] = useState<number | null>(null);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(DEFAULT_TIME_PER_QUESTION);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gameMode, setGameMode] = useState<GameMode>(GameMode.PRACTICE);
  const [playerName, setPlayerName] = useState('');
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState(0);
  const [competitionResults, setCompetitionResults] = useState<CompetitionResult[]>([]);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  // 1v1 state
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [p1AnswerForCurrentQ, setP1AnswerForCurrentQ] = useState<{ isCorrect: boolean; selectedIndex: number | null } | null>(null);
  const [p2AnswerForCurrentQ, setP2AnswerForCurrentQ] = useState<{ isCorrect: boolean; selectedIndex: number | null } | null>(null);

  // Team state
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [team1Members, setTeam1Members] = useState<string[]>([]);
  const [team2Members, setTeam2Members] = useState<string[]>([]);
  const [activeTeam1Members, setActiveTeam1Members] = useState<string[]>([]);
  const [activeTeam2Members, setActiveTeam2Members] = useState<string[]>([]);
  const [currentTurnTeam, setCurrentTurnTeam] = useState<1 | 2>(1);
  const [team1CurrentPlayerIndex, setTeam1CurrentPlayerIndex] = useState(0);
  const [team2CurrentPlayerIndex, setTeam2CurrentPlayerIndex] = useState(0);


  const handleGradeSelect = useCallback((selectedGrade: number) => {
    setGrade(selectedGrade);
    setGameState(GameState.TOPIC_SELECTION);
    setError(null);
  }, []);

  const handleStartGame = useCallback(async ({ subjects, topics, time, mode, name, name1, name2, team1Name, team1Members, team2Name, team2Members, questionsFromFile, questionCount, difficulties, questionFormats }: StartGameOptions) => {
    if (!grade) return;

    setIsLoading(true);
    setError(null);
    setTimePerQuestion(time);
    setGameMode(mode);
    setGameSettings({ subjects, topics, time, questionsFromFile, questionCount, difficulties, questionFormats });
    setWinnerName(null);

    if (mode === GameMode.COMPETITION) {
        setPlayerName(name || '');
        setCompetitionResults([]); // Reset leaderboard for a new game
    } else if (mode === GameMode.ONE_VS_ONE) {
        setPlayer1Name(name1 || 'Người chơi 1');
        setPlayer2Name(name2 || 'Người chơi 2');
    } else if (mode === GameMode.TEAM) {
        const t1Name = team1Name || 'Đội 1';
        const t2Name = team2Name || 'Đội 2';
        const t1Members = team1Members || [];
        const t2Members = team2Members || [];

        setTeam1Name(t1Name);
        setTeam2Name(t2Name);
        setTeam1Members(t1Members); // full list for reference
        setTeam2Members(t2Members); // full list for reference
        setActiveTeam1Members(t1Members);
        setActiveTeam2Members(t2Members);
        setCurrentTurnTeam(1);
        setTeam1CurrentPlayerIndex(0);
        setTeam2CurrentPlayerIndex(0);
    } else {
        setPlayerName(name || '');
    }

    try {
      let fetchedQuestions: Question[];
      if (questionsFromFile && questionsFromFile.length > 0) {
        const shuffledQuestions = [...questionsFromFile].sort(() => Math.random() - 0.5);
        fetchedQuestions = shuffledQuestions;
      } else {
        fetchedQuestions = await generateQuizQuestions(grade, subjects, topics, questionCount, difficulties, questionFormats);
      }
      
      if (fetchedQuestions.length === 0) {
        throw new Error("Không có câu hỏi nào được tạo hoặc tải lên. Vui lòng thử lại.");
      }
      setQuestions(fetchedQuestions);
      setScore(0);
      setPlayer1Score(0);
      setPlayer2Score(0);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setP1AnswerForCurrentQ(null);
      setP2AnswerForCurrentQ(null);
      setTotalTime(0);
      setQuizStartTime(Date.now());
      setGameState(GameState.PLAYING);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.");
      setGameState(GameState.TOPIC_SELECTION);
    } finally {
      setIsLoading(false);
    }
  }, [grade]);

  const handleAnswer = useCallback((isCorrect: boolean, selectedAnswerIndex: number | null) => {
    const newAnswer: UserAnswer = {
      question: questions[currentQuestionIndex],
      selectedAnswerIndex,
      isCorrect,
    };
    setUserAnswers(prev => [...prev, newAnswer]);
    
    let currentScore = score;
    if (isCorrect) {
      currentScore = score + 1;
      setScore(currentScore);
    }
    
    setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        } else {
            const finishedTime = Math.round((Date.now() - quizStartTime) / 1000);
            setTotalTime(finishedTime);

            if (gameMode === GameMode.COMPETITION) {
              const newResult: CompetitionResult = { name: playerName, score: currentScore, time: finishedTime };
              setCompetitionResults(prev => [...prev, newResult]);
            }

            setGameState(GameState.FINISHED);
        }
    }, 1500);
  }, [currentQuestionIndex, questions, quizStartTime, score, gameMode, playerName]);

  const resetGame = useCallback(() => {
    setQuestions([]);
    setGrade(null);
    setError(null);
    setScore(0);
    setCurrentQuestionIndex(0);
    setTimePerQuestion(DEFAULT_TIME_PER_QUESTION);
    setPlayerName('');
    setPlayer1Name('');
    setPlayer2Name('');
    setPlayer1Score(0);
    setPlayer2Score(0);
    setTeam1Name('');
    setTeam2Name('');
    setTeam1Members([]);
    setTeam2Members([]);
    setUserAnswers([]);
    setTotalTime(0);
    setCompetitionResults([]);
    setGameSettings(null);
    setWinnerName(null);
    setActiveTeam1Members([]);
    setActiveTeam2Members([]);
    setCurrentTurnTeam(1);
    setTeam1CurrentPlayerIndex(0);
    setTeam2CurrentPlayerIndex(0);
  }, []);
  
  const handleEndGame = useCallback(() => {
    resetGame();
    setGameState(GameState.CLASS_SELECTION);
  }, [resetGame]);

  const handleNewCompetition = useCallback(() => {
    setCompetitionResults([]);
    setGameState(GameState.TOPIC_SELECTION);
  }, []);
  
  const handlePlayAgainPractice = useCallback(() => {
      setScore(0);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setTotalTime(0);
      setQuizStartTime(Date.now());
      setGameState(GameState.PLAYING);
  }, []);

  const handlePlayAgain1v1 = useCallback(async () => {
    if (!grade || !gameSettings) return;

    setIsLoading(true);
    setError(null);

    try {
        let fetchedQuestions: Question[];
        if (gameSettings.questionsFromFile && gameSettings.questionsFromFile.length > 0) {
            const shuffledQuestions = [...gameSettings.questionsFromFile].sort(() => Math.random() - 0.5);
            fetchedQuestions = shuffledQuestions;
        } else {
            fetchedQuestions = await generateQuizQuestions(
                grade, 
                gameSettings.subjects, 
                gameSettings.topics, 
                gameSettings.questionCount, 
                gameSettings.difficulties, 
                gameSettings.questionFormats
            );
        }
        
        if (fetchedQuestions.length === 0) {
            throw new Error("Không thể tạo bộ câu hỏi mới. Vui lòng thử lại.");
        }

        setQuestions(fetchedQuestions);
        setPlayer1Score(0);
        setPlayer2Score(0);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setP1AnswerForCurrentQ(null);
        setP2AnswerForCurrentQ(null);
        setTotalTime(0);
        setQuizStartTime(Date.now());
        setWinnerName(null);

        if (gameMode === GameMode.TEAM) {
          setActiveTeam1Members(team1Members);
          setActiveTeam2Members(team2Members);
          setCurrentTurnTeam(1);
          setTeam1CurrentPlayerIndex(0);
          setTeam2CurrentPlayerIndex(0);
        }

        setGameState(GameState.PLAYING);
    } catch (err) {
        setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.");
        setGameState(GameState.FINISHED);
    } finally {
        setIsLoading(false);
    }
  }, [grade, gameSettings, gameMode, team1Members, team2Members]);

  const handleNextMatch1v1 = useCallback(() => {
      setPlayer1Name('');
      setPlayer2Name('');
      setTeam1Name('');
      setTeam2Name('');
      setTeam1Members([]);
      setTeam2Members([]);
      setPlayer1Score(0);
      setPlayer2Score(0);
      setCompetitionResults([]);
      setWinnerName(null);
      setActiveTeam1Members([]);
      setActiveTeam2Members([]);
      setCurrentTurnTeam(1);
      setTeam1CurrentPlayerIndex(0);
      setTeam2CurrentPlayerIndex(0);
      setGameState(GameState.TOPIC_SELECTION);
  }, []);
  
  const handleStartNextTurn = useCallback(async (newPlayerName: string) => {
    if (!grade || !gameSettings) return;

    setIsLoading(true);
    setError(null);
    setPlayerName(newPlayerName);

    try {
        let fetchedQuestions: Question[];
        if (gameSettings.questionsFromFile && gameSettings.questionsFromFile.length > 0) {
            const shuffledQuestions = [...gameSettings.questionsFromFile].sort(() => Math.random() - 0.5);
            fetchedQuestions = shuffledQuestions;
        } else {
            fetchedQuestions = await generateQuizQuestions(grade, gameSettings.subjects, gameSettings.topics, gameSettings.questionCount, gameSettings.difficulties, gameSettings.questionFormats);
        }
        
        if (fetchedQuestions.length === 0) {
            throw new Error("Không thể tạo bộ câu hỏi mới. Vui lòng thử lại.");
        }

        setQuestions(fetchedQuestions);
        setScore(0);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setTotalTime(0);
        setQuizStartTime(Date.now());
        setGameState(GameState.PLAYING);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.");
      setGameState(GameState.FINISHED);
    } finally {
      setIsLoading(false);
    }
  }, [grade, gameSettings]);

  const handleContinueHsg = useCallback(async () => {
    if (!grade || !gameSettings) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedQuestions = await generateQuizQuestions(
        grade, 
        gameSettings.subjects, 
        gameSettings.topics, 
        gameSettings.questionCount, 
        gameSettings.difficulties, 
        gameSettings.questionFormats
      );
      
      if (fetchedQuestions.length === 0) {
          throw new Error("Không thể tạo bộ câu hỏi mới. Vui lòng thử lại.");
      }

      setQuestions(fetchedQuestions);
      setScore(0);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setTotalTime(0);
      setQuizStartTime(Date.now());
      setGameState(GameState.PLAYING);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.");
      setGameState(GameState.FINISHED);
    } finally {
      setIsLoading(false);
    }
  }, [grade, gameSettings]);


  const handleReviewResults = useCallback(() => {
      setGameState(GameState.REVIEW);
  }, []);
  
  const handleBackToFinishedScreen = useCallback(() => {
      setGameState(GameState.FINISHED);
  }, []);

  // --- 1v1 LOGIC ---
  const moveToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        setP1AnswerForCurrentQ(null);
        setP2AnswerForCurrentQ(null);
    } else {
        if (gameMode === GameMode.ONE_VS_ONE) {
          if (player1Score > player2Score) setWinnerName(player1Name);
          else if (player2Score > player1Score) setWinnerName(player2Name);
          else setWinnerName(null);
        }
        setGameState(GameState.FINISHED);
    }
  }, [currentQuestionIndex, questions.length, gameMode, player1Score, player2Score, player1Name, player2Name]);

  const handleAnswer1v1 = useCallback((playerIndex: 1 | 2, isCorrect: boolean, selectedIndex: number | null) => {
    if (playerIndex === 1 && !p1AnswerForCurrentQ) {
        setP1AnswerForCurrentQ({ isCorrect, selectedIndex });
        if (isCorrect) {
            setPlayer1Score(s => s + 1);
        }
    } else if (playerIndex === 2 && !p2AnswerForCurrentQ) {
        setP2AnswerForCurrentQ({ isCorrect, selectedIndex });
        if (isCorrect) {
            setPlayer2Score(s => s + 1);
        }
    }
  }, [p1AnswerForCurrentQ, p2AnswerForCurrentQ]);
  
  const handleTimeUp1v1 = useCallback(() => {
    if (!p1AnswerForCurrentQ) setP1AnswerForCurrentQ({ isCorrect: false, selectedIndex: null });
    if (!p2AnswerForCurrentQ) setP2AnswerForCurrentQ({ isCorrect: false, selectedIndex: null });
  }, [p1AnswerForCurrentQ, p2AnswerForCurrentQ]);

  // --- TEAM LOGIC ---
  const handleAnswerTeamMode = useCallback((isCorrect: boolean, selectedIndex: number | null) => {
    const newAnswer: UserAnswer = {
        question: questions[currentQuestionIndex],
        selectedAnswerIndex: selectedIndex,
        isCorrect,
    };
    setUserAnswers(prev => [...prev, newAnswer]);

    const isLastQuestion = currentQuestionIndex >= questions.length - 1;
    let nextActiveTeam1 = [...activeTeam1Members];
    let nextActiveTeam2 = [...activeTeam2Members];
    let winner = null;

    // 1. Update Score & Handle Elimination
    if (isCorrect) {
        if (currentTurnTeam === 1) setPlayer1Score(s => s + 1);
        else setPlayer2Score(s => s + 1);
    } else { // Incorrect answer -> eliminate player
        if (currentTurnTeam === 1) {
            const eliminatedPlayer = team1Members[team1CurrentPlayerIndex];
            nextActiveTeam1 = activeTeam1Members.filter(p => p !== eliminatedPlayer);
            setActiveTeam1Members(nextActiveTeam1);
            if (nextActiveTeam1.length === 0) {
                winner = team2Name;
            }
        } else { // Team 2's turn
            const eliminatedPlayer = team2Members[team2CurrentPlayerIndex];
            nextActiveTeam2 = activeTeam2Members.filter(p => p !== eliminatedPlayer);
            setActiveTeam2Members(nextActiveTeam2);
            if (nextActiveTeam2.length === 0) {
                winner = team1Name;
            }
        }
    }

    // 2. Check for Win/End Conditions
    if (winner) {
        setWinnerName(winner);
        setGameState(GameState.FINISHED);
        return;
    }

    if (isLastQuestion) {
        // Determine winner based on remaining players, then score
        if (nextActiveTeam1.length > nextActiveTeam2.length) setWinnerName(team1Name);
        else if (nextActiveTeam2.length > nextActiveTeam1.length) setWinnerName(team2Name);
        else {
            const finalP1Score = player1Score + (currentTurnTeam === 1 && isCorrect ? 1 : 0);
            const finalP2Score = player2Score + (currentTurnTeam === 2 && isCorrect ? 1 : 0);
            if (finalP1Score > finalP2Score) setWinnerName(team1Name);
            else if (finalP2Score > finalP1Score) setWinnerName(team2Name);
            else setWinnerName(null); // Draw
        }
        setGameState(GameState.FINISHED);
        return;
    }

    // 3. Advance to the next turn (after a delay)
    setTimeout(() => {
        // If the answer was incorrect, find the next player for the team that just played.
        // If correct, the current player's index remains the same for their team's next turn.
        if (!isCorrect) {
            if (currentTurnTeam === 1) {
                if (nextActiveTeam1.length > 0) {
                    let nextIndex = team1CurrentPlayerIndex;
                    do {
                        nextIndex = (nextIndex + 1) % team1Members.length;
                    } while (!nextActiveTeam1.includes(team1Members[nextIndex]));
                    setTeam1CurrentPlayerIndex(nextIndex);
                }
            } else { // Team 2
                if (nextActiveTeam2.length > 0) {
                    let nextIndex = team2CurrentPlayerIndex;
                    do {
                        nextIndex = (nextIndex + 1) % team2Members.length;
                    } while (!nextActiveTeam2.includes(team2Members[nextIndex]));
                    setTeam2CurrentPlayerIndex(nextIndex);
                }
            }
        }
        
        // Switch to the other team for the next question
        setCurrentTurnTeam(prev => prev === 1 ? 2 : 1);
        setCurrentQuestionIndex(prev => prev + 1);
    }, 1500);

  }, [
      questions, currentQuestionIndex, currentTurnTeam,
      team1Members, team2Members, activeTeam1Members, activeTeam2Members,
      team1CurrentPlayerIndex, team2CurrentPlayerIndex,
      player1Score, player2Score, team1Name, team2Name
  ]);

  useEffect(() => {
      if (gameState !== GameState.PLAYING || gameMode !== GameMode.ONE_VS_ONE) return;

      const p1Correct = p1AnswerForCurrentQ?.isCorrect === true;
      const p2Correct = p2AnswerForCurrentQ?.isCorrect === true;
      const bothAnswered = p1AnswerForCurrentQ !== null && p2AnswerForCurrentQ !== null;
      
      if (p1Correct || p2Correct || bothAnswered) {
          const timeoutId = setTimeout(() => {
              moveToNextQuestion();
          }, 1500);
          return () => clearTimeout(timeoutId);
      }
  }, [p1AnswerForCurrentQ, p2AnswerForCurrentQ, gameMode, gameState, moveToNextQuestion]);


  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    switch (gameState) {
      case GameState.CLASS_SELECTION:
        return <StartScreen onSelectGrade={handleGradeSelect} error={error} />;
      
      case GameState.TOPIC_SELECTION:
        if (!grade) {
            handleEndGame();
            return null;
        }
        return <TopicSelectionScreen grade={grade} onStartGame={handleStartGame} onBack={handleEndGame} />;
      
      case GameState.PLAYING:
        if (gameMode === GameMode.TEAM) {
          const isTeam1Turn = currentTurnTeam === 1;
          
          const currentPlayerName = isTeam1Turn 
            ? activeTeam1Members.length > 0 ? team1Members[team1CurrentPlayerIndex] : ''
            : activeTeam2Members.length > 0 ? team2Members[team2CurrentPlayerIndex] : '';

          const currentTeamName = isTeam1Turn ? team1Name : team2Name;

          if (!currentPlayerName || !currentTeamName) {
            // This can happen briefly if a team is eliminated, before the game ends.
            // A loading spinner or placeholder is appropriate.
            return <LoadingSpinner />;
          }

          return (
            <QuizScreenTeam
              question={questions[currentQuestionIndex]}
              onAnswer={handleAnswerTeamMode}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              timePerQuestion={timePerQuestion}
              team1Name={team1Name}
              team2Name={team2Name}
              team1Score={player1Score}
              team2Score={player2Score}
              activeTeam1Count={activeTeam1Members.length}
              activeTeam2Count={activeTeam2Members.length}
              currentPlayerName={currentPlayerName}
              currentTeamName={currentTeamName}
            />
          );
        }
        if (gameMode === GameMode.ONE_VS_ONE) {
          return (
            <QuizScreen1v1
              question={questions[currentQuestionIndex]}
              onAnswer={handleAnswer1v1}
              onTimeUp={handleTimeUp1v1}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              timePerQuestion={timePerQuestion}
              player1Name={player1Name}
              player2Name={player2Name}
              player1Score={player1Score}
              player2Score={player2Score}
              p1Answer={p1AnswerForCurrentQ}
              p2Answer={p2AnswerForCurrentQ}
            />
          );
        }
        return (
          <QuizScreen
            question={questions[currentQuestionIndex]}
            onAnswer={handleAnswer}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            score={score}
            timePerQuestion={timePerQuestion}
            gameMode={gameMode}
          />
        );
      case GameState.FINISHED:
        return (
          <EndScreen
            score={score}
            totalQuestions={questions.length}
            onEndGame={handleEndGame}
            onPlayAgainPractice={handlePlayAgainPractice}
            onReviewResults={handleReviewResults}
            onStartNextTurn={handleStartNextTurn}
            onNewCompetition={handleNewCompetition}
            onContinueHsg={handleContinueHsg}
            onPlayAgain1v1={handlePlayAgain1v1}
            onNextMatch1v1={handleNextMatch1v1}
            gameMode={gameMode}
            playerName={playerName}
            totalTime={totalTime}
            competitionResults={competitionResults}
            player1Name={gameMode === GameMode.TEAM ? team1Name : player1Name}
            player1Score={player1Score}
            player2Name={gameMode === GameMode.TEAM ? team2Name : player2Name}
            player2Score={player2Score}
            winnerName={winnerName}
          />
        );
       case GameState.REVIEW:
        return (
            <ReviewScreen userAnswers={userAnswers} onBack={handleBackToFinishedScreen} grade={grade!} />
        );
      default:
        return <StartScreen onSelectGrade={handleGradeSelect} error={error} />;
    }
  };
  
  const containerClass = (gameState === GameState.PLAYING) 
    ? "w-full" 
    : "w-full max-w-6xl mx-auto";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-slate-900 text-white flex flex-col items-center justify-center p-4 pb-10">
      <div className={`${containerClass} relative`}>
        {renderContent()}
      </div>
      <footer className="fixed bottom-0 left-0 w-full bg-black/40 backdrop-blur-sm py-2 overflow-x-hidden border-t border-slate-700/50">
        <p 
            className="whitespace-nowrap text-slate-300 text-sm will-change-transform"
            style={{ animation: 'marquee 120s linear infinite' }}
        >
            Bản quyền: Th.s Bùi Hoàng Thuấn 0343885383. Trường THCS Bách Quang, phường Bách Quang, Thái Nguyên.
        </p>
      </footer>
    </div>
  );
};

export default App;