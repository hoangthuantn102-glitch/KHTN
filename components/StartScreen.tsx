
import React from 'react';

interface StartScreenProps {
  onSelectGrade: (grade: number) => void;
  error: string | null;
}

const GRADES = [6, 7, 8, 9];

const StartScreen: React.FC<StartScreenProps> = ({ onSelectGrade, error }) => {
  return (
    <div className="text-center bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-slate-700 animate-fade-in">
      <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 mb-4">
        Trắc nghiệm Khoa học Tự nhiên
      </h1>
      <p className="text-lg text-slate-300 mb-8">
        Chọn lớp của bạn để bắt đầu
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto">
        {GRADES.map((grade) => (
          <button
            key={grade}
            onClick={() => onSelectGrade(grade)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-6 px-4 rounded-lg text-2xl transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          >
            Lớp {grade}
          </button>
        ))}
      </div>
      {error && (
        <div className="mt-6 bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg" role="alert">
          <p className="font-bold">Đã có lỗi xảy ra:</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default StartScreen;
