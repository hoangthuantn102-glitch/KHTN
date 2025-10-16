import React, { useState, useEffect } from 'react';
import { UserAnswer } from '../types';
import { generateAllExplanations } from '../services/geminiService';

// Báo cho TypeScript biết rằng 'katex' có sẵn trên đối tượng window
declare const katex: any;

interface ReviewScreenProps {
  userAnswers: UserAnswer[];
  onBack: () => void;
  grade: number;
}

// Component trợ giúp để hiển thị văn bản với công thức LaTeX
const LatexRenderer: React.FC<{ text: string }> = ({ text }) => {
    if (typeof katex === 'undefined') {
        return <p className="whitespace-pre-wrap">{text}</p>;
    }

    try {
        const parts = text.split(/(\$\$[\s\S]*?\$\$|\$.*?\$)/g);

        return (
            <div className="whitespace-pre-wrap">
                {parts.map((part, index) => {
                    if (part.startsWith('$$') && part.endsWith('$$')) {
                        const latex = part.substring(2, part.length - 2);
                        const html = katex.renderToString(latex, { displayMode: true, throwOnError: false });
                        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
                    }
                    if (part.startsWith('$') && part.endsWith('$')) {
                        const latex = part.substring(1, part.length - 1);
                        const html = katex.renderToString(latex, { displayMode: false, throwOnError: false });
                        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
                    }
                    return <span key={index}>{part}</span>;
                })}
            </div>
        );
    } catch (error) {
        console.error("Lỗi hiển thị LaTeX:", error);
        return <p className="whitespace-pre-wrap">{text}</p>;
    }
};

const ReviewScreen: React.FC<ReviewScreenProps> = ({ userAnswers, onBack, grade }) => {
  const [answersWithExplanations, setAnswersWithExplanations] = useState<UserAnswer[]>(userAnswers);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchExplanations = async () => {
      setIsLoading(true);
      const newAnswers = await generateAllExplanations(userAnswers, grade);
      setAnswersWithExplanations(newAnswers);
      setIsLoading(false);
    };

    fetchExplanations();
  }, [userAnswers, grade]);

  const toggleExplanation = (index: number) => {
    setExpandedIndex(prevIndex => (prevIndex === index ? null : index));
  };

  const getOptionClass = (optionIndex: number, correctAnswerIndex: number, selectedAnswerIndex: number | null) => {
    if (optionIndex === correctAnswerIndex) {
      return 'bg-green-800/70 border-green-500'; // Đáp án đúng
    }
    if (optionIndex === selectedAnswerIndex) {
      return 'bg-red-800/70 border-red-500'; // Đáp án sai của người dùng
    }
    return 'bg-slate-700/50 border-slate-600'; // Các lựa chọn khác
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-400"></div>
            <h2 className="text-2xl font-semibold text-slate-200 mt-6">Đang tải giải thích chi tiết...</h2>
            <p className="text-slate-400">Vui lòng chờ trong giây lát!</p>
        </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-2xl border border-slate-700 w-full animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-cyan-400">Xem lại kết quả</h1>
        <button onClick={onBack} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-5 rounded-lg transition-colors">
          Quay lại
        </button>
      </div>
      
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
        {answersWithExplanations.map(({ question, selectedAnswerIndex, isCorrect }, index) => (
          <div key={index} className="bg-slate-900/50 p-5 rounded-lg border border-slate-700">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-semibold text-slate-100">
                <span className="font-bold text-cyan-400">Câu {index + 1}:</span> {question.question}
              </h2>
              {isCorrect ? (
                <span className="text-sm font-bold text-green-400 bg-green-900/50 px-2 py-1 rounded">ĐÚNG</span>
              ) : (
                <span className="text-sm font-bold text-red-400 bg-red-900/50 px-2 py-1 rounded">SAI</span>
              )}
            </div>
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <div
                  key={optionIndex}
                  className={`p-3 rounded-md border text-slate-200 ${getOptionClass(optionIndex, question.correctAnswerIndex, selectedAnswerIndex)}`}
                >
                  <span className="font-bold mr-2">{String.fromCharCode(65 + optionIndex)}.</span> {option}
                </div>
              ))}
            </div>
             {selectedAnswerIndex === null && (
                <p className="text-yellow-400 text-sm mt-3 font-semibold">Bạn đã không trả lời câu này.</p>
             )}

            {question.explanation && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <button
                        onClick={() => toggleExplanation(index)}
                        className="flex justify-between items-center w-full text-left text-sky-300 font-semibold"
                        aria-expanded={expandedIndex === index}
                    >
                        <span>Giải thích chi tiết</span>
                        <svg 
                            className={`w-5 h-5 transition-transform duration-300 ${expandedIndex === index ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    {expandedIndex === index && (
                        <div className="mt-2 text-slate-300 animate-fade-in-fast">
                            <LatexRenderer text={question.explanation} />
                        </div>
                    )}
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewScreen;