import { Route, Routes } from "react-router-dom"
import './App.css'
import './index.css'

import { Toaster } from "sonner"
import { AuthProvider } from "./hooks/useAuth"
import DashboardPage from "./pages/Dashboard"
import { LoginPage } from "./pages/Login"

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/*" element={<><DashboardPage/><Toaster richColors/></>} />
        <Route path="/login" element={<LoginPage/>} />
      </Routes>
    </AuthProvider>
  )
}

export default App
