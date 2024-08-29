import LoggerDialog from "@/components/loggerDialog"
import ReportDialog from "@/components/reportDialog"
import axios from "axios"
import { addDays } from 'date-fns'
import { Loader2Icon, SettingsIcon } from "lucide-react"
import { createContext, useContext, useMemo, useState } from "react"
import { DateRange } from "react-day-picker"
import LogLineChart from "../components/LogLineChart"
import { Button } from "../components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "../components/ui/drawer"
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
    // Modal dialog state for logger config
    const [loggerDialogOpen, setLoggerDialogOpen] = useState(false)
    // Modal dialog state for report generation
    const [reportDialogOpen, setReportDialogOpen] = useState(false)
    // Time interval for chart display
    const [chartTimeRange, setChartTimeRange] = useState("12")
    // Allowed dates for report generation
    const [allowedDates, setAllowedDates] = useState([])
    const today = new Date((new Date()).toDateString())
    // Time interval for report generation
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(today, -1),
        to: today,
    })
    const { user, token } = useAuth()

    const fetchLoggerInfo = async (loggerId) => {
        const loggerResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/logger/${loggerId}`)
        return loggerResponse.data[0]
    }

    const fetchLoggerDates = async (loggerId, loggerType = "pressure") => {
        if (!["pressure", "flow"].includes(loggerType)) {
            throw ("Invalid Logger Type")
        }
        const logDatesResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/${loggerType}_log_dates/${loggerId}`)
        const temp = logDatesResponse.data
        return logDatesResponse.data
    }


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
                            {logger?.Name.replaceAll('-', ' ').replaceAll('=', '-').split('_').slice(2) ?? "Unnamed"} LOGGER
                            <Button variant="ghost" className="mx-1 px-1" onClick={async () => {
                                if (logger) {
                                    await fetchLoggerInfo(logger.LoggerId).then((response) => {
                                        setLoggerInfo(response)
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
                                <SelectItem value="6">Last 6 Hours</SelectItem>
                                <SelectItem value="12">Last 12 Hours</SelectItem>
                                <SelectItem value="24">Last Day</SelectItem>
                                <SelectItem value="72">Last 3 Days</SelectItem>
                                <SelectItem value={`${24 * 7}`}>Last Week</SelectItem>
                                <SelectItem value={`${24 * 30}`}>Last Month</SelectItem>
                                <SelectItem value={`${24 * 90}`}>Last 3 Months</SelectItem>
                                <SelectItem value={`${24 * 180}`} disabled>Last 6 Months</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button className="bg-piwad-lightyellow-500 text-black" onClick={async () => {
                            const tempLoggerInfo = await fetchLoggerInfo(logger.LoggerId)
                            setLoggerInfo(tempLoggerInfo)
                            setReportDialogOpen(true)
                            let latestLogs = []
                            const defaultDaysRange = 3
                            if (tempLoggerInfo.Type.includes("flow")) {
                                await fetchLoggerDates(logger.LoggerId, "flow").then((response) => {
                                    setAllowedDates(response)
                                    latestLogs = response.slice(-defaultDaysRange)
                                })
                            } else if (tempLoggerInfo.Type.includes("pressure")) {
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
            <LoggerDialog loggerDialogOpen={loggerDialogOpen} setLoggerDialogOpen={setLoggerDialogOpen} loggerInfo={loggerInfo} />
            {/* Report Generation Dialog */}
            <ReportDialog reportDialogOpen={reportDialogOpen} setReportDialogOpen={setReportDialogOpen} loggerInfo={loggerInfo} allowedDates={allowedDates} />
            {children}
        </DrawerDialogContext.Provider >
    )
}

export const useDrawerDialogContext = () => useContext(DrawerDialogContext)