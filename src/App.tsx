import { lazy } from "react"
import { Route, Routes } from "react-router-dom"
import './App.css'
import './index.css'
import { Toaster } from "sonner"
import { AuthProvider } from "./hooks/useAuth"
const DashboardPage = lazy(() => import('@/pages/Dashboard'));
import { LoginPage } from "./pages/Login"
import { SharedStateProvider } from "./hooks/useSharedStateContext"
import ErrorBoundary from "./ErrorBoundary"
import logoHorizontal from './assets/logo-horizontal.png'

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary fallback={
        <div className="flex flex-col items-center justify-center h-screen border-black rounded-xl">
            <div className="bg-zinc-100 rounded-xl p-16">
            <img src={logoHorizontal} className="h-24 p-2" />
            <h1>Oops! Something went wrong</h1>
            <p>We encountered an unexpected error. Please try refreshing the page or contact support if the issue persists.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Page
            </button>
            </div>
        </div>}>
        <SharedStateProvider>
          <Routes >
            <Route path="/aquaops/login" element={<LoginPage />} />
            <Route path="/aquaops/*" element={<DashboardPage />} />
          </Routes>
          <Toaster richColors />
        </SharedStateProvider>
      </ErrorBoundary>
    </AuthProvider>
  )
}

export default App
