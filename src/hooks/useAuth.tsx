import { createContext, useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "./useLocalStorage";
import axios from "axios";
const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useLocalStorage("user", null)
    const [token, setToken] = useLocalStorage("token", null)
    const navigate = useNavigate()

    const login = async (user, token) => {
        setUser(user)
        setToken(token)
        navigate("/aquaops", { replace: true })
    }

    const logout = async () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        navigate("/aquaops", { replace: true })
    }

    const validateToken = async (_user, _token) => {
        const validateTokenResponse = await axios.post(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/auth/validate-token/`, {
            user: _user,
            token: _token
        })
        if (validateTokenResponse.data.pass) {
            await login(validateTokenResponse.data.user, _token)
        } else {
            await logout()
        }
    }

    useEffect(() => {
        (async () => {
            if (user && token) {
                await validateToken(user, token)
            }
        })();
    }, [])

    const value = useMemo(() => ({
        user, token, login, logout, validateToken
    }), [user, token])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    return useContext(AuthContext)
}