import React, { useState } from 'react';
import { AVATARS } from '../constants';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  const handleStart = () => {
    if (username.trim().length > 0) {
      onLogin({
        username: username.trim(),
        score: 0,
        streak: 0,
        bestStreak: 0,
        avatarId: selectedAvatar,
        mistakes: [], // Initialize empty mistakes list
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-slide-in">
      <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl w-full max-w-md border-4 border-white ring-1 ring-indigo-100">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-primary mb-2">EngPower</h1>
          <p className="text-indigo-900 text-lg font-bold">八年级英语短语大师</p>
          <p className="text-gray-400 text-sm">8th Grade Phrase Master</p>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">
            选择你的头像 (Pick Your Avatar)
          </label>
          <div className="flex flex-wrap gap-2 justify-center mb-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            {AVATARS.map((emoji, index) => (
              <button
                key={index}
                onClick={() => setSelectedAvatar(index)}
                className={`text-2xl w-10 h-10 rounded-full transition-all transform hover:scale-110 ${
                  selectedAvatar === index
                    ? 'bg-white shadow-lg ring-2 ring-primary scale-110'
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">
            你的名字 (Your Name)
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder="请输入名字 / Enter your name..."
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 focus:outline-none text-lg transition-colors bg-white"
          />
        </div>

        <button
          onClick={handleStart}
          disabled={!username.trim()}
          className={`w-full py-4 rounded-xl text-white font-bold text-xl shadow-lg transform transition-all active:scale-95 ${
            username.trim()
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:shadow-xl'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          开始游戏 (Start Game) 🚀
        </button>
      </div>
    </div>
  );
};

export default Login;