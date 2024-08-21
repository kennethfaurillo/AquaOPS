import TableCard from "@/components/TableCard";
import { useAuth } from "@/hooks/useAuth";
import { DrawerDialogProvider } from "@/hooks/useDrawerDialogContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import '../App.css';
import Header from "../components/Header";
import LoggerMapCard from "../components/Map";
import '../index.css';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";


function DashboardPage() {
    const { user, token, validateToken } = useAuth()
    const [dashboardPrefs, setDashboardPrefs] = useLocalStorage('dashboardPrefs', {
        showLoggerList: true,
        showLoggerMap: true
    })
    const isWideScreen = window.innerWidth >= 1280


    useEffect(() => {
        (async () => {
            if (token && user) {
                await validateToken(user, token)
            }
        })()
    }, [])
    if (token && user) {
        return (
            <>
                <div className='h-[cmd80dvh] sm:h-[100dvh] overflow-hidden bg-slate-100'>
                    <Header user={{ "FirstName": "Piwad", "LastName": user.Username }} dashboardPrefs={dashboardPrefs} setDashboardPrefs={setDashboardPrefs} />
                    <DrawerDialogProvider>
                        {isWideScreen && dashboardPrefs?.showLoggerList && dashboardPrefs?.showLoggerMap ? (
                            <ResizablePanelGroup direction="horizontal">
                                <ResizablePanel minSize={25} className="mx-2">
                                    <TableCard/>
                                </ResizablePanel>
                                <ResizableHandle withHandle />
                                <ResizablePanel defaultSize={76} minSize={45} className="mx-2">
                                    <LoggerMapCard/>
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
                                        <LoggerMapCard />
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </DrawerDialogProvider>
                </div>
            </>
        )
    }
    return <Navigate to={"/login"} />
}

export default DashboardPage