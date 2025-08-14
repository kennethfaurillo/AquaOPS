import { Datalogger, LoggerLog } from "@/components/Types"
import axios from "axios"
import { createContext, useContext, useMemo, useState } from "react"

type SharedStateContextType = {
    chartDrawerOpen: boolean
    setChartDrawerOpen: (open: boolean) => void
    loggerDialogOpen: boolean
    setLoggerDialogOpen: (open: boolean) => void
    reportDialogOpen: boolean
    setReportDialogOpen: (open: boolean) => void
    logger: LoggerLog
    setLogger: (logger: LoggerLog) => void
    loggerInfo: Datalogger
    setLoggerInfo: (loggerInfo: Datalogger) => void
    fetchLoggerInfo: (loggerId: string) => Promise<Datalogger>
}

const SharedStateContext = createContext<SharedStateContextType | null>(null)

export function SharedStateProvider({ children }: { children: React.ReactNode }) {
    // Modal drawer for charts    
    const [chartDrawerOpen, setChartDrawerOpen] = useState(false)
    // Modal dialog state for logger config
    const [loggerDialogOpen, setLoggerDialogOpen] = useState(false)
    // Modal dialog state for report generation
    const [reportDialogOpen, setReportDialogOpen] = useState(false)
    // Basic Logger Info with latest log
    const [logger, setLogger] = useState(null)
    // Complete logger info (limits, coords,...)
    const [loggerInfo, setLoggerInfo] = useState(null)

    const fetchLoggerInfo = async (loggerId: string) => {
        try {
            const loggerResponse = await axios.get(`${import.meta.env.VITE_API}/api/logger/${loggerId}`, { withCredentials: true })
            return loggerResponse.data[0]
        } catch (e) {
            console.log(e)
        }
    }

    const value = useMemo(() => ({
        chartDrawerOpen, setChartDrawerOpen, loggerDialogOpen, setLoggerDialogOpen, reportDialogOpen, setReportDialogOpen,
        logger, setLogger, loggerInfo, setLoggerInfo, fetchLoggerInfo, 

    }), [chartDrawerOpen, loggerDialogOpen, reportDialogOpen, logger, loggerInfo, ])

    return (
        <SharedStateContext.Provider value={value}>
            {children}
        </SharedStateContext.Provider>
    )
}

export const useSharedStateContext = () => {
    const context = useContext(SharedStateContext)
    if (!context) {
        throw new Error('useSharedStateContext must be used within a SharedStateProvider')
    }
    return context
}