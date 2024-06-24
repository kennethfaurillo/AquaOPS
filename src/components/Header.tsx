import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";


function Header(props) {
    const { logout } = useAuth()

    return (
        <>
            <div className='flex gap-4 sticky top-0 max-w-dvw bg-piwad-lightblue/100 backdrop-blur drop-shadow-lg z-10 max-h-12 sm:max-h-20 overflow-hidden'>
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
                        <Sheet>
                            <SheetTrigger className="flex gap-1 text-slate-50 text-2xl items-center">
                                <div className="text-slate-50 text-2xl lg:hidden">{props.user.FirstName.at(0).toUpperCase() ?? "F"}{props.user.LastName.at(0).toUpperCase() ?? "L"}</div>
                                <div className="text-slate-50 hidden text-3xl lg:block 2xl:hidden">{props.user.FirstName ?? "Firstname"}</div>
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
                                            <div className="col-span-2">{props.user.FirstName ?? "Firstname"} {props.user.LastName ?? "Lastname"}</div>
                                            <div className="col-span-1 text-sm text-muted-foreground ">{props.user.UserType ?? "UserType"}</div>
                                        </div>
                                    </SheetTitle>
                                    <Separator />
                                    <SheetDescription className="w-full">
                                        Hello, 1, 2 3!
                                    </SheetDescription>
                                </SheetHeader>
                                <SheetFooter>
                                    <div className="absolute bottom-10 space-x-3">
                                    <Button onClick={async() => {await logout()}}>Log Out</Button>
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