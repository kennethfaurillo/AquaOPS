import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { AlertDialog } from "@/components/ui/alert-dialog";

export const LoginPage = () => {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const { login } = useAuth()
    const handleLogin = async (event) => {
        event.preventDefault()
        const authResponse = await axios.post(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/auth/login/`,{
            username: username,
            password: password
        })
        if (authResponse.data == "true"){
            await login({ username })
        } else {
            console.log(authResponse.data)
            alert("Invalid username or password!")
        }
    }

    return (
        <>
            <Header />
            <div className="w-full h-screen">
                <div className="grid grid-cols-12 border-red-200">
                    <div className="col-span-12 py-8 justify-center">
                        <div className="mx-auto w-fit border-4 border-slate-500 rounded-lg p-5 space-y-2">
                            <div className="text-center">
                                <h1 className="text-3xl font-bold">Login</h1>
                                <p className="text-balance text-muted-foreground">Enter your account details below to login to your account</p>
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
                                    <Button type="submit" className="bg-piwad-lightyellow" variant={"outline"}>Login</Button>
                                </form> 
                            </div>
                        </div>
                    </div>
                </div>


            </div>
            {/* 
        <form onSubmit={handleLogin}>
            <div>
                <label htmlFor="username">Username:</label>
                <input
                    type="username"
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                />
            </div>
            <div>
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
            </div>
            <button type="submit">Login</button>
        </form> */}
        </>
    )
}
