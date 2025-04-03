import { Datalogger, LoggerLog } from '@/components/Types'
import axios from 'axios'
import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react'


interface LogDataContextType {
    loggersData: Datalogger[],
    latestLogsData: LoggerLog[],
    fetchData: () => void
}

const LogDataContext = createContext<LogDataContextType | undefined>(undefined)

// Provider component
export const LogDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [loggersData, setLoggersData] = useState<Datalogger[]>([]);
    const [latestLogsData, setLatestLogsData] = useState<LoggerLog[]>([]);

    const fetchData = useCallback(async () => {
        const loggersDataResponse = await axios.get(`${import.meta.env.VITE_API}/api/logger`, { withCredentials: true })
        setLoggersData(loggersDataResponse.data)
        const latestLogsData = await axios.get(`${import.meta.env.VITE_API}/api/latest_log`, { withCredentials: true })
        setLatestLogsData(latestLogsData.data)
    }, [])

    const value = useMemo(() => ({
        loggersData,
        latestLogsData,
        fetchData
    }), [loggersData, latestLogsData])


    return <LogDataContext.Provider value={value}>{children}</LogDataContext.Provider>
};


export const useLogData = () => {
    const context = useContext(LogDataContext)
    if (context === undefined) {
        throw new Error('useLogData must be used within a LogDataProvider')
    }
    return context
};