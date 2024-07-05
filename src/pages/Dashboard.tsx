import LatestLogsCard from "@/components/LatestLogsCard";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import '../App.css';
import Header from "../components/Header";
import LoggerMapCard from "../components/Map";
import '../index.css';
import { DrawerDialogProvider } from "@/hooks/useDrawerDialogContext";


function DashboardPage() {
    const { user, token, validateToken } = useAuth()

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
                    <Header user={{ "FirstName": "Piwad", "LastName": user.Username }} />
                    <div className='grid grid-cols-12 gap-2 mt-2 mx-4 '>
                        <DrawerDialogProvider>
                        <div className="col-span-full xl:col-span-3">
                            <LatestLogsCard />
                        </div>
                        <div className="col-span-full xl:col-span-9 z-0">
                            <LoggerMapCard />
                        </div>
                        </DrawerDialogProvider>
                    </div>
                </div >
            </>
        )
    }
    return <Navigate to={"/login"} />
}

export default DashboardPage