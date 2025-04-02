import LoggerDialog from "@/components/LoggerDialog";
import { Separator } from "@/components/ui/separator";
import { dateDiff } from "@/lib/utils";
import axios from "axios";
import { Loader2Icon, SettingsIcon } from "lucide-react";
import { createContext, lazy, Suspense, useContext, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "../components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useSharedStateContext } from "./useSharedStateContext";
const ReportDialog = lazy(() => import('@/components/reportDialog'));
const LogLineChart = lazy(() => import('@/components/LogLineChart'));

const DrawerContext = createContext()

export function DrawerProvider({ children }) {
    // // Time interval for chart display
    const [chartTimeRange, setChartTimeRange] = useState("12")
    // Allowed dates for report generation
    const [allowedDates, setAllowedDates] = useState([])
    const { chartDrawerOpen, setChartDrawerOpen, loggerDialogOpen, setLoggerDialogOpen, reportDialogOpen, setReportDialogOpen,
        logger, setLogger, loggerInfo, setLoggerInfo } = useSharedStateContext()

    const fetchLoggerInfo = async (loggerId) => {
        const loggerResponse = await axios.get(`${import.meta.env.VITE_API}/api/logger/${loggerId}`, { withCredentials: true })
        return loggerResponse.data[0]
    }

    const fetchLoggerDates = async (loggerId, loggerType = "pressure") => {
        if (!["pressure", "flow"].includes(loggerType)) {
            throw ("Invalid Logger Type")
        }
        const logDatesResponse = await axios.get(`${import.meta.env.VITE_API}/api/${loggerType}_log_dates/${loggerId}`, { withCredentials: true })
        return logDatesResponse.data
    }


    const value = useMemo(() => ({
    }), [])

    const LoggerStatus = (props) => {
        const _logger = props.logger
        let timeUnit = 's'
        let lastUpdated = dateDiff(new Date(_logger?.LogTime.replace('Z', '')), 's')
        const loggerStatus = _logger.Disabled ? 'Disabled' : lastUpdated <= 21600 ? 'Active' : 'Inactive'
        const statusColor = {
            'Active': 'text-green-500',
            'Inactive': 'text-orange-500',
            'Disabled': 'text-slate-600',
        }
        if (lastUpdated > 86400) {
            timeUnit = 'd'
            lastUpdated /= 86400
        } else if (lastUpdated > 3600) {
            timeUnit = 'hr'
            lastUpdated /= 3600
        } else if (lastUpdated > 60) {
            timeUnit = 'min'
            lastUpdated /= 60
        }
        return (
            <div className="flex gap-x-1 text-sm text-muted-foreground">
                Logger ID: {_logger?.LoggerId ?? "#########"} <Separator orientation="vertical" className="h-5" /> Last Updated: {Math.round(lastUpdated)} <em>{timeUnit}</em> ago
                <Separator orientation="vertical" className="h-5" /> <div className="flex gap-x-1"> Status: <div className={'font-semibold ' + statusColor[loggerStatus]}> {loggerStatus} </div> </div>
            </div>
        )
    }

    return (
        // Logger Chart Drawer
        <DrawerContext.Provider value={value}>
            <Drawer open={chartDrawerOpen} onOpenChange={setChartDrawerOpen}>
                <DrawerContent className="w-full lg:w-[1024px] mx-auto">
                    <DrawerHeader className="relative">
                        <DrawerTitle className="text-piwad-lightblue-500 text-3xl inline-flex">
                            {logger?.Name.replaceAll('-', ' ').replaceAll('=', '-').split('_').slice(2) ?? "Unnamed"}
                            <Button variant="ghost" className="mx-1 px-1" onClick={async () => {
                                if (logger) {
                                    await fetchLoggerInfo(logger.LoggerId).then((response) => {
                                        setLoggerInfo(response)
                                        setLoggerDialogOpen(true)
                                    })
                                }
                            }}><SettingsIcon /></Button>
                        </DrawerTitle>
                        <DrawerDescription />
                        <LoggerStatus logger={logger} />
                    </DrawerHeader>
                    {logger ? <Suspense fallback={<Loader2Icon className="animate-spin self-center size-12 my-5" />}>
                        <LogLineChart logger={logger} timeRange={chartTimeRange} />
                    </Suspense> :
                        <Loader2Icon className="animate-spin self-center size-12 my-5" />}
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
            <Suspense>
                <ReportDialog reportDialogOpen={reportDialogOpen} setReportDialogOpen={setReportDialogOpen} loggerInfo={loggerInfo} allowedDates={allowedDates} />
            </Suspense>
            {children}
        </DrawerContext.Provider >
    )
}

export const useDrawerContext = () => useContext(DrawerContext)