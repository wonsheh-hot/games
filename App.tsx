import React, { useState, useEffect, useRef } from 'react';
import Login from './components/Login';
import Game from './components/Game';
import Leaderboard from './components/Leaderboard';
import { User, LeaderboardEntry, Question } from './types';
import { generateQuestion } from './services/geminiService';

function App() {
  const [view, setView] = useState<'login' | 'game' | 'leaderboard'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  // Store mistakes map: { "username": [id1, id2, ...] }
  const [mistakeHistory, setMistakeHistory] = useState<Record<string, number[]>>({});

  // Ref to hold the pre-loaded first question promise
  const firstQuestionPromiseRef = useRef<Promise<Question> | null>(null);

  // Load leaderboard and mistake history from local storage on mount
  useEffect(() => {
    // Immediately start generating the first question in the background
    // We pass empty mistakes array since we don't know the user yet
    firstQuestionPromiseRef.current = generateQuestion([]);

    // Leaderboard
    const savedBoard = localStorage.getItem('engpower-leaderboard');
    if (savedBoard) {
      try {
        setLeaderboard(JSON.parse(savedBoard));
      } catch (e) {
        console.error("Failed to parse leaderboard", e);
      }
    }

    // Mistakes
    const savedMistakes = localStorage.getItem('engpower-mistakes');
    if (savedMistakes) {
      try {
        setMistakeHistory(JSON.parse(savedMistakes));
      } catch (e) {
        console.error("Failed to parse mistakes", e);
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    // Inject previous mistakes if they exist for this user
    const existingMistakes = mistakeHistory[user.username] || [];
    const userWithHistory = { ...user, mistakes: existingMistakes };
    
    setCurrentUser(userWithHistory);
    setView('game');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    
    // Update local mistake history state
    const newMistakeHistory = {
        ...mistakeHistory,
        [updatedUser.username]: updatedUser.mistakes
    };
    setMistakeHistory(newMistakeHistory);
    
    // Save to local storage
    localStorage.setItem('engpower-mistakes', JSON.stringify(newMistakeHistory));
  };

  const handleEndGame = () => {
    if (currentUser) {
      const newEntry: LeaderboardEntry = {
        username: currentUser.username,
        score: currentUser.score,
        avatarId: currentUser.avatarId,
        date: new Date().toISOString(),
      };

      // Update leaderboard state and local storage
      const updatedLeaderboard = [...leaderboard, newEntry];
      
      const uniqueLeaderboard: LeaderboardEntry[] = [];
      const map = new Map();
      
      // Sort all by score desc first
      updatedLeaderboard.sort((a, b) => b.score - a.score);
      
      for (const item of updatedLeaderboard) {
          if (!map.has(item.username)) {
              map.set(item.username, true);
              uniqueLeaderboard.push(item);
          }
      }

      setLeaderboard(uniqueLeaderboard);
      localStorage.setItem('engpower-leaderboard', JSON.stringify(uniqueLeaderboard));
      
      setView('leaderboard');
    }
  };

  const handleRestart = () => {
    setCurrentUser(null);
    setView('login');
    // Preload again for the next game session
    firstQuestionPromiseRef.current = generateQuestion([]);
  };

  return (
    <div className="font-sans antialiased text-gray-900">
      {view === 'login' && <Login onLogin={handleLogin} />}
      {view === 'game' && currentUser && (
        <Game 
          user={currentUser} 
          onUpdateUser={handleUpdateUser} 
          onEndGame={handleEndGame}
          initialQuestionPromise={firstQuestionPromiseRef.current}
        />
      )}
      {view === 'leaderboard' && (
        <Leaderboard 
          entries={leaderboard} 
          currentUser={currentUser || undefined}
          onBack={handleRestart} 
        />
      )}
    </div>
  );
}

export default App;