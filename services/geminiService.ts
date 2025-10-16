import { GoogleGenAI, Type } from "@google/genai";
import { Question, Subject, DifficultyLevel, QuestionFormat, UserAnswer } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateQuizQuestions = async (
    grade: number, 
    subjects: Subject[], 
    topics: string[], 
    questionCount: number,
    difficulties?: DifficultyLevel[],
    questionFormats?: QuestionFormat[]
): Promise<Question[]> => {
  try {
    const topicText = topics.length > 0 ? `Cụ thể, hãy dựa vào các chủ đề sau: ${topics.join(', ')}` : 'bao quát nhiều chủ đề';

    let difficultyText = '';
    if (difficulties && difficulties.length > 0) {
        difficultyText = `Mức độ câu hỏi nên bao gồm: ${difficulties.join(', ')}.`;
    }

    let formatText = 'Tất cả câu hỏi phải là dạng trắc nghiệm nhiều lựa chọn với 4 đáp án.';
    if (questionFormats && questionFormats.length > 0) {
        const requestedFormats = [];
        if (questionFormats.includes(QuestionFormat.MULTIPLE_CHOICE)) {
            requestedFormats.push("trắc nghiệm nhiều lựa chọn (4 đáp án A, B, C, D)");
        }
        if (questionFormats.includes(QuestionFormat.TRUE_FALSE)) {
            requestedFormats.push("trắc nghiệm Đúng/Sai (2 đáp án 'Đúng' và 'Sai')");
        }
        if (questionFormats.includes(QuestionFormat.FILL_IN_THE_BLANK)) {
            requestedFormats.push("điền vào chỗ trống (nhưng trình bày dưới dạng trắc nghiệm 4 lựa chọn để chọn từ/cụm từ điền vào)");
        }
        
        if(requestedFormats.length > 0) {
            formatText = `Hãy tạo một hỗn hợp các dạng câu hỏi sau: ${requestedFormats.join(', ')}.`;
        }
    }

    const prompt = `Tạo ${questionCount} câu hỏi về Khoa học Tự nhiên cho học sinh lớp ${grade} ở Việt Nam. ${topicText} ${difficultyText} ${formatText} Mỗi câu hỏi phải có một đáp án đúng.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: 'Nội dung câu hỏi.',
              },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: 'Một mảng chứa các lựa chọn trả lời (4 cho trắc nghiệm, 2 cho Đúng/Sai).',
              },
              correctAnswerIndex: {
                type: Type.INTEGER,
                description: 'Chỉ số (index) của câu trả lời đúng trong mảng options (bắt đầu từ 0).',
              },
            },
            required: ["question", "options", "correctAnswerIndex"],
          },
        },
      },
    });

    const jsonString = response.text;
    const questions = JSON.parse(jsonString);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("API did not return a valid array of questions.");
    }

    return questions.map((q: any) => ({
        question: q.question,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex
    }));

  } catch (error) {
    console.error("Error generating quiz questions:", error);
    throw new Error("Không thể tạo câu hỏi. Vui lòng thử lại sau.");
  }
};

export const generateExplanationForQuestion = async (question: Question, grade: number): Promise<string> => {
  try {
    const correctAnswerText = question.options[question.correctAnswerIndex];
    const prompt = `
      Dành cho học sinh lớp ${grade} ở Việt Nam, hãy giải thích chi tiết, đầy đủ và dễ hiểu tại sao đáp án "${correctAnswerText}" là câu trả lời đúng cho câu hỏi sau đây.
      Câu hỏi: "${question.question}"
      Các lựa chọn:
      ${question.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}
      Đáp án đúng: ${String.fromCharCode(65 + question.correctAnswerIndex)}. ${correctAnswerText}

      Hãy trình bày lời giải thích một cách rõ ràng, tập trung vào kiến thức khoa học liên quan. Nếu có thể, hãy giải thích luôn tại sao các đáp án còn lại là sai.
      QUAN TRỌNG: Khi viết bất kỳ công thức toán học, vật lý hoặc hóa học nào, hãy sử dụng cú pháp LaTeX.
      - Đối với công thức inline (nằm trong dòng), hãy bọc chúng trong dấu đô la đơn, ví dụ: $E = mc^2$.
      - Đối với công thức khối (hiển thị trên một dòng riêng), hãy bọc chúng trong dấu đô la kép, ví dụ: $$H_2 + O_2 \\rightarrow H_2O$$.
      Ví dụ: "Công thức tính công là $A = F \\cdot s \\cdot \\cos(\\alpha)$." hoặc "Phương trình hóa học được viết là $$\\text{2H}_2 + \\text{O}_2 \\rightarrow \\text{2H}_2\\text{O}$$".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating explanation:", error);
    throw new Error("Không thể tạo giải thích. Vui lòng thử lại.");
  }
};

