import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { capitalize } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import axios from "axios";


function Header(props) {
    const { user, token, logout } = useAuth()
    const [alertOpen, setAlertOpen] = useState(false)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [eventLogs, setEventLogs] = useState([])

    useEffect(() => {
        return () => {
            setEventLogs([])
        }
    }, [])

    const fetchEventLogs = async () => {
        const eventLogResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/auth/event_log?userId=${user.UserId}&token=${token}`)
        setEventLogs(eventLogResponse.data)
        return
    }

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

            <div className='flex gap-4 sticky top-0 max-w-dvw bg-piwad-lightblue-700/100 backdrop-blur drop-shadow-xl z-10 max-h-12 sm:max-h-20 overflow-hidden'>
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
                                <div className="text-slate-50 hidden text-3xl 2xl:block">{props.user.FirstName ?? "Firstname"} {capitalize(props.user.LastName) ?? "Lastname"}</div>
                                <Avatar className="m-2 mr-4 size-9 sm:size-14">
                                    <AvatarImage src="src/assets/shadcn.jpg" />
                                    <AvatarFallback>User</AvatarFallback>
                                </Avatar>
                            </SheetTrigger>
                            <SheetContent className="backdrop-blur-md rounded-l-xl ">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center text-2xl gap-2">
                                        <Avatar className="m-2 mr-2 size-14 sm:size-16">
                                            <AvatarImage src="src/assets/shadcn.jpg" />
                                            <AvatarFallback>User</AvatarFallback>
                                        </Avatar>
                                        <div className="grid grid-cols-2">
                                            <div className="col-span-2">{capitalize(user.Username)}</div>
                                            <div className="col-span-1 text-sm text-piwad-lightyellow-600/80 ">{user.Type ?? "UserType"}</div>
                                        </div>
                                    </SheetTitle>
                                    <Separator />
                                    <SheetDescription className="w-full">
                                        Hello, {capitalize(user.Username)}!
                                    </SheetDescription>
                                </SheetHeader>
                                <ScrollArea className="h-3/4 rounded-md border my-2 p-4 opacity-80 font-sans">
                                    <div className="text-xl mb-2 font-semibold text-black/90">Access Logs</div>
                                    {eventLogs.length ?
                                        eventLogs.map((log) => (
                                            <>
                                                <div className="flex justify-between">
                                                    <div className="text-[.66rem] text-slate-800/80 ml-0">{(new Date(log.Timestamp.replace('Z',''))).toLocaleString()} </div>
                                                    {/* <div className="text-[.66rem] text-slate-800/80 ml-0">{(new Date(log.Timestamp)).toLocaleString()} </div> */}
                                                    <div className="text-[.66rem] text-blue-700/80 mr-2">{log.IpAddress}</div>
                                                </div>
                                                <div key={log.LogId} className="text-sm">
                                                    {log.Message}
                                                </div>
                                                <Separator className="my-2" />
                                            </>
                                        )) : null}
                                    {/* Jokester began sneaking into the castle in the middle of the night and leaving
                                    jokes all over the place: under the king's pillow, in his soup, even in the
                                    royal toilet. The king was furious, but he couldn't seem to stop Jokester. And
                                    then, one day, the people of the kingdom discovered that the jokes left by
                                    Jokester were so funny that they couldn't help but laugh. And once they
                                    started laughing, they couldn't stop.Jokester began sneaking into the castle in the middle of the night and leaving
                                    jokes all over the place: under the king's pillow, in his soup, even in the
                                    royal toilet. The king was furious, but he couldn't seem to stop Jokester. And
                                    then, one day, the people of the kingdom discovered that the jokes left by
                                    Jokester were so funny that they couldn't help but laugh. And once they
                                    started laughing, they couldn't stop.Jokester began sneaking into the castle in the middle of the night and leaving
                                    jokes all over the place: under the king's pillow, in his soup, even in the
                                    royal toilet. The king was furious, but he couldn't seem to stop Jokester. And
                                    then, one day, the people of the kingdom discovered that the jokes left by
                                    Jokester were so funny that they couldn't help but laugh. And once they
                                    started laughing, they couldn't stop.Jokester began sneaking into the castle in the middle of the night and leaving
                                    jokes all over the place: under the king's pillow, in his soup, even in the
                                    royal toilet. The king was furious, but he couldn't seem to stop Jokester. And
                                    then, one day, the people of the kingdom discovered that the jokes left by
                                    Jokester were so funny that they couldn't help but laugh. And once they
                                    started laughing, they couldn't stop. */}
                                </ScrollArea>
                                <SheetFooter>
                                    <div className="absolute bottom-10 right-4 space-x-1.5 sm:space-x-2">
                                        <Button className="bg-piwad-lightyellow-500 text-black/90" onClick={() => {
                                            fetchEventLogs()
                                            // setSheetOpen(false)
                                        }}>Secret Button</Button>
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