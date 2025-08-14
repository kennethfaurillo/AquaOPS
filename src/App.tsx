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
import { WebSocketProvider } from "./hooks/useWebSocket"
import { LogDataProvider } from "./hooks/useLogData"
import ProtectedRoutes from "./components/ProtectedRoutes"
import { TooltipProvider } from "./components/ui/tooltip"
import { PocketBaseProvider } from "./hooks/usePocketbase"
import { ErrorFallback } from "./components/ErrorFallback"
import { EnvironmentBanner } from "./components/EnvironmentBanner"

function App() {
  return (
    <AuthProvider>
      <PocketBaseProvider>
        <ErrorBoundary fallback={<ErrorFallback />}>
          <SharedStateProvider>
            <WebSocketProvider>
              <TooltipProvider>
                <EnvironmentBanner/>
                <Routes >
                  <Route path="/login" element={<LoginPage />} />
                  <Route element={<ProtectedRoutes />}>
                    <Route path="/*" element={
                      <LogDataProvider>
                        <DashboardPage />
                      </LogDataProvider>
                    } />
                  </Route>
                </Routes>
              </TooltipProvider>
              <Toaster richColors />
            </WebSocketProvider>
          </SharedStateProvider>
        </ErrorBoundary>
      </PocketBaseProvider>
    </AuthProvider>
  )
}

export default App
