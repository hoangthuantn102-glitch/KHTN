import React, { useState, useCallback, useRef } from 'react';
import { Subject, GameMode, Question, DifficultyLevel, QuestionFormat } from '../types';
import { DEFAULT_TIME_PER_QUESTION, DEFAULT_QUESTION_COUNT } from '../constants';
import { validateTopic, parseQuestionsFromFile } from '../services/geminiService';

interface TopicSelectionScreenProps {
  grade: number;
  onStartGame: (options: {
    subjects: Subject[], 
    topics: string[], 
    time: number,
    mode: GameMode,
    name?: string,
    name1?: string,
    name2?: string,
    team1Name?: string,
    team1Members?: string[],
    team2Name?: string,
    team2Members?: string[],
    questionCount: number,
    questionsFromFile?: Question[],
    difficulties?: DifficultyLevel[],
    questionFormats?: QuestionFormat[],
  }) => void;
  onBack: () => void;
}

const sampleQuestions: Question[] = [
  {
    "question": "Hoạt động nào sau đây không được xem là nghiên cứu khoa học tự nhiên?",
    "options": [
      "Nghiên cứu hệ thống quạt nước cho đầm nuôi tôm.",
      "Nghiên cứu trang phục của các nước.",
      "Nghiên cứu xử lí rác thải bảo vệ môi trường.",
      "Nghiên cứu cách khắc chữ lên thủy tinh."
    ],
    "correctAnswerIndex": 1
  },
  {
    "question": "Lĩnh vực chuyên nghiên cứu về năng lượng thuộc lĩnh vực nào của khoa học tự nhiên?",
    "options": [
      "Hóa học",
      "Sinh học",
      "Vật lí",
      "Thiên văn học"
    ],
    "correctAnswerIndex": 2
  },
  {
    "question": "Phát biểu nào sau đây là phát biểu đúng về vai trò của khoa học tự nhiên trong cuộc sống?",
    "options": [
      "Mở rộng sản suát và phát triển kinh tế",
      "Cung cấp thông tin mới và nâng cao hiểu biết của con người",
      "Bảo vệ môi trường; Ứng phó với biển đổi khí hậu.",
      "Cả 3 đáp án trên"
    ],
    "correctAnswerIndex": 3
  },
  {
    "question": "Khoa học tự nhiên nghiên cứu về lĩnh vực nào dưới đây?",
    "options": [
      "Các hiện tượng tự nhiên",
      "Các tính chất của tự nhiên",
      "Các quy luật tự nhiên",
      "Tất cả các ý trên"
    ],
    "correctAnswerIndex": 3
  },
  {
    "question": "Khoa học tự nhiên không bao gồm lĩnh vực nào sau đây?",
    "options": [
      "Vật lí học",
      "Khoa học Trái Đất",
      "Thiên văn học",
      "Tâm lí học"
    ],
    "correctAnswerIndex": 3
  }
];


