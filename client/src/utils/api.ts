import { apiRequest } from "@/lib/queryClient";

export const api = {
  get: async (url: string) => {
    const response = await apiRequest("GET", url);
    return response.json();
  },
  
  post: async (url: string, data?: any, options?: { headers?: Record<string, string> }) => {
    const response = await apiRequest("POST", url, data);
    if (options?.headers) {
      // Headers are handled in apiRequest
    }
    return response.json();
  },
  
  put: async (url: string, data?: any) => {
    const response = await apiRequest("PUT", url, data);
    return response.json();
  },
  
  delete: async (url: string) => {
    const response = await apiRequest("DELETE", url);
    return response.json();
  },
};
