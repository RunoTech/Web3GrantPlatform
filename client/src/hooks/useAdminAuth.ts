import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  active: boolean;
  lastLogin: string | null;
  createdAt: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token: string;
  admin: AdminUser;
  message?: string;
}

export function useAdminAuth() {
  const queryClient = useQueryClient();

  // Check if admin is authenticated
  const { data: admin, isLoading, error } = useQuery({
    queryKey: ["/api/youhonor/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
      const response = await apiRequest("POST", "/api/youhonor/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.token) {
        // Store token in localStorage
        localStorage.setItem("admin_token", data.token);
        
        // Set admin data directly in cache to immediately update isAuthenticated
        queryClient.setQueryData(["/api/youhonor/me"], data.admin);
        
        // Invalidate admin queries to refetch with new token
        queryClient.invalidateQueries({ queryKey: ["/api/youhonor"] });
      }
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/youhonor/logout");
      return response.json();
    },
    onSuccess: () => {
      // Clear token from localStorage
      localStorage.removeItem("admin_token");
      
      // Clear all admin queries
      queryClient.removeQueries({ queryKey: ["/api/youhonor"] });
      
      // Redirect to admin login
      window.location.href = "/youhonor/login";
    },
  });

  // Setup axios interceptor for admin token on component mount
  const setupAdminAuth = () => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      queryClient.setDefaultOptions({
        queries: {
          meta: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      });
    }
  };

  return {
    admin,
    isLoading,
    isAuthenticated: !!admin && !error,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    loginLoading: loginMutation.isPending,
    logoutLoading: logoutMutation.isPending,
    loginError: loginMutation.error,
    setupAdminAuth,
  };
}

// Utility function to check if user is admin
export function isAdmin(): boolean {
  const token = localStorage.getItem("admin_token");
  return !!token;
}

// Utility function to get admin token
export function getAdminToken(): string | null {
  return localStorage.getItem("admin_token");
}