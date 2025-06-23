import { lazy } from "react"
import { Route, Routes } from "react-router-dom"
import './App.css'
import './index.css'
import { Toaster } from "sonner"
import { AuthProvider } from "./hooks/useAuth"
const DashboardPage = lazy(() => import('@/pages/Dashboard'));
import { LoginPage } from "./pages/Login"
import { SharedStateProvider } from "./hooks/useSharedStateContext"
import ErrorBoundary from "@/components/ErrorBoundary"
import logoHorizontal from './assets/logo-horizontal.png'
import { WebSocketProvider } from "./hooks/useWebSocket"
import { LogDataProvider } from "./hooks/useLogData"
import ProtectedRoutes from "./components/ProtectedRoutes"
import { TooltipProvider } from "./components/ui/tooltip"
import { PocketBaseProvider } from "./hooks/usePocketbase"

const ErrorFallback = () => (
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
  </div>
)

function App() {
  return (
    <AuthProvider>
      <PocketBaseProvider>
        <ErrorBoundary fallback={<ErrorFallback />}>
          <SharedStateProvider>
            <TooltipProvider>
              <Routes >
                <Route path="/aquaops/login" element={<LoginPage />} />
                <Route element={<ProtectedRoutes />}>
                  <Route path="/aquaops/*" element={
                    <LogDataProvider>
                      <WebSocketProvider>
                        <DashboardPage />
                      </WebSocketProvider>
                    </LogDataProvider>
                  } />
                </Route>
              </Routes>
            </TooltipProvider>
            <Toaster richColors />
          </SharedStateProvider>
        </ErrorBoundary>
      </PocketBaseProvider>
    </AuthProvider>
  )
}

export default App
