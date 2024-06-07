import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BadgeCheckIcon, BadgeHelpIcon, BadgeMinusIcon } from 'lucide-react'
import './App.css'
import { CardDemo } from './components/CardDemo'
import LoggerTable from './components/LoggerTable'
import Map from './components/Map'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "./components/ui/sheet"
import { Separator } from './components/ui/separator'
import './index.css'
import { Button } from "./components/ui/button"

function App() {
  return (
    <>
      <div className='m-auto size-full bg-slate-100'>
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
            <Sheet>
              <SheetTrigger className="flex gap-1 text-slate-50 text-2xl items-center">
                <div className="text-slate-50 text-2xl lg:hidden">FL</div>
                <div className="text-slate-50 hidden text-3xl lg:block 2xl:hidden">Firstname</div>
                <div className="text-slate-50 hidden text-3xl 2xl:block">Firstname Lastname</div>
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
                      <div className="col-span-2">Firstname Lastname</div>
                      <div className="col-span-1 text-sm text-muted-foreground ">Account Type</div>
                    </div>
                  </SheetTitle>
                  <Separator />
                  <SheetDescription className="w-full">
                    Hello, 1, 2 3!
                  </SheetDescription>
                </SheetHeader>
                <SheetFooter>
                  <SheetClose asChild className="absolute bottom-10">
                    <Button>Close</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>


          </div>
        </div>
        {/* Grid Container */}
        <div className='grid grid-cols-12 gap-2 mt-2 mx-4 '>
          {/* Table Card */}
          <Card className='col-span-full xl:col-span-3 '>
            <CardHeader className='rounded-t-lg bg-piwad-lightblue'>
              <CardTitle className='text-slate-50'>
                Data Logger List
              </CardTitle>
              <CardDescription className='text-slate-200'>
                <>Latest Log: Logger #1 {Date()} </>
              </CardDescription>
            </CardHeader>

            <Separator />
            <CardContent>
              <LoggerTable></LoggerTable>
            </CardContent>
          </Card>
          {/* Map Card */}
          <Card className='col-span-full xl:col-span-9 z-0' >
            <CardHeader className='rounded-t-lg bg-piwad-lightblue'>
              <CardTitle className='text-slate-50'>
                Data Logger Map
              </CardTitle>
              {/* <CardDescription>

              </CardDescription> */}
            </CardHeader>
            <Separator className='mb-4' />
            <CardContent>
              <div className="flex items-center space-x-4 rounded-md border p-4 mb-2 bg-piwad-lightyellow">
                <div className="grid grid-cols-9 flex-1 space-y-1 ">
                  <div className="text-base font-medium leading-none col-span-full justify-center sm:justify-normal sm:col-span-2 flex items-center">
                    Logger Status:</div>
                  <div className="text-lg font-medium leading-none col-span-3 justify-center sm:justify-normal sm:col-span-2 flex items-center">
                    {5}&nbsp;<BadgeCheckIcon color='green' />&nbsp;Active</div>
                  <div className="text-lg font-medium leading-none col-span-3 justify-center sm:justify-normal sm:col-span-2 flex items-center">
                    {0}&nbsp;<BadgeMinusIcon color='red' />&nbsp;Disabled</div>
                  <div className="text-lg font-medium leading-none col-span-3 justify-center sm:justify-normal sm:col-span-2 flex items-center">
                    {2}&nbsp;<BadgeHelpIcon color='black' />&nbsp;Unknown</div>
                  {/* <p className="text-sm text-muted-foreground">
                    Send notifications to device.
                  </p> */}
                </div>
              </div>
              <div id='map'><Map /></div>
            </CardContent>
          </Card>
        </div>

        <div className='grid sm:grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2 mx-4'>
          <CardDemo className='mx-auto'></CardDemo>
          <CardDemo className='mx-auto'></CardDemo>
          <CardDemo className='mx-auto'></CardDemo>
        </div>
        <CardDemo className='mx-auto'></CardDemo>

      </div >
    </>
  )
}

export default App
