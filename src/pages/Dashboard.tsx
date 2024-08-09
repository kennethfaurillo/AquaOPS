import TableCard from "@/components/TableCard";
import { useAuth } from "@/hooks/useAuth";
import { DrawerDialogProvider } from "@/hooks/useDrawerDialogContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useEffect } from "react";
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
                <div className='m-auto h-dvh bg-slate-100'>
                    <Header user={{ "FirstName": "Piwad", "LastName": user.Username }} dashboardPrefs={dashboardPrefs} setDashboardPrefs={setDashboardPrefs} />
                        <ResizablePanelGroup direction="horizontal">
                        <DrawerDialogProvider>
                            <ResizablePanel minSize={24}>
                            {dashboardPrefs?.showLoggerList ?
                                    <TableCard />
                                 : null
                            }
                            </ResizablePanel>
                            <ResizableHandle withHandle/>
                            <ResizablePanel defaultSize={76} minSize={45}>
                            {dashboardPrefs?.showLoggerMap ?
                                <div className={`col-span-full xl:col-span-${dashboardPrefs?.showLoggerList ? 9: 'full'} z-0`}>
                                    <LoggerMapCard />
                                </div> : null
                            }
                            </ResizablePanel>
                        </DrawerDialogProvider>
                        </ResizablePanelGroup>
                    </div>
            </>
        )
    }
    return <Navigate to={"/login"} />
}

export default DashboardPage