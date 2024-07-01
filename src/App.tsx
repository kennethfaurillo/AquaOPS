import { Route, Routes } from "react-router-dom"
import './App.css'
import './index.css'

import { AuthProvider } from "./hooks/useAuth"
import DashboardPage from "./pages/Dashboard"
import { LoginPage } from "./pages/Login"
import { Toaster } from "sonner"

function App() {
  return (
    <AuthProvider>
      <Routes>
                <Route path="/*" element={<><DashboardPage /><Toaster richColors/></>} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
