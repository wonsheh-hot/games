import React from 'react';
import { LeaderboardEntry, User } from '../types';
import { AVATARS } from '../constants';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUser?: User;
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries, currentUser, onBack }) => {
  // Sort entries by score descending
  const sortedEntries = [...entries].sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <div className="min-h-screen p-4 pt-10 animate-slide-in max-w-md mx-auto">
      <h2 className="text-3xl font-display font-bold text-center text-indigo-700 mb-2">
        🏆 排行榜
      </h2>
      <p className="text-center text-gray-500 mb-8">Leaderboard</p>

      <div className="bg-white rounded-3xl shadow-xl border-2 border-indigo-100 overflow-hidden">
        {sortedEntries.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
                <p>暂无记录，快来争夺第一名！</p>
                <p className="text-sm mt-1">No records yet. Be the first!</p>
            </div>
        ) : (
            sortedEntries.map((entry, index) => {
            const isCurrentUser = currentUser && entry.username === currentUser.username && entry.score === currentUser.score;
            let rankBadge = null;
            if (index === 0) rankBadge = "🥇";
            else if (index === 1) rankBadge = "🥈";
            else if (index === 2) rankBadge = "🥉";
            else rankBadge = `${index + 1}`;

            return (
                <div 
                key={`${entry.username}-${index}`}
                className={`flex items-center p-4 border-b border-gray-100 last:border-0 ${isCurrentUser ? 'bg-indigo-50' : ''}`}
                >
                <div className="w-8 text-center font-bold text-gray-400 text-lg mr-2">
                    {rankBadge}
                </div>
                <div className="text-2xl mr-3">{AVATARS[entry.avatarId]}</div>
                <div className="flex-1">
                    <p className={`font-bold ${isCurrentUser ? 'text-indigo-700' : 'text-gray-800'}`}>
                    {entry.username} {isCurrentUser && '(你)'}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(entry.date).toLocaleDateString()}</p>
                </div>
                <div className="font-display font-bold text-xl text-indigo-600">
                    {entry.score}
                </div>
                </div>
            );
            })
        )}
      </div>

      <button
        onClick={onBack}
        className="w-full mt-8 bg-white text-indigo-600 font-bold py-4 rounded-xl border-2 border-indigo-100 hover:bg-indigo-50 transition-colors shadow-sm"
      >
        再玩一次 (Play Again)
      </button>
    </div>
  );
};

export default Leaderboard;