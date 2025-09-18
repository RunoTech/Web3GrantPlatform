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
  admin: AdminUser;
  message?: string;
}

export function useAdminAuth() {
  const queryClient = useQueryClient();

  // Check if admin is authenticated
  const { data: admin, isLoading, error } = useQuery<AdminUser>({
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
      if (data.success) {
        // SECURITY FIX: No more localStorage token storage - httpOnly cookies handle authentication
        // Set admin data directly in cache to immediately update isAuthenticated
        queryClient.setQueryData(["/api/youhonor/me"], data.admin);
        
        // Invalidate admin queries to refetch with new authentication state
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
      // SECURITY FIX: No localStorage cleanup needed - httpOnly cookies cleared by server
      
      // Clear all admin queries
      queryClient.removeQueries({ queryKey: ["/api/youhonor"] });
      
      // Redirect to admin login
      window.location.href = "/youhonor/login";
    },
  });

  // SECURITY FIX: No manual auth setup needed - httpOnly cookies automatically sent
  const setupAdminAuth = () => {
    // Authentication now handled automatically via httpOnly cookies
    // No client-side token management required
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

/**
 * @deprecated This function always returns false due to httpOnly cookie security.
 * Use the useAdminAuth() hook's `isAuthenticated` state instead.
 * 
 * SECURITY: Admin authentication is now managed server-side via httpOnly cookies
 * which cannot be accessed by client-side JavaScript for security reasons.
 */
export function isAdmin(): false {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️ isAdmin() is deprecated and always returns false.\n' +
      '📝 Use useAdminAuth() hook instead:\n' +
      '   const { isAuthenticated } = useAdminAuth();\n' +
      '🔒 This is for security - admin tokens are now in httpOnly cookies.'
    );
  }
  
  // SECURITY: Cannot check httpOnly cookies client-side - this is intentional
  // Client should use the useAdminAuth hook's isAuthenticated state instead
  return false;
}

// SECURITY FIX: No admin token access - tokens now in httpOnly cookies
export function getAdminToken(): string | null {
  // Tokens are now stored in httpOnly cookies and cannot be accessed by client-side JavaScript
  return null;
}