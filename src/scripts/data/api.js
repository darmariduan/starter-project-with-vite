import CONFIG from '../config';

class StoryAPI {
  static async register({ name, email, password }) {
    const response = await fetch(`${CONFIG.BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const responseJson = await response.json();

    if (!response.ok) {
      throw new Error(responseJson.message || 'Failed to register');
    }

    return responseJson;
  }

  static async login({ email, password }) {
    const response = await fetch(`${CONFIG.BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const responseJson = await response.json();

    if (!response.ok) {
      throw new Error(responseJson.message || 'Failed to login');
    }

    return responseJson;
  }

  static async getStories() {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseJson = await response.json();

    if (!response.ok) {
      throw new Error(responseJson.message || 'Failed to get stories');
    }

    return responseJson;
  }

  static async getStoriesWithLocation() {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${CONFIG.BASE_URL}/stories?location=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseJson = await response.json();

    if (!response.ok) {
      throw new Error(responseJson.message || 'Failed to get stories');
    }

    return responseJson;
  }

  static async addStory(formData) {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const responseJson = await response.json();

    if (!response.ok) {
      throw new Error(responseJson.message || 'Failed to add story');
    }

    return responseJson;
  }

  static async getStoryDetail(id) {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${CONFIG.BASE_URL}/stories/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseJson = await response.json();

    if (!response.ok) {
      throw new Error(responseJson.message || 'Failed to get story detail');
    }

    return responseJson;
  }
}

export default StoryAPI;