import CoolLoader from "@/components/CoolLoader";
import { UserInfo } from "@/components/Types";
import axios from "axios";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type AuthContextType = {
    user: UserInfo | null;
    login: (username: string, password: string) => Promise<boolean | undefined>;
    logout: () => Promise<void>;
    isAuthenticated: boolean | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserInfo | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined)
    const navigate = useNavigate()

    // Set userInfo navigate to dashboard
    const completeLogin = (userInfo: UserInfo) => {
        setUser(userInfo);
        setIsAuthenticated(true);
        navigate("/aquaops")
    };

    // Attempt to login
    const login = async (username: string, password: string) => {
        const loginResponse = await axios.post(`${import.meta.env.VITE_API}/auth/login/`, {
            username: username,
            password: password
        }, { withCredentials: true })
        if (loginResponse.data.success) {
            completeLogin(loginResponse.data.user)
        } else {
            return false
        }
    }

    const logout = async () => {
        await axios.post(`${import.meta.env.VITE_API}/auth/logout/`, {}, {
            withCredentials: true,
            validateStatus: function (status) {
                return status < 500;
            }
        })
        setIsAuthenticated(false)
    }

    const checkSession = async () => {
        // Check if session token is valid
        const tokenResponse = await axios.get(`${import.meta.env.VITE_API}/auth/check-session`,
            { withCredentials: true })
        if (!tokenResponse.data.success) {
            await logout()
            return
        }
        // Fetch user data
        const userData = await axios.get(`${import.meta.env.VITE_API}/auth/self-info`,
            { withCredentials: true })
        completeLogin(userData.data.user)
    }

    useEffect(() => {
        checkSession()
    }, [])

    const value = useMemo(() => ({
        user, login, logout, isAuthenticated
    }), [user, isAuthenticated])

    if (isAuthenticated === undefined) {
        return <CoolLoader />
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within a AuthProvider')
    }
    return context
}