import axios from "axios"
import { createContext, useContext, useMemo, useState } from "react"

const SharedStateContext = createContext()

export function SharedStateProvider({ children }) {
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
    // State to trigger forced updates
    const [mapRefreshToggle, setMapRefreshToggle] = useState(true)
    const [loggerTableRefreshToggle, setLoggerTableRefreshToggle] = useState(true)

    const fetchLoggerInfo = async (loggerId) => {
        try{
            const loggerResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/logger/${loggerId}`)
            return loggerResponse.data[0]
        } catch(e){
            console.log(e)
        }
    }

    const value = useMemo(() => ({
        chartDrawerOpen, setChartDrawerOpen, loggerDialogOpen, setLoggerDialogOpen, reportDialogOpen, setReportDialogOpen,
        logger, setLogger, loggerInfo, setLoggerInfo, fetchLoggerInfo, mapRefreshToggle, setMapRefreshToggle, loggerTableRefreshToggle, setLoggerTableRefreshToggle

    }), [chartDrawerOpen, loggerDialogOpen, reportDialogOpen, logger, loggerInfo, mapRefreshToggle, loggerTableRefreshToggle])

    return (
        <SharedStateContext.Provider value={value}>
            {children}
        </SharedStateContext.Provider>
    )
}

export const useSharedStateContext = () => useContext(SharedStateContext)