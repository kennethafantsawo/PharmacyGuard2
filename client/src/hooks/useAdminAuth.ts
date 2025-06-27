import { useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
  const { toast } = useToast();

  const login = useCallback(async (password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiRequest("POST", "/api/admin/login", { password });
      const data = await response.json();
      
      if (response.ok) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        
        toast({
          title: "Connexion réussie",
          description: "Accès administrateur accordé",
        });
        
        // Store password in session storage for API calls
        sessionStorage.setItem("admin_password", password);
        
        return true;
      } else {
        throw new Error(data.error || "Erreur de connexion");
      }
    } catch (error: any) {
      setState({
        isAuthenticated: false,
        isLoading: false,
        error: error.message,
      });
      
      toast({
        title: "Erreur de connexion",
        description: error.message || "Mot de passe incorrect",
        variant: "destructive",
      });
      
      return false;
    }
  }, [toast]);

  const logout = useCallback(() => {
    setState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    sessionStorage.removeItem("admin_password");
    
    toast({
      title: "Déconnexion",
      description: "Session administrateur fermée",
    });
  }, [toast]);

  const getAuthenticatedApiRequest = useCallback(async (method: string, url: string, data?: any) => {
    const password = sessionStorage.getItem("admin_password");
    
    if (!password) {
      throw new Error("Session expirée - reconnectez-vous");
    }
    
    const requestData = data ? { ...data, password } : { password };
    return apiRequest(method, url, requestData);
  }, []);

  return {
    ...state,
    login,
    logout,
    getAuthenticatedApiRequest,
  };
}