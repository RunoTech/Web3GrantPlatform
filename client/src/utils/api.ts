const BASE_URL = '';

export const api = {
  async get(url: string) {
    const response = await fetch(`${BASE_URL}${url}`);
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${response.status}: ${error}`);
    }
    return response.json();
  },

  async post(url: string, data?: any) {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${response.status}: ${error}`);
    }
    
    return response.json();
  },

  async put(url: string, data?: any) {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${response.status}: ${error}`);
    }
    
    return response.json();
  },

  async delete(url: string) {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${response.status}: ${error}`);
    }
    
    return response.json();
  }
};