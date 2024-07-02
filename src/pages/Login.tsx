import Header from "@/components/Header";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

export const LoginPage = () => {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [alertOpen, setAlertOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const { user, token, login, logout } = useAuth()

    const validateToken = async (_user, _token) => {
        console.log("valid token")
        // console.log(_user, _token)
        const validateTokenResponse = await axios.post(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/auth/validate-token/`, {
            user: _user,
            token: _token
        })
        if (validateTokenResponse.data.pass) {
            console.log("valid token")
            await login(validateTokenResponse.data.user, validateTokenResponse.data.Token)
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
                // console.log("validated")
            }
            setLoading(false)
        })()
        // console.log("returned")
        // return (setLoading(false))
    }, [])

    const handleLogin = async (event) => {
        event.preventDefault()
        const authResponse = await axios.post(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/auth/login/`, {
            username: username,
            password: password
        })
        if (authResponse.data.pass) {
            await login(authResponse.data.user, authResponse.data.Token)
            // console.log(authResponse.data.Token)
        } else {
            console.log(authResponse.data)
            // alert("Invalid username or password!")
            setAlertOpen(true)
        }
    }

    return (
        <>{!loading ? <>
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen} >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Invalid Username or Password</AlertDialogTitle>
                        <Separator className="bg-piwad-blue-500" />
                        <AlertDialogDescription>
                            Please check your username and password and try again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        {/* <AlertDialogCancel >Cancel</AlertDialogCancel> */}
                        <AlertDialogAction className="bg-piwad-lightyellow-500 text-black hover:bg-accent">OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Header />
            <div className="w-full h-screen">
                <div className="grid grid-cols-12 border-red-200">
                    <div className="col-span-12 py-8 justify-center">
                        <div className="mx-auto w-fit border-4 border-piwad-blue-400 rounded-lg p-5 space-y-2">
                            <div className="text-center">
                                <h1 className="text-3xl font-bold">Login</h1>
                                <p className="text-balance text-muted-foreground">Enter your account details below to login to your account</p>
                                <Separator className="my-2 bg-piwad-blue-400/60" />
                            </div>
                            <div className="col-span-4">
                                <form onSubmit={handleLogin} className="space-y-2">
                                    <div>
                                        <Label htmlFor="username">Username:</Label>
                                        <Input
                                            type="username"
                                            id="username"
                                            value={username}
                                            onChange={(event) => setUsername(event.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="password">Password:</Label>
                                        <Input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" className="bg-piwad-lightyellow-500" variant={"outline"}>Login</Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </> : <Loader2Icon className="animate-spin size-24 mx-auto mt-24"/>}
        </>
    )
}
