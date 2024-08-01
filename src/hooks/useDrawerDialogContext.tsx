import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn, generateReport, jsonToCSV } from "@/lib/utils"
import axios from "axios"
import { addDays, format } from 'date-fns'
import { CalendarIcon, Loader2Icon, SettingsIcon } from "lucide-react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { DateRange } from "react-day-picker"
import { toast } from "sonner"
import LogLineChart from "../components/LogLineChart"
import { Button } from "../components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "../components/ui/drawer"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { useAuth } from "./useAuth"

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
    // Modal dialog for report generation
    const [reportDialogOpen, setReportDialogOpen] = useState(false)
    // Time interval for chart display
    const [chartTimeRange, setChartTimeRange] = useState("12")
    // Allowed dates for report generation
    const [allowedDates, setAllowedDates] = useState([])
    // Link to download generated report
    const [link, setLink] = useState(null)
    // Loading state for report generation
    const [loadingReport, setLoadingReport] = useState(false)
    // Which logs are checked 
    const [reportChecked, setReportChecked] = useState<Object>({
        flow: false,
        pressure: false,
        voltage: false,
        totalizerPositive: false,
        totalizerNegative: false
    })
    const today = new Date((new Date()).toDateString())
    // Time interval for report generation
    // TODO: Set to latest log 
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(today, -1),
        to: today,
    })
    const { user, token } = useAuth()

    const fetchLoggerInfo = async (loggerId) => {
        const loggerResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/logger/${loggerId}`)
        return loggerResponse.data
    }

    const fetchLoggerDates = async (loggerId, loggerType = "pressure") => {
        if (!["pressure", "flow"].includes(loggerType)) {
            throw ("Invalid Logger Type")
        }
        const logDatesResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/${loggerType}_log_dates/${loggerId}`)
        const temp = logDatesResponse.data
        return logDatesResponse.data
    }

    // cleanup when closing
    useEffect(() => {
        if (reportDialogOpen) return
        setReportChecked({
            flow: false,
            pressure: false,
            voltage: false,
            totalizerPositive: false,
            totalizerNegative: false
        })
        setLink(null)
    }, [reportDialogOpen])

    const value = useMemo(() => ({
        chartDrawerOpen, setChartDrawerOpen, logger, setLogger, loggerInfo, setLoggerInfo, loggerDialogOpen, setLoggerDialogOpen, fetchLoggerInfo
    }), [chartDrawerOpen, loggerDialogOpen, logger, loggerInfo])

    return (
        // Logger Chart Drawer
        <DrawerDialogContext.Provider value={value}>
            <Drawer open={chartDrawerOpen} onOpenChange={setChartDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader className="relative">
                        <DrawerTitle className="text-piwad-lightblue-500 text-3xl inline-flex">
                            {logger?.Name.replaceAll('-', ' ').split('_').slice(2) ?? "Unnamed"} LOGGER
                            <Button variant="ghost" className="mx-1 px-1" onClick={async () => {
                                if (logger) {
                                    await fetchLoggerInfo(logger.LoggerId).then((response) => {
                                        console.log(JSON.stringify(response))
                                        setLoggerInfo(response[0])
                                        setLoggerDialogOpen(true)
                                    })
                                }
                            }}><SettingsIcon /></Button>
                        </DrawerTitle>
                        <DrawerDescription >
                            Logger ID: {logger?.LoggerId ?? "#########"} | Latest Log: {`${new Date(logger?.LogTime.replace('Z', ''))}`}
                        </DrawerDescription>
                    </DrawerHeader>
                    {logger ? <LogLineChart logger={logger} timeRange={chartTimeRange} /> : <Loader2Icon className="animate-spin self-center size-12 my-5" />}
                    <DrawerFooter className="flex-row justify-center">
                        <Select value={chartTimeRange} onValueChange={(value) => setChartTimeRange(value)} >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Time Range" />
                            </SelectTrigger>
                            <SelectContent className="h-48">
                                <SelectItem value="3">Last 3 Hours</SelectItem>
                                <SelectItem value="6">Last 6 Hours</SelectItem>
                                <SelectItem value="12">Last 12 Hours</SelectItem>
                                <SelectItem value="24">Last Day</SelectItem>
                                <SelectItem value={`${24 * 7}`}>Last Week</SelectItem>
                                <SelectItem value={`${24 * 30}`}>Last Month</SelectItem>
                                <SelectItem value={`${24 * 90}`} disabled>Last 3 Months</SelectItem>
                                <SelectItem value={`${24 * 180}`} disabled>Last 6 Months</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button className="bg-piwad-lightyellow-500 text-black" onClick={async () => {
                            // setReportDialogOpen(true)
                            await fetchLoggerInfo(logger.LoggerId).then((response) => {
                                console.log(JSON.stringify(response))
                                setLoggerInfo(response[0])
                                setReportDialogOpen(true)
                            })
                            let latestLogs = []
                            const defaultDaysRange = 3
                            if (logger.Name.toLowerCase().includes("flow")) {
                                await fetchLoggerDates(logger.LoggerId, "flow").then((response) => {
                                    setAllowedDates(response)
                                    latestLogs = response.slice(-defaultDaysRange)
                                })
                            } else if (logger.Name.toLowerCase().includes("pressure")) {
                                await fetchLoggerDates(logger.LoggerId, "pressure").then((response) => {
                                    setAllowedDates(response)
                                    latestLogs = response.slice(-defaultDaysRange)
                                })
                            }
                            setDate({
                                from: new Date(latestLogs.at(0)),
                                to: new Date(latestLogs.at(-1)),
                            })
                        }}>Generate Report</Button>
                        <DrawerClose asChild>
                            <Button>Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
            {/* Logger Info and Config Dialog */}
            <Dialog open={loggerDialogOpen} onOpenChange={setLoggerDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-piwad-blue-500">Logger Information and Configuration</DialogTitle>
                        <DialogDescription>Only Admins can modify logger configuration and information</DialogDescription>
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
                            <Label htmlFor="loggerName" >Pressure Limit</Label>
                            <Input id={"loggerLat"} placeholder={loggerInfo?.PressureLimit?.replace(',', ' - ') ?? "N/A"} disabled />
                        </div> : <Loader2Icon className="animate-spin m-auto size-16" />}
                    <DialogClose asChild><Button>Close</Button></DialogClose>
                    <Button className="bg-green-500" onClick={() => setLoggerDialogOpen(false)} disabled>Save</Button>
                </DialogContent>
            </Dialog>
            {/* Report Generation Dialog */}
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-piwad-blue-500">Datalog Report Generation</DialogTitle>
                        {loggerInfo ? <DialogDescription>For {loggerInfo.Name?.replaceAll('-', ' ').split('_').slice(2)} Logger</DialogDescription> : null}
                    </DialogHeader>
                    {loggerInfo ?
                        <div className="text-center">
                            <p className="text-lg text-left font-semibold">Report Type</p>
                            {/* Checkbox Group */}
                            <TooltipProvider>
                                <div className="mt-1">
                                    {loggerInfo.Name.toLowerCase().includes("flow") ?
                                        <span className="space-x-1 mx-4">
                                            <Checkbox id="cbFlow" checked={reportChecked.flow} onCheckedChange={isChecked => {
                                                console.log("flow", isChecked)
                                                setReportChecked({
                                                    ...reportChecked,
                                                    flow: isChecked
                                                })
                                                if (!reportChecked.flow) {
                                                    setReportChecked({
                                                        ...reportChecked,
                                                        flow: isChecked,
                                                        totalizerPositive: false,
                                                        totalizerNegative: false,
                                                    })
                                                }
                                            }} />
                                            <Label htmlFor="cbFlow">Flow</Label>
                                        </span> :
                                        <Tooltip delayDuration={250}>
                                            <TooltipTrigger ><Checkbox className="mx-1" disabled /><Label autoFocus={false}>Flow</Label></TooltipTrigger>
                                            <TooltipContent>No log data</TooltipContent>
                                        </Tooltip>
                                    }
                                    {loggerInfo.Name.toLowerCase().includes("pressure") ?
                                        <span className="space-x-1 mx-4">
                                            <Checkbox id="cbPressure" checked={reportChecked.pressure} onCheckedChange={isChecked => {
                                                console.log("pressure", isChecked)
                                                setReportChecked({
                                                    ...reportChecked,
                                                    pressure: isChecked
                                                })
                                            }} />
                                            <Label htmlFor="cbPressure">Pressure</Label>
                                        </span> :
                                        <Tooltip delayDuration={250}>
                                            <TooltipTrigger><Checkbox className="mx-1" disabled /><Label>Pressure</Label></TooltipTrigger>
                                            <TooltipContent>No log data</TooltipContent>
                                        </Tooltip>
                                    }
                                    <span className="space-x-1 mx-4">
                                        <Checkbox id="cbVoltage" checked={reportChecked.voltage} onCheckedChange={isChecked => {
                                            console.log("voltage", isChecked)
                                            setReportChecked({
                                                ...reportChecked,
                                                voltage: isChecked
                                            })
                                        }} />
                                        <Label htmlFor="cbVoltage">Voltage</Label>
                                    </span>
                                </div>
                                {reportChecked.flow ?
                                    <>
                                        <span className="space-x-1 mx-4">
                                            <Checkbox id="cbTotalizerPositive" checked={reportChecked.totalizerPositive} onCheckedChange={isChecked => {
                                                console.log("totalizerPositive", isChecked)
                                                setReportChecked({
                                                    ...reportChecked,
                                                    totalizerPositive: isChecked
                                                })
                                            }} />
                                            <Label htmlFor="cbTotalizerPositive">Totalizer Positive</Label>
                                        </span>
                                        <span className="space-x-1 mx-4">
                                            <Checkbox id="cbTotalizerNegative" checked={reportChecked.totalizerNegative} onCheckedChange={isChecked => {
                                                console.log("totalizerNegative", isChecked)
                                                setReportChecked({
                                                    ...reportChecked,
                                                    totalizerNegative: isChecked
                                                })
                                            }} />
                                            <Label htmlFor="cbTotalizerNegative">Totalizer Negative</Label>
                                        </span>
                                    </> : null
                                }
                                <div className="mt-1"></div>
                            </TooltipProvider>
                            <p className="text-lg text-left font-semibold">Report Time Range</p>
                            {/* Time Range Group */}
                            <div className="flex gap-x-2 mt-1">
                                <Popover modal>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="date"
                                            variant={"outline"}
                                            className={cn(
                                                "w-[300px] justify-start text-left font-normal",
                                                !date && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date?.from ? (
                                                date.to ? (
                                                    <>
                                                        {date.from.toString() == date.to.toString() ?
                                                            <>
                                                                {format(date.from, "LLL dd, y")}
                                                            </> :
                                                            <>
                                                                {format(date.from, "LLL dd, y")} -{" "}
                                                                {format(date.to, "LLL dd, y")}
                                                            </>
                                                        }
                                                    </>
                                                ) : format(date.from, "LLL dd, y")
                                            ) : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        {allowedDates.length ?
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={date?.from}
                                                selected={date}
                                                onSelect={setDate}
                                                numberOfMonths={1}
                                                disabled={(calDate) => {
                                                    return !allowedDates.includes(calDate.toDateString())
                                                }}
                                            />
                                            : null}
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div> : <Loader2Icon className="animate-spin m-auto size-16" />}
                    <div className="grid grid-cols-2 gap-x-2">
                        {[reportChecked.flow, reportChecked.pressure, reportChecked.voltage].includes(true) && (date?.from || date?.to) && !loadingReport ?
                            <Button className="bg-piwad-lightyellow-500 text-black" onClick={async () => {
                                console.log(reportChecked)
                                console.log(loggerInfo && (date?.from || date?.to))
                                setLoadingReport(true)
                                setLink(null)
                                toast.loading("Generating Report")
                                try {
                                    const reportJson = await generateReport(loggerInfo, reportChecked, date, user)
                                    // Header containing logger info, no need to send column headers
                                    const header = `${loggerInfo.Name} ${loggerInfo.LoggerId} ${loggerInfo.Model} ${loggerInfo.Latitude},${loggerInfo.Longitude}`
                                    const _link = jsonToCSV(reportJson, header)
                                    setTimeout(() => {
                                        setLoadingReport(false)
                                        toast.dismiss()
                                        toast.success("Report Generated!")
                                        setLink(_link)
                                    }, 750)
                                } catch (error) {
                                    console.log(error)
                                    setLoadingReport(false)
                                    toast.dismiss()
                                    toast.error(error)
                                }
                            }}>Generate Report</Button> :
                            (loadingReport ?
                                <Button className="bg-piwad-lightyellow-500 text-black" disabled><Loader2Icon className="animate-spin size-4 mr-2" />Generating Report</Button> :
                                <Button className="bg-piwad-lightyellow-500 text-black" disabled>Generate Report</Button>)
                        }
                        {link ? <Button className="bg-green-500" onClick={() => {
                            link.click()
                            setTimeout(() => setLink(null), 500)
                        }}>Download Report</Button> : <Button className="bg-green-500" disabled>Download Report</Button>}
                    </div>
                    <DialogClose asChild><Button>Close</Button></DialogClose>
                </DialogContent>
            </Dialog>
            {children}
        </DrawerDialogContext.Provider>
    )
}

export const useDrawerDialogContext = () => useContext(DrawerDialogContext)