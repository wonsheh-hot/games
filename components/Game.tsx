import React, { useState, useEffect, useRef } from 'react';
import { User, Question } from '../types';
import { generateQuestion, playTextToSpeech } from '../services/geminiService';
import { AVATARS } from '../constants';
import RaceScene from './RaceScene';

interface GameProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onEndGame: () => void;
  initialQuestionPromise?: Promise<Question> | null;
}

const Game: React.FC<GameProps> = ({ user, onUpdateUser, onEndGame, initialQuestionPromise }) => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [pointsGained, setPointsGained] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  
  // Ref to hold the promise for the next question (pre-fetching).
  const nextQuestionPromise = useRef<Promise<Question> | null>(initialQuestionPromise || null);
  
  // Load first question
  useEffect(() => {
    loadNewQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const preloadNextQuestion = () => {
    if (!nextQuestionPromise.current) {
        // Pass current mistakes to generator to possibly pick one for review
        nextQuestionPromise.current = generateQuestion(user.mistakes);
    }
  };

  const loadNewQuestion = async () => {
    setLoading(true);
    setFeedback('none');
    setSelectedOption(null);
    setShowHint(false); // Reset hint state (hidden)
    
    // Use pre-fetched question if available, otherwise generate new
    const q = await (nextQuestionPromise.current || generateQuestion(user.mistakes));
    
    setQuestion(q);
    setLoading(false);
    
    // Clear promise and pre-fetch the NEXT question
    nextQuestionPromise.current = null;
    preloadNextQuestion();
  };

  const handleOptionClick = async (option: string) => {
    if (feedback !== 'none' || loading || !question) return;

    setSelectedOption(option);
    setShowHint(true); // Always reveal hint when answered
    
    const isCorrect = option === question.targetAnswer;

    if (isCorrect) {
      // Correct!
      const basePoints = 10;
      const streakBonus = Math.floor(user.streak / 3) * 5;
      const totalPoints = basePoints + streakBonus;

      setPointsGained(totalPoints);
      setFeedback('correct');

      // Update user stats & REMOVE from mistakes if it was there (Mastered!)
      const newMistakes = user.mistakes.filter(id => id !== question.reviewId);
      
      const updatedUser = {
        ...user,
        score: user.score + totalPoints,
        streak: user.streak + 1,
        bestStreak: Math.max(user.bestStreak, user.streak + 1),
        mistakes: newMistakes,
      };
      onUpdateUser(updatedUser);

    } else {
      // Incorrect
      setFeedback('incorrect');
      
      // Add to mistakes if not already present
      const newMistakes = [...user.mistakes];
      if (!newMistakes.includes(question.reviewId)) {
        newMistakes.push(question.reviewId);
      }

      const updatedUser = {
        ...user,
        streak: 0,
        mistakes: newMistakes,
      };
      onUpdateUser(updatedUser);
    }

    // Play Audio (Browser Native TTS)
    await playTextToSpeech(question.fullSentence);

    // Transition IMMEDIATELY after audio finishes
    loadNewQuestion();
  };

  const getButtonState = (option: string) => {
    if (feedback === 'none') {
      return selectedOption === option 
        ? 'bg-indigo-600 text-white' 
        : 'bg-white hover:bg-indigo-50 border-gray-200 text-gray-700';
    }

    if (option === question?.targetAnswer) {
      return 'bg-green-500 text-white border-green-600 shadow-md ring-2 ring-green-200'; // Always highlight correct
    }

    if (option === selectedOption && feedback === 'incorrect') {
      return 'bg-red-500 text-white border-red-600 opacity-60'; // Highlight user's wrong choice
    }

    return 'bg-gray-100 text-gray-400 border-gray-100 opacity-50'; // Dim others
  };

  const getRenderParts = () => {
    if (!question) return [];
    
    const parts = question.contextSentence.split('______');
    const gaps = parts.length - 1;
    const answerParts = question.targetAnswer.split('...').filter(p => p.trim() !== '');
    const shouldSplitAnswer = gaps > 1 && answerParts.length === gaps;

    return parts.map((part, i, arr) => {
        const isLast = i === arr.length - 1;
        let textToDisplay = question.targetAnswer;
        if (shouldSplitAnswer && i < arr.length - 1) {
            textToDisplay = answerParts[i];
        }

        return {
            text: part,
            isLast,
            answerText: textToDisplay
        };
    });
  };

  if (loading && !question) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-indigo-600">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="font-display text-xl animate-pulse">准备题目中... (Loading...)</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pt-6 min-h-screen flex flex-col">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{AVATARS[user.avatarId]}</span>
          <div>
            <p className="font-bold text-gray-800">{user.username}</p>
            <p className="text-xs text-gray-500 font-bold tracking-wider">LEVEL 8 MASTER</p>
          </div>
        </div>
        
        <div className="flex gap-4">
           {user.mistakes.length > 0 && (
             <div className="text-center hidden sm:block">
              <p className="text-xs text-red-400 font-bold uppercase">错题 (Mistakes)</p>
              <p className="font-display font-bold text-xl text-red-500">
                ⚠️ {user.mistakes.length}
              </p>
            </div>
           )}

          <div className="text-center">
            <p className="text-xs text-gray-400 font-bold uppercase">连胜 (Streak)</p>
            <p className={`font-display font-bold text-xl ${user.streak > 2 ? 'text-orange-500' : 'text-gray-600'}`}>
              🔥 {user.streak}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 font-bold uppercase">得分 (Score)</p>
            <p className="font-display font-bold text-xl text-indigo-600">
              💎 {user.score}
            </p>
          </div>
        </div>
      </div>

      {/* Game Card */}
      <div className="flex-1 flex flex-col">
        <div className="relative mb-6">
            
            {/* RACING ANIMATION SCENE */}
            <div className="mb-[-20px] relative z-10">
                <RaceScene userAvatarId={user.avatarId} feedback={feedback} />
            </div>

            {/* Feedback Overlay */}
            {feedback === 'correct' && (
                <div className="absolute left-0 right-0 top-full mt-4 z-30 flex justify-center pointer-events-none">
                    <div className="bg-green-100 border-4 border-green-500 text-green-700 px-8 py-4 rounded-3xl shadow-2xl animate-bounce-short text-center">
                        <p className="text-2xl font-black">太棒了! (Great!)</p>
                        <p className="text-lg font-bold">+{pointsGained} Points</p>
                        <p className="text-sm font-normal mt-1 text-green-800">Reading aloud...</p>
                    </div>
                </div>
            )}
            
            <div className={`bg-white rounded-b-3xl rounded-t-none shadow-xl p-6 pt-10 border-b-8 border-indigo-100 transition-all duration-300 ${feedback === 'incorrect' ? 'animate-shake border-red-100' : ''}`}>
            
            {loading ? (
                 <div className="h-48 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin"></div>
                 </div>
            ) : (
                <>
                <div className="mb-4">
                    <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                      选择题 (Multiple Choice)
                    </span>
                    {user.mistakes.includes(question?.reviewId || -1) && (
                       <span className="ml-2 bg-red-100 text-red-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                         Reviewing Mistake
                       </span>
                    )}
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-6 leading-relaxed">
                   <span className="whitespace-pre-wrap">
                        {getRenderParts().map((item, i) => (
                            <React.Fragment key={i}>
                                {item.text}
                                {!item.isLast && (
                                    feedback === 'correct' ? (
                                        <span className="inline-block text-green-600 font-black border-b-4 border-green-300 mx-1 px-1">
                                            {item.answerText}
                                        </span>
                                    ) : (
                                        <span className="inline-block min-w-[80px] border-b-4 border-indigo-300 mx-1 text-center text-indigo-600">
                                            {feedback === 'incorrect' ? <span className="text-red-500 font-bold">{item.answerText}</span> : ''}
                                        </span>
                                    )
                                )}
                            </React.Fragment>
                        ))}
                    </span>
                </h2>

                {/* Flip Card for Translation */}
                <div 
                   onClick={() => setShowHint(true)}
                   className={`
                      relative cursor-pointer group h-16 rounded-xl transition-all duration-500
                      ${showHint 
                        ? 'bg-indigo-50 border border-indigo-100' 
                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-md transform hover:-translate-y-1'
                      }
                   `}
                >
                    <div className="absolute inset-0 flex items-center justify-center w-full h-full px-4 text-center">
                       {showHint ? (
                           <div className="animate-slide-in">
                             <p className="text-gray-400 text-xs font-bold mb-1 uppercase">Translation (翻译)</p>
                             <p className="text-lg text-indigo-900 font-bold">{question?.hint}</p>
                           </div>
                       ) : (
                           <div className="flex items-center gap-2 text-white font-bold animate-pulse">
                              <span>🃏</span>
                              <span>点击翻卡查看中文 (Tap to Reveal Chinese)</span>
                           </div>
                       )}
                    </div>
                </div>

                </>
            )}
            </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {question?.options.map((option, idx) => (
                <button
                    key={idx}
                    onClick={() => handleOptionClick(option)}
                    disabled={feedback !== 'none' || loading}
                    className={`
                        py-4 px-6 rounded-2xl font-bold text-lg text-left shadow-sm border-2 transition-all transform duration-200
                        ${getButtonState(option)}
                        ${feedback === 'none' && !loading ? 'hover:scale-[1.02] active:scale-95' : ''}
                    `}
                >
                    <span className="inline-block w-6 text-sm opacity-50 mr-2">{String.fromCharCode(65 + idx)}.</span>
                    {option}
                </button>
            ))}
        </div>
      </div>
      
      <button 
        onClick={onEndGame}
        className="text-gray-400 font-bold hover:text-gray-600 transition-colors py-4 flex items-center justify-center gap-2"
      >
        <span>🚪</span> 保存并退出 (Save & Quit)
      </button>
    </div>
  );
};

export default Game;