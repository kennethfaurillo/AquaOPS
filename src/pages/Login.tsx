import Header from "@/components/Header";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";

declare const __BUILD_VERSION__: string;
export const LoginPage = () => {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [alertOpen, setAlertOpen] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { login } = useAuth()

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault()
        const attemptLogin = await login(username, password)
        if (!attemptLogin) {
            setPassword('')
            setAlertOpen(true)
        }
    }

    return (
        <>
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
                <div className="grid grid-cols-12">
                    <div className="col-span-12 my-16 mx-12 justify-center ">
                        <div className="mx-auto w-fit border-4 shadow-xl border-piwad-blue-400 rounded-lg p-5 space-y-2">
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
                                    <div className="relative">
                                        <Label htmlFor="password">Password:</Label>
                                        <Input
                                            type={!showPassword ? "password" : ""}
                                            id="password"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}

                                        />
                                        {showPassword ?
                                            <EyeIcon className="absolute right-2 top-8 size-6 drop-shadow-md" onClick={() => setShowPassword(!showPassword)} /> :
                                            <EyeOffIcon className="absolute right-2 top-8 size-6 drop-shadow-md" onClick={() => setShowPassword(!showPassword)} />}
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <Button type="submit" className="bg-piwad-lightyellow-500" disabled={!username || !password} variant={"outline"}>Login</Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-2 right-4 text-xs text-slate-500">
                    {__BUILD_VERSION__}
                </div>
            </div>
        </>
    )
}
