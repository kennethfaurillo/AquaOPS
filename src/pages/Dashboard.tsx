import LatestLogsCard from "@/components/LatestLogsCard";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import '../App.css';
import Header from "../components/Header";
import LoggerMapCard from "../components/Map";
import '../index.css';
import { DrawerDialogProvider } from "@/hooks/useDrawerDialogContext";
import { ExpandIcon } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";


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
                    <div className='grid grid-cols-12 gap-2 mt-2 mx-4 '>
                        <DrawerDialogProvider>
                            {dashboardPrefs?.showLoggerList ?
                                <div className={`col-span-full xl:col-span-${dashboardPrefs?.showLoggerMap ? 3: 'full'}`}>
                                    <LatestLogsCard />
                                </div> : null
                            }
                            {dashboardPrefs?.showLoggerMap ?
                                <div className={`col-span-full xl:col-span-${dashboardPrefs?.showLoggerList ? 9: 'full'} z-0`}>
                                    <LoggerMapCard />
                                </div> : null
                            }
                        </DrawerDialogProvider>
                    </div>
                </div >
            </>
        )
    }
    return <Navigate to={"/login"} />
}

export default DashboardPage