export const generateAllExplanations = async (userAnswers: UserAnswer[], grade: number): Promise<UserAnswer[]> => {
  try {
    const explanationPromises = userAnswers.map(answer => 
      generateExplanationForQuestion(answer.question, grade)
    );
    
    const explanations = await Promise.all(explanationPromises);
    
    return userAnswers.map((answer, index) => ({
      ...answer,
      question: {
        ...answer.question,
        explanation: explanations[index],
      },
    }));

  } catch (error) {
    console.error("Error generating all explanations:", error);
    const errorMessage = "Lỗi: Không thể tải giải thích. Vui lòng thử lại sau.";
    return userAnswers.map(answer => ({
        ...answer,
        question: {
            ...answer.question,
            explanation: errorMessage,
        }
    }));
  }
};


export const validateTopic = async (grade: number, subjects: Subject[], topic: string): Promise<{ isValid: boolean; reason: string; correctedTopic: string }> => {
  try {
    const prompt = `Xét chủ đề "${topic}" cho học sinh lớp ${grade} Việt Nam. 
    Kiểm tra ba điều sau:
    1. Chủ đề này có nằm trong chương trình học môn Khoa học Tự nhiên của lớp ${grade} theo Chương trình giáo dục phổ thông 2018 của Việt Nam không?
    2. Chủ đề này có thuộc lĩnh vực Khoa học Tự nhiên (Vật Lý, Hóa Học, Sinh Học) không?
    3. Chủ đề có bị sai chính tả không?
    
    Trả về một đối tượng JSON với các trường sau:
    - "isValid": (boolean) true nếu chủ đề hợp lệ và đúng chính tả, ngược lại là false.
    - "reason": (string) giải thích ngắn gọn lý do tại sao nó không hợp lệ (ví dụ: "Chủ đề này không có trong chương trình lớp ${grade}" hoặc "Sai chính tả, có thể bạn muốn nói 'Quang học'?"). Nếu hợp lệ, trả về chuỗi rỗng.
    - "correctedTopic": (string) nếu có lỗi chính tả nhỏ, hãy đề xuất phiên bản đã sửa. Nếu không, trả về chủ đề gốc.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
            correctedTopic: { type: Type.STRING }
          },
          required: ["isValid", "reason", "correctedTopic"]
        }
      }
    });

    const jsonString = response.text;
    const result = JSON.parse(jsonString);
    
    return result;

  } catch (error) {
    console.error("Error validating topic:", error);
    // In case of API error, assume the topic is valid to not block the user.
    return { isValid: true, reason: '', correctedTopic: topic };
  }
};

export const parseQuestionsFromFile = async (fileData: string, mimeType: string): Promise<Question[]> => {
    try {
        const base64Data = fileData.split(',')[1]; // remove data:mime/type;base64, part

        const filePart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType,
            },
        };

        const prompt = `
            Phân tích tài liệu được cung cấp (PDF hoặc Word). Trích xuất tất cả các câu hỏi trắc nghiệm. 
            Mỗi câu hỏi có một câu hỏi, bốn lựa chọn (A, B, C, D) và một câu trả lời đúng.
            Câu trả lời đúng thường được đánh dấu bằng cách nào đó (ví dụ: in đậm, gạch chân, màu đỏ, hoặc có một dấu hiệu bên cạnh). Hãy xác định câu trả lời đúng.
            
            Trả về kết quả dưới dạng một mảng JSON của các đối tượng, trong đó mỗi đối tượng có các thuộc tính sau:
            - "question": (string) Nội dung câu hỏi. QUAN TRỌNG: Chỉ bao gồm nội dung thực của câu hỏi, loại bỏ mọi tiền tố đánh số như "Câu 1:", "Câu 2.", "1)", v.v.
            - "options": (array of strings) Một mảng chứa chính xác 4 lựa chọn trả lời.
            - "correctAnswerIndex": (integer) Chỉ số (index) của câu trả lời đúng trong mảng 'options', bắt đầu từ 0.

            Ví dụ, nếu đáp án đúng là 'B', thì 'correctAnswerIndex' phải là 1.
            Chỉ trả về mảng JSON. Không thêm bất kỳ văn bản giải thích nào.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [filePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      correctAnswerIndex: { type: Type.INTEGER },
                    },
                    required: ["question", "options", "correctAnswerIndex"],
                  },
                },
            }
        });

        const jsonString = response.text;
        const questions = JSON.parse(jsonString);

        if (!Array.isArray(questions) || (questions.length > 0 && (!questions[0].question || !questions[0].options || questions[0].correctAnswerIndex === undefined))) {
            throw new Error("AI could not parse the file into the correct question format.");
        }

        return questions.map((q: any) => ({
            question: q.question,
            options: q.options,
            correctAnswerIndex: q.correctAnswerIndex
        }));

    } catch (error) {
        console.error("Error parsing questions from file:", error);
        throw new Error("Không thể phân tích tệp. Vui lòng kiểm tra định dạng tệp hoặc thử lại.");
    }
};