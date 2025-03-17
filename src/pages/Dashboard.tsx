import { lazy, Suspense, useEffect } from "react";
import TableCard from "@/components/TableCard";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useAuth } from "@/hooks/useAuth";
import { DrawerProvider } from "@/hooks/useDrawerContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Navigate } from "react-router-dom";
import '../App.css';
import Header from "../components/Header";
const LoggerMapCard = lazy(() => import('@/components/Map'));
import '../index.css';
import { DialogProvider } from "@/hooks/useDialogContext";


function DashboardPage() {
    const { user, token, validateToken } = useAuth()
    const [dashboardPrefs, setDashboardPrefs] = useLocalStorage('dashboardPrefs', {
        showLoggerList: true,
        showLoggerMap: true
    })
    const isWideScreen = window.innerWidth >= 1280

    if (!token || !user) {
        return <Navigate to={"/aquaops/login"} />
    }
    return (
        <div className='h-[cmd80dvh] sm:h-[100dvh] overflow-hidden bg-slate-100'>
            <Header user={{ "FirstName": "Piwad", "LastName": user.Username }} dashboardPrefs={dashboardPrefs} setDashboardPrefs={setDashboardPrefs} />
            <DialogProvider>
                <DrawerProvider>
                    {isWideScreen && dashboardPrefs?.showLoggerList && dashboardPrefs?.showLoggerMap ? (
                        <ResizablePanelGroup direction="horizontal">
                            <ResizablePanel minSize={25} className="mx-2">
                                <TableCard />
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={76} minSize={45} className="mx-2">
                                <Suspense fallback={<div>Loading Map...</div>}>
                                    <LoggerMapCard />
                                </Suspense>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    ) : (
                        <div className="grid grid-cols-12 gap-4">
                            {dashboardPrefs?.showLoggerList ? (
                                <div className={`col-span-full xl:col-span-3`}>
                                    <TableCard />
                                </div>
                            ) : null}
                            {dashboardPrefs?.showLoggerMap ? (
                                <div className={`col-span-full xl:col-span-${dashboardPrefs?.showLoggerList ? 9 : 'full'} z-0`}>
                                    <Suspense fallback={<div>Loading Map...</div>}>
                                        <LoggerMapCard />
                                    </Suspense>
                                </div>
                            ) : null}
                        </div>
                    )}
                </DrawerProvider>
            </DialogProvider>
        </div>
    )
}

export default DashboardPage