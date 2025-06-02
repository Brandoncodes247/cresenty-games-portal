const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Helper function to handle API requests
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Something went wrong');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Auth API
export const authAPI = {
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  register: async (username, email, password) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
  }
};

// Progress API
export const progressAPI = {
  getGameProgress: async () => {
    return apiRequest('/progress/games');
  },

  updateGameProgress: async (gameId, score) => {
    return apiRequest(`/progress/games/${gameId}`, {
      method: 'POST',
      body: JSON.stringify({ score })
    });
  },

  getAchievements: async () => {
    return apiRequest('/progress/achievements');
  },

  getStats: async () => {
    return apiRequest('/progress/stats');
  }
};

// User API
export const userAPI = {
  getProfile: async () => {
    return apiRequest('/user/profile');
  },

  updateProfile: async (data) => {
    return apiRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};

// Game API
export const gameAPI = {
  getGames: async () => {
    return apiRequest('/games');
  },

  getGameDetails: async (gameId) => {
    return apiRequest(`/games/${gameId}`);
  }
}; 