import { Datalogger, LoggerLog } from '@/components/Types'
import axios from 'axios'
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// Define the context value type
interface LogDataContextType {
    loggersData: Datalogger[],
    latestLogsData: LoggerLog[],
    fetchData: () => void
}
// Create the context with a default undefined value
const LogDataContext = createContext<LogDataContextType | undefined>(undefined)

// Provider component
export const LogDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [loggersData, setLoggersData] = useState<Datalogger[]>([]);
    const [latestLogsData, setLatestLogsData] = useState<LoggerLog[]>([]);

    const fetchData = useCallback(async () => {
        const loggersDataResponse = await axios.get(`${import.meta.env.VITE_API}/api/logger`)
        setLoggersData(loggersDataResponse.data)
        const latestLogsData = await axios.get(`${import.meta.env.VITE_API}/api/latest_log`)
        setLatestLogsData(latestLogsData.data)
    }, [])

    const value = useMemo(() => ({
        loggersData,
        latestLogsData,
        fetchData
    }), [loggersData, latestLogsData])


    return <LogDataContext.Provider value={value}>{children}</LogDataContext.Provider>
};

// Custom hook for using this context
export const useLogData = () => {
    const context = useContext(LogDataContext)
    if (context === undefined) {
        throw new Error('useLogData must be used within a LogDataProvider')
    }
    return context
};