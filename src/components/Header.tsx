import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";


function Header(props) {
    const { user, logout } = useAuth()
    const [alertOpen, setAlertOpen] = useState(false)
    const [sheetOpen, setSheetOpen] = useState(false)


    return (
        <>
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                        <Separator className="bg-piwad-blue-500" />
                        <AlertDialogDescription>
                        Are you sure you want to log out? You will need to log in again to access your account.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button variant={"destructive"} onClick={async () => { await logout() }}>Log Out</Button>
                        <AlertDialogCancel >Cancel</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className='flex gap-4 sticky top-0 max-w-dvw bg-piwad-lightblue-700/100 backdrop-blur drop-shadow-lg z-10 max-h-12 sm:max-h-20 overflow-hidden'>
                <div className="flex gap-4 p-1 items-center">
                    <a href="/">
                        <Avatar className='m-1 ml-2 size-9 sm:size-14'>
                            <AvatarImage src='src/assets/piwad_logo.png' />
                            <AvatarFallback className='text-xs'>PIWAD</AvatarFallback>
                        </Avatar>
                    </a>
                    <h2 className="scroll-m-20 hidden md:block text-3xl font-semibold tracking-tight first:mt-0 text-slate-100 ">PIWAD Datalogger Monitoring System</h2>
                    <h2 className="scroll-m-20 md:hidden -ml-2 text-2xl font-semibold tracking-tight first:mt-0 text-slate-100 ">PDMS</h2>
                </div>
                <div className="flex ml-auto">
                    {props.user ? <>
                        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                            <SheetTrigger className="flex gap-1 text-slate-50 text-2xl items-center">
                                <div className="text-slate-50 text-2xl lg:hidden">{props.user.FirstName.at(0).toUpperCase() ?? "F"}{props.user.LastName.at(0).toUpperCase() ?? "L"}</div>
                                <div className="text-slate-50 hidden text-3xl lg:block 2xl:hidden">{props.user.FirstName ?? "Firstname"} {props.user.LastName.at(0).toUpperCase() ?? "L"}.</div>
                                <div className="text-slate-50 hidden text-3xl 2xl:block">{props.user.FirstName ?? "Firstname"} {props.user.LastName ?? "Lastname"}</div>
                                <Avatar className="m-2 mr-4 size-9 sm:size-14">
                                    <AvatarImage src="src/assets/shadcn.jpg" />
                                    <AvatarFallback>User</AvatarFallback>
                                </Avatar>
                            </SheetTrigger>
                            <SheetContent className="backdrop-blur-md ">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center text-2xl gap-2">
                                        <Avatar className="m-2 mr-2 size-14 sm:size-16">
                                            <AvatarImage src="src/assets/shadcn.jpg" />
                                            <AvatarFallback>User</AvatarFallback>
                                        </Avatar>
                                        <div className="grid grid-cols-2">
                                            {/* <div className="col-span-2">{props.user.FirstName ?? "Firstname"} {props.user.LastName ?? "Lastname"}</div> */}
                                            <div className="col-span-2">{user.Username.toUpperCase()}</div>
                                            <div className="col-span-1 text-sm text-piwad-lightyellow-600/80 ">{user.Type ?? "UserType"}</div>
                                        </div>
                                    </SheetTitle>
                                    <Separator />
                                    <SheetDescription className="w-full">
                                        Hello, 1, 2 3!
                                    </SheetDescription>
                                </SheetHeader>
                                <SheetFooter>
                                    <div className="absolute bottom-10 right-4 space-x-1.5 sm:space-x-2">
                                        <Button className="bg-piwad-lightyellow-500 text-black" onClick={async() => logout()}>Secret Button</Button>
                                        <Button variant={"destructive"} onClick={() => {
                                            setAlertOpen(true)
                                            setSheetOpen(false)
                                            }}>Log Out</Button>
                                        <SheetClose asChild >
                                            <Button>Close</Button>
                                        </SheetClose>
                                    </div>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </> : <></>}

                </div>
            </div>
        </>
    )
}

export default Header