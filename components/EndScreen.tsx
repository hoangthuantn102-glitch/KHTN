import React, { useState, useMemo } from 'react';
import { GameMode, CompetitionResult } from '../types';

interface EndScreenProps {
  score: number;
  totalQuestions: number;
  onEndGame: () => void;
  onPlayAgainPractice: () => void;
  onReviewResults: () => void;
  onStartNextTurn: (name: string) => void;
  onNewCompetition: () => void;
  onContinueHsg: () => void;
  onPlayAgain1v1: () => void;
  onNextMatch1v1: () => void;
  gameMode: GameMode;
  playerName: string;
  totalTime: number;
  competitionResults: CompetitionResult[];
  player1Name?: string;
  player1Score?: number;
  player2Name?: string;
  player2Score?: number;
  winnerName?: string | null;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const EndScreen: React.FC<EndScreenProps> = ({ 
    score, 
    totalQuestions, 
    onEndGame, 
    onPlayAgainPractice, 
    onReviewResults,
    onStartNextTurn,
    onNewCompetition,
    onContinueHsg,
    onPlayAgain1v1,
    onNextMatch1v1,
    gameMode, 
    playerName, 
    totalTime,
    competitionResults,
    player1Name,
    player1Score,
    player2Name,
    player2Score,
    winnerName
}) => {
  const [nextPlayerName, setNextPlayerName] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const sortedResults = useMemo(() => {
      return [...competitionResults].sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.time - b.time;
      });
  }, [competitionResults]);

  const currentPlayerRank = useMemo(() => {
    if (gameMode !== GameMode.COMPETITION) return 0;
    const rank = sortedResults.findIndex(result => result.name === playerName && result.score === score && result.time === totalTime);
    return rank + 1;
  }, [sortedResults, playerName, score, totalTime, gameMode]);


  const getFeedbackMessage = () => {
    if (percentage === 100) return "Xuất sắc! Bạn là một thiên tài khoa học!";
    if (percentage >= 80) return "Tuyệt vời! Kiến thức của bạn rất vững chắc.";
    if (percentage >= 50) return "Làm tốt lắm! Hãy tiếp tục cố gắng nhé.";
    return "Đừng nản lòng! Hãy ôn tập và thử lại nào.";
  };

  const renderPracticeUI = () => (
    <div className="mt-8 w-full max-w-md mx-auto">
        <div className="flex flex-col sm:flex-row gap-4">
            <button
            onClick={onPlayAgainPractice}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
            >
            Chơi lại (câu hỏi cũ)
            </button>
            <button
            onClick={onReviewResults}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
            >
            Xem kết quả
            </button>
        </div>
        <button onClick={onEndGame} className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg mt-4 transition-colors">
            Kết thúc
        </button>
    </div>
  );
  
  const renderCompetitionUI = () => (
    <div className="mt-8 w-full max-w-sm mx-auto space-y-4">
        <div className="bg-slate-900/50 p-4 rounded-lg">
            <label htmlFor="nextPlayerName" className="block text-md font-semibold mb-2 text-slate-200">Lượt tiếp theo (bộ câu hỏi mới)</label>
            <div className="flex gap-2">
                <input
                    id="nextPlayerName"
                    type="text"
                    value={nextPlayerName}
                    onChange={(e) => setNextPlayerName(e.target.value)}
                    placeholder="Nhập tên người chơi..."
                    className="flex-grow bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                />
                 <button
                    onClick={() => {
                        if (nextPlayerName.trim()) {
                            onStartNextTurn(nextPlayerName.trim());
                            setNextPlayerName('');
                        }
                    }}
                    disabled={!nextPlayerName.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-5 rounded-lg text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg disabled:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100"
                >
                    Bắt đầu
                </button>
            </div>
        </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <button onClick={() => setShowLeaderboard(true)} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                Bảng xếp hạng
            </button>
            <button onClick={onNewCompetition} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                Thi đấu mới
            </button>
        </div>
        <button onClick={onEndGame} className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
            Kết thúc
        </button>
    </div>
);

  const renderHsgUI = () => (
    <div className="mt-8 w-full max-w-md mx-auto">
        <div className="flex flex-col sm:flex-row gap-4">
            <button
            onClick={onContinueHsg}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
            >
            Luyện tiếp
            </button>
            <button
            onClick={onReviewResults}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
            >
            Xem kết quả
            </button>
        </div>
        <button onClick={onEndGame} className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg mt-4 transition-colors">
            Kết thúc
        </button>
    </div>
  );

  const render1v1UI = () => {
    const p1s = player1Score ?? 0;
    const p2s = player2Score ?? 0;
    const winnerMessage = winnerName 
        ? `${winnerName} chiến thắng!` 
        : (gameMode === GameMode.TEAM ? 'Hòa! Hai đội thật ngang tài ngang sức!' : 'Hòa! Hai bạn thật ngang tài ngang sức!');

    return (
    <div className="text-center">
        <h2 className="text-3xl font-bold text-cyan-400 mb-2">{gameMode === GameMode.TEAM ? 'Kết quả Đồng đội' : 'Kết quả 1 VS 1'}</h2>
        <p className="text-yellow-400 text-xl mb-6 font-bold">{winnerMessage}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div className={`p-6 rounded-lg ${p1s >= p2s && winnerName === player1Name ? 'bg-green-900/50 border-2 border-green-500' : 'bg-slate-900/50'}`}>
                <p className="text-2xl text-slate-200 font-bold">{player1Name}</p>
                <p className="text-6xl font-extrabold my-2 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
                {p1s}
                </p>
                <p className="text-xl text-slate-300">điểm</p>
            </div>
             <div className={`p-6 rounded-lg ${p2s >= p1s && winnerName === player2Name ? 'bg-green-900/50 border-2 border-green-500' : 'bg-slate-900/50'}`}>
                <p className="text-2xl text-slate-200 font-bold">{player2Name}</p>
                <p className="text-6xl font-extrabold my-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                {p2s}
                </p>
                <p className="text-xl text-slate-300">điểm</p>
            </div>
        </div>
      
        <div className="mt-8 w-full max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                onClick={onPlayAgain1v1}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                >
                {gameMode === GameMode.TEAM ? 'Đấu lại' : 'Chơi lại'}
                </button>
                <button
                onClick={onNextMatch1v1}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                >
                {gameMode === GameMode.TEAM ? 'Trận đấu kế tiếp' : 'Cặp đấu kế tiếp'}
                </button>
            </div>
            <button onClick={onEndGame} className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg mt-4 transition-colors">
                Kết thúc
            </button>
        </div>
    </div>
    );
  };


  const renderCompetitionResult = () => (
      <div className="bg-slate-900/50 p-4 rounded-lg mb-6 text-center">
        <p className="text-xl text-slate-200 font-semibold">{playerName}</p>
        <div className="flex justify-center items-baseline gap-6 my-2">
            <div>
                <p className="text-sm text-slate-400">Thứ hạng</p>
                <p className="text-4xl font-extrabold text-yellow-400">#{currentPlayerRank > 0 ? currentPlayerRank : 'N/A'}</p>
            </div>
             <div>
                <p className="text-sm text-slate-400">Thời gian</p>
                <p className="text-4xl font-extrabold text-cyan-400">{formatTime(totalTime)}</p>
            </div>
        </div>
      </div>
  );
  
  const renderLeaderboardModal = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-fast">
        <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4 text-center">Bảng Xếp Hạng</h3>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                {sortedResults.length > 0 ? sortedResults.map((result, index) => (
                    <div key={index} className={`flex items-center p-3 rounded-lg ${index === 0 ? 'bg-yellow-500/20' : 'bg-slate-700/50'}`}>
                        <span className="text-xl font-bold w-10 text-center">{index + 1}</span>
                        <div className="flex-grow">
                            <p className="font-semibold text-lg text-slate-100">{result.name}</p>
                            <p className="text-sm text-slate-400">Thời gian: {formatTime(result.time)}</p>
                        </div>
                        <span className="text-xl font-extrabold text-cyan-300">{result.score}</span>
                    </div>
                )) : <p className="text-slate-400 text-center">Chưa có kết quả nào.</p>}
            </div>
            <button onClick={() => setShowLeaderboard(false)} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                Đóng
            </button>
        </div>
    </div>
  );


  return (
    <>
    <div className="text-center bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-slate-700 animate-fade-in-slow">
        {gameMode !== GameMode.ONE_VS_ONE && gameMode !== GameMode.TEAM ? (
            <>
                <h2 className="text-3xl font-bold text-cyan-400 mb-2">Hoàn thành!</h2>
                <p className="text-slate-300 text-lg mb-6">{getFeedbackMessage()}</p>
                
                {gameMode === GameMode.COMPETITION && renderCompetitionResult()}

                <div className="bg-slate-900/50 p-6 rounded-lg">
                    <p className="text-xl text-slate-200">Điểm của bạn</p>
                    <p className="text-6xl font-extrabold my-2 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
                    {score} / {totalQuestions}
                    </p>
                    <p className="text-2xl text-slate-300">({percentage}%)</p>
                </div>
            </>
        ) : null}
      
        {gameMode === GameMode.PRACTICE && renderPracticeUI()}
        {gameMode === GameMode.COMPETITION && renderCompetitionUI()}
        {gameMode === GameMode.HSG && renderHsgUI()}
        {(gameMode === GameMode.ONE_VS_ONE || gameMode === GameMode.TEAM) && render1v1UI()}

    </div>
    {showLeaderboard && renderLeaderboardModal()}
    </>
  );
};

export default EndScreen;