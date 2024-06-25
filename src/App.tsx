import { Route, Routes, useRoutes } from "react-router-dom"
import './App.css'
import './index.css'

import { ProtectedRoute } from "./routes/ProtectedRoute"
import DashboardPage from "./pages/Dashboard"
import { LoginPage } from "./pages/Login"
import { AuthProvider } from "./hooks/useAuth"

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/*" element={<ProtectedRoute><DashboardPage/></ProtectedRoute>}/>
        <Route path="/login" element={<LoginPage/>}/>
      </Routes>
    </AuthProvider>
  )
}

export default App
