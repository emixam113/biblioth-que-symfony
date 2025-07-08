import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  firstname: string;
  lastname: string;
  email: string;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const login = useCallback((token: string, userData: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        navigate('/dashboard');
    }, [navigate]);

    const logout = useCallback(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    }, [navigate]);

    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:8000/api/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            if (!res.ok) throw new Error('Session expirée');

            const userData = await res.json();
            const userInfo = {
                firstname: userData.firstname || userData.email?.split('@')[0] || 'Utilisateur',
                lastname: userData.lastname || '',
                email: userData.email || '',
            };
            
            localStorage.setItem('user', JSON.stringify(userInfo));
            setUser(userInfo);
        } catch (err) {
            console.error("Erreur de rafraîchissement :", err);
            logout();
        } finally {
            setLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        const initAuth = async () => {
            const cachedUser = localStorage.getItem('user');
            if (cachedUser) {
                try {
                    const userData = JSON.parse(cachedUser);
                    setUser(userData);
                    // Rafraîchir les données utilisateur en arrière-plan
                    refreshUser();
                } catch (e) {
                    console.error("Erreur lecture cache", e);
                    setError("Erreur de lecture des données utilisateur");
                }
            } else {
                await refreshUser();
            }
        };

        initAuth();
    }, [refreshUser]);

    return { 
        user, 
        loading, 
        error, 
        login, 
        logout,
        refreshUser
    };
}