import { useAuth } from "@/hooks/useAuth"
import { useEffect } from "react"
import { Navigate, Outlet } from "react-router-dom"

export default function ProtectedRoutes() {
    const { isAuthenticated } = useAuth()
    return isAuthenticated ? <Outlet /> : <Navigate to="/aquaops/login" replace={true} />
}
