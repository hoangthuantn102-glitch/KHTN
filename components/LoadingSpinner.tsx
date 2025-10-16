
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-400"></div>
      <h2 className="text-2xl font-semibold text-slate-200 mt-6">Đang tạo bộ câu hỏi...</h2>
      <p className="text-slate-400">AI đang làm việc, vui lòng chờ trong giây lát!</p>
    </div>
  );
};

export default LoadingSpinner;
