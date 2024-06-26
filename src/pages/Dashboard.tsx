import LatestLogsCard from "@/components/LatestLogsCard";
import '../App.css';
import Header from "../components/Header";
import LoggerMapCard from "../components/Map";
import '../index.css';
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";

function DashboardPage() {
    const { user, token, logout } = useAuth()

    const validateToken = async (_user, _token) => {
        console.log("valid token")
        // console.log(_user, _token)
        const validateTokenResponse = await axios.post(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/auth/validate-token/`, {
            user: _user,
            token: _token
        })
        if (validateTokenResponse.data.pass) {
            console.log("valid token")
            // await login(validateTokenResponse.data.user, validateTokenResponse.data.Token)
        } else {
            console.log("Token invalid/expired")
            await logout()
        }
    }

    useEffect(() => {
        (async () => {
            if (token && user) {
                // console.log(user.Username, token)
                await validateToken(user, token)
            }
        })()
    }, [])

    if (token && user) {
        return (
            <>
                <div className='m-auto h-dvh bg-slate-100'>
                    <Header user={{ "FirstName": "Mr.", "LastName": "Piwad" }} />
                    <div className='grid grid-cols-12 gap-2 mt-2 mx-4 '>
                        <div className="col-span-full xl:col-span-3">
                            <LatestLogsCard />
                        </div>
                        <div className="col-span-full xl:col-span-9 z-0">
                            <LoggerMapCard />
                        </div>
                    </div>
                </div >
            </>
        )
    }
    return <Navigate to={"/login"} />
}

export default DashboardPage