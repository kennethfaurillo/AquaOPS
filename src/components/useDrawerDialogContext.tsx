import axios from "axios"
import { Loader2Icon } from "lucide-react"
import { createContext, useContext, useMemo, useState } from "react"
import LogLineChart from "./LogLineChart"
import { Button } from "./ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer"
import { Input } from "./ui/input"
import { Label } from "./ui/label"


const DrawerDialogContext = createContext()

export function DrawerDialogProvider({ children }) {
    // Modal drawer for charts    
    const [chartDrawerOpen, setChartDrawerOpen] = useState(false)
    // Basic Logger Info with latest log
    const [logger, setLogger] = useState(null)
    // Complete logger info (limits, coords,...)
    const [loggerInfo, setLoggerInfo] = useState(null)
    // Modal dialog for logger config
    const [loggerDialogOpen, setLoggerDialogOpen] = useState(false)

    const fetchLoggerInfo = async (loggerId) => {
        const loggerResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/logger/${loggerId}`)
        return loggerResponse.data
    }

    const value = useMemo(() => ({
        chartDrawerOpen, setChartDrawerOpen, logger, setLogger, loggerInfo, setLoggerInfo, loggerDialogOpen, setLoggerDialogOpen, fetchLoggerInfo
    }), [chartDrawerOpen, logger, loggerInfo])

    return (
        <DrawerDialogContext.Provider value={value}>
            <Drawer open={chartDrawerOpen} onOpenChange={setChartDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle className="text-piwad-lightblue-500 text-3xl">{logger?.Name.replaceAll('-', ' ').split('_').slice(2) ?? "Unnamed"} LOGGER</DrawerTitle>
                        <DrawerDescription >
                            Logger ID: {logger?.LoggerId ?? "#########"} | Latest Log: {`${new Date(logger?.LogTime)}`}
                        </DrawerDescription>
                    </DrawerHeader>
                    {logger ? <LogLineChart logger={logger}/> : <Loader2Icon className="animate-spin self-center size-12 my-5" />}
                    <DrawerFooter className="flex-row justify-center">
                        {/* <Button>Submit</Button> */}
                        <Button className="bg-piwad-lightyellow-500 text-black" onClick={async () => {
                            if (logger) {
                                await fetchLoggerInfo(logger.LoggerId).then((response) => {
                                    console.log(JSON.stringify(response))
                                    setLoggerInfo(response[0])
                                    // setLoggerInfoLoading(false)
                                    setLoggerDialogOpen(true)
                                })
                            }
                        }}>Config</Button>
                        <DrawerClose asChild>
                            <Button>Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
            <Dialog open={loggerDialogOpen} onOpenChange={setLoggerDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-piwad-blue-500">Logger Information and Configuration</DialogTitle>
                        <DialogDescription>Only Admins can modify logger configuration and information</DialogDescription>
                        {/* <DialogDescription>{loggerInfo?.Name.replaceAll('-', ' ').split('_').slice(2)} | #{loggerInfo?.LoggerId} | {loggerInfo?.Latitude}°N, {loggerInfo?.Longitude}°E</DialogDescription> */}
                    </DialogHeader>
                    {loggerInfo ?
                        <div className="text-center">
                            <p className="text-lg text-left font-semibold">Logger Info</p>
                            <Label htmlFor="loggerName" >Logger Name</Label>
                            <Input id={"loggerName"} placeholder={loggerInfo.Name?.replaceAll('-', ' ').split('_').slice(2)} disabled />
                            <Label htmlFor="loggerName" >Logger ID</Label>
                            <Input id={"loggerID"} placeholder={loggerInfo.LoggerId} disabled />
                            <Label htmlFor="loggerName" >Logger Latitude</Label>
                            <Input id={"loggerLat"} placeholder={loggerInfo.Latitude} disabled />
                            <Label htmlFor="loggerName" >Logger Longitude</Label>
                            <Input id={"loggerLong"} placeholder={loggerInfo.Longitude} disabled />
                            <br />
                            <p className="text-lg text-left font-semibold">Logger Alarm Limits</p>
                            <Label htmlFor="loggerName" >Voltage Limit</Label>
                            <Input id={"loggerName"} placeholder={loggerInfo?.VoltageLimit?.replace(',', ' - ') ?? "N/A"} disabled />
                            <Label htmlFor="loggerName" >Flow Limit</Label>
                            <Input id={"loggerID"} placeholder={loggerInfo?.FlowLimit?.replace(',', ' - ') ?? "N/A"} disabled />
                            <Label htmlFor="loggerName" >Logger Latitude</Label>
                            <Input id={"loggerLat"} placeholder={loggerInfo?.PressureLimit?.replace(',', ' - ') ?? "N/A"} disabled />
                        </div> : <Loader2Icon className="animate-spin m-auto size-16" />}
                    <DialogClose asChild><Button>Close</Button></DialogClose>
                    <Button className="bg-green-500" onClick={() => setLoggerDialogOpen(false)}>Save</Button>
                </DialogContent>
            </Dialog>
            {children}
        </DrawerDialogContext.Provider>
    )
}

export const useDrawerDialogContext = () => useContext(DrawerDialogContext)