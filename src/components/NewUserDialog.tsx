import { useAuth } from "@/hooks/useAuth"
import axios from "axios"
import { CircleDollarSignIcon, CogIcon, UserCogIcon, UserIcon, UserPenIcon, UsersRoundIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Alert, AlertTitle } from "./ui/alert"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Separator } from "./ui/separator"

function NewUserDialog({ newUserDialogOpen, setNewUserDialogOpen }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [repeatPassword, setRepeatPassword] = useState('')
    const [department, setDepartment] = useState<'eod' | 'fcsd' | 'agsd'>('eod')
    const [userType, setUserType] = useState<'viewer' | 'user' | 'admin'>('viewer')
    const [alertDialog, setAlertDialog] = useState({
        title: '', description: '', open: false, error: true
    })
    const [errors, setErrors] = useState({
        passwordMismatch: false,
        test: false
    })
    const [allowCreateUser, setAllowCreateUser] = useState(true)
    const { user, token } = useAuth()
    useEffect(() => {
        if (newUserDialogOpen) {
            return
        }
        return (() => {
            setUsername('')
            setPassword('')
            setRepeatPassword('')
            setDepartment('eod')
            setUserType('viewer')
        }
        )
    }, [newUserDialogOpen])

    useEffect(() => {
        if (password == '' || repeatPassword == '') {
            setErrors({ ...errors, passwordMismatch: false })
            return
        }
        if (password != repeatPassword) {
            setErrors({ ...errors, passwordMismatch: true })
            return
        }
        setErrors({ ...errors, passwordMismatch: false })

    }, [password, repeatPassword])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password != repeatPassword) {
            setAlertDialog({
                title: 'Password mismatch!',
                description: 'Please re-enter your password',
                open: true,
                error: false
            })
            setPassword('')
            setRepeatPassword('')
            setTimeout(() => {
                setAlertDialog({ ...alertDialog, open: false })
            }, 1500)
            return
        }
        //check if username already exists
        const usernameExists = (await axios.post(`${import.meta.env.VITE_API}/auth/check-user`,
            { username: username }, { withCredentials: true })).data?.UserExists
        if (usernameExists) {
            setAlertDialog({
                title: 'Username Already in Use!',
                description: 'Please choose a different username',
                open: true,
                error: true
            })
            setUsername('')
            setPassword('')
            setRepeatPassword('')
            setTimeout(() => {
                setAlertDialog({ ...alertDialog, open: false })
            }, 2000)
            return
        }
        try {
            const createdUser = await axios.post(`${import.meta.env.VITE_API}/auth/create-user`,
                {
                    user: user,
                    token: token,
                    username: username,
                    password: password,
                    type: userType,
                },
                { withCredentials: true }
            )
            if (createdUser.data?.success) {
                console.log('User Created')
                setNewUserDialogOpen(false)
                setAlertDialog({
                    title: 'User Created!',
                    description: 'User has been created successfully',
                    open: true,
                    error: false
                })
            } else {
                setAlertDialog({
                    title: 'User Creation Failed!',
                    description: 'Please try again later',
                    open: true,
                    error: true
                })
            }
        } catch (error) {
            setAlertDialog({
                title: 'User Creation Failed!',
                description: 'Unauthorized user!',
                open: true,
                error: true
            })
        }
        setTimeout(() => {
            setAlertDialog({ ...alertDialog, open: false })
            setNewUserDialogOpen(false)
        }, 2000)
    }

    return (<>
        <Dialog open={newUserDialogOpen} onOpenChange={setNewUserDialogOpen} >
            <DialogContent aria-description="New User Information" aria-describedby="DialogTitle">
                <form onSubmit={handleSubmit}>
                    <DialogTitle className="text-piwad-blue-500">Create a New User</DialogTitle>
                    <DialogDescription />
                    <Card className="my-4">
                        <CardHeader className="py-4">
                            <CardTitle>User Information</CardTitle>
                            <Separator />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                <div className="col-span-2">
                                    <Label htmlFor="sourceName" className="text-slate-600">Username</Label>
                                    <Input id={"sourceName"} minLength={3} maxLength={20} value={username} onChange={(e) => setUsername(e.target.value)} required placeholder={'Enter username'} />
                                </div>
                                <div>
                                    <Label htmlFor="sourceLat" className="text-slate-600">Password</Label>
                                    <Input id={"password"} minLength={4} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder={"Enter password"} />
                                </div>
                                <div>
                                    <Label htmlFor="sourceLong" className="text-slate-600">Confirm Password</Label>
                                    <Input id={"repeatPassword"} type="password" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} required placeholder={"Confirm password"} />
                                </div>
                                {errors.passwordMismatch &&
                                    <Alert variant={"destructive"} className="col-span-2 text-center">
                                        <AlertTitle>
                                            Passwords do not match!
                                        </AlertTitle>
                                    </Alert>
                                }
                                <div>
                                    <Label className="text-slate-600">Department</Label><br />
                                    <Select value={department} onValueChange={(value) => setDepartment(value)} disabled>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="eod">
                                                <div className="flex items-center gap-x-1">
                                                    <CogIcon /> EOD
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="fcsd">
                                                <div className="flex items-center gap-x-1">
                                                    <CircleDollarSignIcon /> FCSD
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="agsd">
                                                <div className="flex items-center gap-x-1">
                                                    <UsersRoundIcon /> AGSD
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-slate-600">User Type</Label><br />
                                    <Select value={userType} onValueChange={(value) => setUserType(value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select User Type" />
                                        </SelectTrigger>
                                        <SelectContent >
                                            <SelectItem value="viewer">
                                                <div className="flex items-center gap-x-1">
                                                    <UserIcon /> Viewer
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="user" disabled>
                                                <div className="flex items-center gap-x-1">
                                                    <UserPenIcon /> User
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="admin" disabled>
                                                <div className="flex items-center gap-x-1">
                                                    <UserCogIcon /> Admin
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="grid grid-cols-2 gap-x-2 ">
                        <Button type="submit" className="bg-green-500" disabled={Object.values(errors).includes(true) || password == '' || repeatPassword == ''} >Create User</Button>
                        <DialogClose asChild><Button>Close</Button></DialogClose>
                    </div>
                </form>
            </DialogContent>
        </Dialog >
        <Dialog open={alertDialog.open} onOpenChange={() => setAlertDialog({ ...alertDialog, open: !alertDialog.open })}>
            <DialogContent className="text-center w-fit pl-6 pr-12">
                <DialogTitle className={alertDialog.error ? 'text-red-500' : 'text-green-500'}>
                    {alertDialog.title}
                </DialogTitle>
                <Separator />
                <DialogDescription>
                    {alertDialog.description}
                </DialogDescription>

            </DialogContent>
        </Dialog>
    </>
    )
}
export default NewUserDialog

