import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UserInfo } from "@/components/Types";
import CoolLoader from "@/components/CoolLoader";

type AuthContextType = {
    user: UserInfo;
    token: string | null;
    login: (user: UserInfo, token: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserInfo | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined)
    const navigate = useNavigate()

    const login = async (user: UserInfo) => {
        setUser(user)
        setIsAuthenticated(true)
        navigate("/aquaops", { replace: true })
    }

    const logout = async () => {
        // Non 200 responses need to be caught
        try {
            await axios.post(`${import.meta.env.VITE_API}/auth/logout/`, {}, { withCredentials: true })
        } catch (error) {
            // console.error("Logout error: Invalid session")
        }
        console.log("Logout successful")
        setIsAuthenticated(false)
        navigate("/aquaops/login", { replace: true })
    }

    const checkSession = async () => {
        // Check if session token
        const tokenResponse = await axios.get(`${import.meta.env.VITE_API}/auth/check-session`,
            { withCredentials: true })
        // invalid session
        if (!tokenResponse.data.success) {
            console.log(tokenResponse.data.message)
            await logout()
            return
        }
        // fetch user data
        const userData = await axios.get(`${import.meta.env.VITE_API}/auth/self-info`,
            { withCredentials: true })
        login(userData.data.user)
    }

    useEffect(() => {
        checkSession()
    }, [])

    const value = useMemo(() => ({
        user, token, login, logout, isAuthenticated
    }), [user, token, isAuthenticated])

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