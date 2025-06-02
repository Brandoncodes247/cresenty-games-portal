import React, { createContext, useContext, useState, useEffect } from 'react';
import { progressAPI } from '../services/api';
import { useUser } from './UserContext';

const ProgressContext = createContext();

export function ProgressProvider({ children }) {
  const { user } = useUser();
  const [gameProgress, setGameProgress] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadProgress();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError(null);

      const [progressData, achievementsData, statsData] = await Promise.all([
        progressAPI.getGameProgress(),
        progressAPI.getAchievements(),
        progressAPI.getStats()
      ]);

      // Convert progress array to object for easier access
      const progressObject = progressData.reduce((acc, game) => {
        acc[game.url_path] = game;
        return acc;
      }, {});

      setGameProgress(progressObject);
      setAchievements(achievementsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load progress:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateGameProgress = async (gameId, score) => {
    try {
      setError(null);
      const updatedProgress = await progressAPI.updateGameProgress(gameId, score);
      
      // Update local state
      setGameProgress(prev => ({
        ...prev,
        [updatedProgress.url_path]: updatedProgress
      }));

      // Reload stats
      const statsData = await progressAPI.getStats();
      setStats(statsData);

      return updatedProgress;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getGameProgress = (gameUrl) => {
    return gameProgress[gameUrl] || null;
  };

  const value = {
    gameProgress,
    achievements,
    stats,
    loading,
    error,
    updateGameProgress,
    getGameProgress,
    refreshProgress: loadProgress
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
} 