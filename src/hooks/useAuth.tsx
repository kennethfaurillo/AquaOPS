import { createContext, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "./useLocalStorage";
const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useLocalStorage("user", null)
    const [token, setToken] = useLocalStorage("token", null)
    const navigate = useNavigate()

    const login = async (user, token) => {
        setUser(user)
        setToken(token)
        console.log("redirected /")
        navigate("/", { replace: true})
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        navigate("/", { replace: true })
    }

    const value = useMemo(() => ({
        user, token, login, logout
    }), [user, token])
    
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    return useContext(AuthContext)
}