const TopicSelectionScreen: React.FC<TopicSelectionScreenProps> = ({ grade, onStartGame, onBack }) => {
  const [topics, setTopics] = useState<string[]>([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [time, setTime] = useState<string>(DEFAULT_TIME_PER_QUESTION.toString());
  const [questionCount, setQuestionCount] = useState<string>(DEFAULT_QUESTION_COUNT.toString());
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.PRACTICE);
  const [playerName, setPlayerName] = useState('');
  const [playerName1, setPlayerName1] = useState('');
  const [playerName2, setPlayerName2] = useState('');
  
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [currentMember1, setCurrentMember1] = useState('');
  const [currentMember2, setCurrentMember2] = useState('');
  const [team1Members, setTeam1Members] = useState<string[]>([]);
  const [team2Members, setTeam2Members] = useState<string[]>([]);

  const [uploadedQuestions, setUploadedQuestions] = useState<Question[] | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTopicValidating, setIsTopicValidating] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);

  const [selectedDifficulties, setSelectedDifficulties] = useState<DifficultyLevel[]>([]);
  const [selectedQuestionFormats, setSelectedQuestionFormats] = useState<QuestionFormat[]>([]);

  const clearFileUpload = useCallback(() => {
    setUploadedQuestions(null);
    setFileName('');
    setFileError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }, []);
  
  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    setPlayerName('');
    setPlayerName1('');
    setPlayerName2('');
    setTeam1Name('');
    setTeam2Name('');
    setTeam1Members([]);
    setTeam2Members([]);
    setCurrentMember1('');
    setCurrentMember2('');

    if (mode === GameMode.PRACTICE) {
        setSelectedDifficulties([]);
    }
    if (mode !== GameMode.HSG) {
        setSelectedQuestionFormats([]);
    }
    
    if (mode === GameMode.HSG) {
        clearFileUpload();
    }
  };
  
  const handleToggleDifficulty = (difficulty: DifficultyLevel) => {
    setSelectedDifficulties(prev => 
        prev.includes(difficulty) 
        ? prev.filter(d => d !== difficulty) 
        : [...prev, difficulty]
    );
  };

  const handleToggleQuestionFormat = (format: QuestionFormat) => {
    setSelectedQuestionFormats(prev => 
        prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const handleAddMember1 = () => {
      const member = currentMember1.trim();
      if (member && !team1Members.includes(member)) {
          setTeam1Members(prev => [...prev, member]);
          setCurrentMember1('');
      }
  };

  const handleRemoveMember1 = (index: number) => {
      setTeam1Members(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleAddMember2 = () => {
      const member = currentMember2.trim();
      if (member && !team2Members.includes(member)) {
          setTeam2Members(prev => [...prev, member]);
          setCurrentMember2('');
      }
  };

  const handleRemoveMember2 = (index: number) => {
      setTeam2Members(prev => prev.filter((_, i) => i !== index));
  };


  const handleAddTopic = async () => {
    const topicToAdd = currentTopic.trim();
    if (topicToAdd === '' || topics.includes(topicToAdd) || isTopicValidating) {
        return;
    }

    setIsTopicValidating(true);
    setTopicError(null);

    try {
        const validation = await validateTopic(grade, [], topicToAdd);
        if (validation.isValid) {
            const finalTopic = validation.correctedTopic || topicToAdd;
            if (!topics.includes(finalTopic)) {
                setTopics(prev => [...prev, finalTopic]);
            }
            setCurrentTopic('');
        } else {
            setTopicError(validation.reason);
        }
    } catch (error) {
        setTopics(prev => [...prev, topicToAdd]);
        setCurrentTopic('');
        console.error("Topic validation failed, adding topic directly:", error);
    } finally {
        setIsTopicValidating(false);
    }
  };
  
  const handleRemoveTopic = (topicToRemove: string) => {
    setTopics(prev => prev.filter(t => t !== topicToRemove));
  };

  const isAiMode = uploadedQuestions === null;
  
  const isStartDisabled = (
    isParsingFile ||
    (gameMode !== GameMode.HSG && !isAiMode && !uploadedQuestions) ||
    (isAiMode && topics.length === 0 && gameMode !== GameMode.HSG) ||
    (gameMode === GameMode.COMPETITION && playerName.trim() === '') ||
    (gameMode === GameMode.ONE_VS_ONE && (playerName1.trim() === '' || playerName2.trim() === '')) ||
    (gameMode === GameMode.TEAM && (team1Name.trim() === '' || team2Name.trim() === '' || team1Members.length === 0 || team2Members.length === 0)) ||
    (gameMode === GameMode.HSG && (topics.length === 0 || selectedDifficulties.length === 0 || selectedQuestionFormats.length === 0)) ||
    !time || parseInt(time) <= 0 ||
    !questionCount || parseInt(questionCount) <= 0
  );

  const handleSubmit = () => {
    if (isStartDisabled) return;
    
    const canHaveDifficulties = 
        gameMode === GameMode.COMPETITION || 
        gameMode === GameMode.ONE_VS_ONE || 
        gameMode === GameMode.TEAM ||
        gameMode === GameMode.HSG;

    onStartGame({
        subjects: [],
        topics: topics,
        time: parseInt(time),
        mode: gameMode,
        name: playerName,
        name1: playerName1,
        name2: playerName2,
        team1Name,
        team1Members,
        team2Name,
        team2Members,
        questionCount: parseInt(questionCount),
        questionsFromFile: gameMode === GameMode.HSG ? undefined : uploadedQuestions || undefined,
        difficulties: canHaveDifficulties ? selectedDifficulties : undefined,
        questionFormats: gameMode === GameMode.HSG ? selectedQuestionFormats : undefined,
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileError(null);
    setUploadedQuestions(null);

    const fileType = file.type;
    const fName = file.name.toLowerCase();

    if (fileType === 'application/json' || fName.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error('File content is not readable.');
                }
                const json = JSON.parse(text);
                if (Array.isArray(json) && json.every(q => 'question' in q && 'options' in q && 'correctAnswerIndex' in q)) {
                    setUploadedQuestions(json);
                    setTopics([]);
                } else {
                    throw new Error('Định dạng tệp JSON không hợp lệ.');
                }
            } catch (error) {
                setFileError(error instanceof Error ? error.message : 'Lỗi khi xử lý tệp.');
                setFileName('');
            }
        };
        reader.onerror = () => {
            setFileError('Không thể đọc tệp.');
            setFileName('');
        };
        reader.readAsText(file);
    } else if (
        fileType === 'application/pdf' ||
        fName.endsWith('.pdf')
    ) {
        setIsParsingFile(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const dataUrl = e.target?.result as string;
                const questions = await parseQuestionsFromFile(dataUrl, file.type);
                if (questions.length === 0) {
                    throw new Error('Không tìm thấy câu hỏi nào trong tệp.');
                }
                setUploadedQuestions(questions);
                setTopics([]);
            } catch (error) {
                setFileError(error instanceof Error ? error.message : 'Lỗi khi xử lý tệp.');
                setFileName('');
            } finally {
                setIsParsingFile(false);
            }
        };
        reader.onerror = () => {
            setFileError('Không thể đọc tệp.');
            setFileName('');
            setIsParsingFile(false);
        };
        reader.readAsDataURL(file);
    } else {
        setFileError('Loại tệp không được hỗ trợ. Vui lòng tải lên .json hoặc .pdf.');
        setFileName('');
    }
  };

  const handleDownloadSample = () => {
    const jsonString = JSON.stringify(sampleQuestions, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mau-cau-hoi.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-3xl animate-fade-in">
      <button onClick={onBack} className="absolute top-4 left-4 md:top-6 md:left-6 text-slate-400 hover:text-white transition-colors text-lg z-10">
        &larr; Quay lại
      </button>
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-1 text-cyan-400">CÀI ĐẶT</h1>
        <p className="text-slate-300 mb-6 text-lg">Lớp {grade}</p>
      </div>

      <div className="space-y-6">
        {/* Step 1: Mode */}
        <div>
            <h2 className="text-xl font-semibold mb-3 text-slate-100">1. Chọn chế độ chơi</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.values(GameMode).map(mode => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`px-5 py-3 rounded-lg font-bold transition-all duration-200 
                  ${gameMode === mode
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  }`}
              >
                {mode}
              </button>
            ))}
          </div>
          {gameMode === GameMode.COMPETITION && (
              <div className="mt-4">
                  <label htmlFor="playerName" className="block text-lg font-semibold mb-2 text-slate-100">Nhập tên của bạn</label>
                  <input
                    id="playerName"
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Tên người chơi..."
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                    />
              </div>
          )}
          {gameMode === GameMode.ONE_VS_ONE && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="playerName1" className="block text-lg font-semibold mb-2 text-slate-100">Tên người chơi 1</label>
                      <input
                        id="playerName1"
                        type="text"
                        value={playerName1}
                        onChange={(e) => setPlayerName1(e.target.value)}
                        placeholder="Tên người chơi 1..."
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                        />
                  </div>
                  <div>
                      <label htmlFor="playerName2" className="block text-lg font-semibold mb-2 text-slate-100">Tên người chơi 2</label>
                      <input
                        id="playerName2"
                        type="text"
                        value={playerName2}
                        onChange={(e) => setPlayerName2(e.target.value)}
                        placeholder="Tên người chơi 2..."
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                        />
                  </div>
              </div>
          )}
           {gameMode === GameMode.TEAM && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Team 1 */}
                    <div className="bg-slate-900/50 p-4 rounded-lg space-y-3">
                        <label htmlFor="team1Name" className="block text-lg font-semibold text-slate-100">Tên đội 1</label>
                        <input
                            id="team1Name"
                            type="text"
                            value={team1Name}
                            onChange={(e) => setTeam1Name(e.target.value)}
                            placeholder="Tên đội 1..."
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                        />
                        <div>
                            <label htmlFor="team1Member" className="block text-md font-semibold mb-1 text-slate-200">Thành viên đội 1</label>
                            <div className="flex gap-2">
                                <input
                                    id="team1Member"
                                    type="text"
                                    value={currentMember1}
                                    onChange={(e) => setCurrentMember1(e.target.value)}
                                    placeholder="Tên thành viên..."
                                    className="flex-grow bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMember1())}
                                />
                                <button onClick={handleAddMember1} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50" disabled={!currentMember1.trim()}>Thêm</button>
                            </div>
                            <ul className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                                {team1Members.map((member, index) => (
                                    <li key={index} className="flex justify-between items-center bg-slate-800 px-2 py-1 rounded-md text-sm">
                                        <span>{member}</span>
                                        <button onClick={() => handleRemoveMember1(index)} className="text-red-500 font-bold text-xs">XÓA</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    {/* Team 2 */}
                    <div className="bg-slate-900/50 p-4 rounded-lg space-y-3">
                        <label htmlFor="team2Name" className="block text-lg font-semibold text-slate-100">Tên đội 2</label>
                        <input
                            id="team2Name"
                            type="text"
                            value={team2Name}
                            onChange={(e) => setTeam2Name(e.target.value)}
                            placeholder="Tên đội 2..."
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                        />
                        <div>
                            <label htmlFor="team2Member" className="block text-md font-semibold mb-1 text-slate-200">Thành viên đội 2</label>
                            <div className="flex gap-2">
                                <input
                                    id="team2Member"
                                    type="text"
                                    value={currentMember2}
                                    onChange={(e) => setCurrentMember2(e.target.value)}
                                    placeholder="Tên thành viên..."
                                    className="flex-grow bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMember2())}
                                />
                                <button onClick={handleAddMember2} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50" disabled={!currentMember2.trim()}>Thêm</button>
                            </div>
                            <ul className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                                {team2Members.map((member, index) => (
                                    <li key={index} className="flex justify-between items-center bg-slate-800 px-2 py-1 rounded-md text-sm">
                                        <span>{member}</span>
                                        <button onClick={() => handleRemoveMember2(index)} className="text-red-500 font-bold text-xs">XÓA</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Step 2: Content Source */}
        <div>
          <h2 className="text-xl font-semibold mb-3 text-slate-100">2. Chọn nội dung câu hỏi</h2>
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <h3 className="font-bold text-cyan-400 mb-2">Tạo câu hỏi bằng AI</h3>
             <fieldset className="space-y-4" disabled={uploadedQuestions !== null}>
                 <div>
                  <h4 className="font-semibold mb-2 text-slate-200">Chủ đề</h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={currentTopic} 
                      onChange={(e) => {
                        setCurrentTopic(e.target.value);
                        if (topicError) setTopicError(null);
                      }} 
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())} 
                      placeholder="Ví dụ: Quang học..." 
                      className="flex-grow bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition" 
                    />
                    <button onClick={handleAddTopic} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:bg-slate-600" disabled={isTopicValidating || !currentTopic.trim()}>
                      {isTopicValidating ? 'Đang kiểm tra...' : 'Thêm'}
                    </button>
                  </div>
                  {topicError && <p className="mt-2 text-sm text-red-400">{topicError}</p>}
                   {topics.length > 0 && <div className="mt-3 p-3 rounded-lg bg-slate-800/50"><ol className="list-decimal list-inside space-y-2 text-slate-200">{topics.map((topic) => (<li key={topic} className="flex justify-between items-center group"><span>{topic}</span><button onClick={() => handleRemoveTopic(topic)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">XÓA</button></li>))}</ol></div>}
                </div>
             </fieldset>
             {(gameMode === GameMode.COMPETITION || gameMode === GameMode.ONE_VS_ONE || gameMode === GameMode.TEAM || gameMode === GameMode.HSG) && uploadedQuestions === null && (
                <div className="space-y-4 mt-4 border-t border-slate-700 pt-4">
                    <div>
                        <h4 className="font-semibold mb-2 text-slate-200">Mức độ</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.values(DifficultyLevel).map(level => (
                            <button key={level} onClick={() => handleToggleDifficulty(level)} className={`px-4 py-2 text-sm rounded-md font-semibold transition-colors ${selectedDifficulties.includes(level) ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>{level}</button>
                        ))}
                        </div>
                    </div>
                    {gameMode === GameMode.HSG && (
                        <div>
                            <h4 className="font-semibold mb-2 text-slate-200">Dạng câu hỏi</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {Object.values(QuestionFormat).map(format => (
                                <button key={format} onClick={() => handleToggleQuestionFormat(format)} className={`px-4 py-2 text-sm rounded-md font-semibold transition-colors ${selectedQuestionFormats.includes(format) ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>{format}</button>
                            ))}
                            </div>
                        </div>
                    )}
                </div>
             )}
          </div>
          {gameMode !== GameMode.HSG && (
            <>
                <div className="text-center my-4 font-bold text-slate-400">HOẶC</div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-red-400">Tải lên tệp câu hỏi</h3>
                        <button onClick={handleDownloadSample} className="text-xs bg-slate-700 hover:bg-slate-600 text-cyan-300 font-semibold py-1 px-2 rounded-md transition-colors">
                            Tải tệp mẫu
                        </button>
                    </div>

                    <input type="file" accept=".json,.pdf" onChange={handleFileChange} ref={fileInputRef} className="hidden" id="file-upload"/>
                    <label htmlFor="file-upload" className={`w-full cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex justify-center items-center ${isParsingFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isParsingFile ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang phân tích...
                            </div>
                        ) : 'Chọn tệp...'}
                    </label>
                    {fileName && !isParsingFile && <div className="mt-3 text-center text-green-400 bg-green-900/50 p-2 rounded-lg flex justify-between items-center"><span>Tệp đã tải: {fileName}</span> <button onClick={clearFileUpload} className="text-red-400 font-bold text-xs">HỦY</button></div>}
                    {fileError && <p className="mt-2 text-sm text-red-400">{fileError}</p>}
                    <p className="text-xs text-slate-400 mt-2">Hỗ trợ tệp: .json, .pdf</p>
                </div>
            </>
           )}
        </div>

        {/* Time Input */}
        <div>
          <h2 className="text-xl font-semibold mb-3 text-slate-100">3. Thời gian mỗi câu (giây)</h2>
          <input type="number" value={time} onChange={(e) => setTime(e.target.value)} min="5" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition" placeholder="Ví dụ: 20"/>
        </div>

        {/* Question Count Input */}
        <div>
          <h2 className="text-xl font-semibold mb-3 text-slate-100">4. Chọn số lượng câu hỏi</h2>
          <input type="number" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} min="1" max="50" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition" placeholder={`Mặc định: ${DEFAULT_QUESTION_COUNT}`}/>
        </div>
      </div>

      {/* Start Button */}
      <div className="mt-8">
        <button onClick={handleSubmit} disabled={isStartDisabled} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-lg text-2xl transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg disabled:bg-slate-600 disabled:cursor-not-allowed disabled:scale-100">
          Bắt đầu!
        </button>
        {isStartDisabled && <p className="text-center text-sm text-slate-400 mt-2">Vui lòng hoàn thành tất cả các tùy chọn cần thiết.</p>}
      </div>
    </div>
  );
};

export default TopicSelectionScreen;