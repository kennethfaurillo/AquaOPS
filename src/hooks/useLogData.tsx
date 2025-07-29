import { Datalogger, LatestLog, LoggerLog } from '@/components/Types'
import axios from 'axios'
import { addMinutes } from 'date-fns'
import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react'


interface LogDataContextType {
    loggersData: Datalogger[],
    latestLogsData: LatestLog[],
    fetchData: () => void,
    loggersStatus: {
        Active: number,
        Delayed: number,
        Inactive: number,
        Disabled: number
    },
    loggersLatest: Map<string, LoggerLog>
}

const LogDataContext = createContext<LogDataContextType | undefined>(undefined)

// Provider component
export const LogDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [loggersData, setLoggersData] = useState<Datalogger[]>([]);
    const [latestLogsData, setLatestLogsData] = useState<LatestLog[]>([]);
    const { loggersStatus, loggersLatest }: { loggersStatus: { Active: number; Delayed: number; Inactive: number; Disabled: number }, loggersLatest: Map<string, LoggerLog> } = useMemo(() => {
        const loggersStatus = { Active: 0, Delayed: 0, Inactive: 0, Disabled: 0 }
        let loggersLatest = new Map()
        loggersData.map((logger: Datalogger) => {
            latestLogsData.map((log: LatestLog) => {
                if (logger.LoggerId == log.LoggerId) {
                    if (!logger.Enabled) {
                        loggersStatus.Disabled++
                        return
                    }
                    // Count as Active if last log within 30m, Delayed: 3h, Inactive: beyond 3h
                    const logTime = new Date(log.LogTime.slice(0, -1))
                    if (logTime > addMinutes(new Date(), -30)) {
                        loggersStatus.Active++
                    } else if (logTime > addMinutes(new Date(), -180)) {
                        loggersStatus.Delayed++
                    } else {
                        loggersStatus.Inactive++
                    }
                    loggersLatest.set(log.LoggerId, { ...logger, ...log })
                }
            })
        })
        return {
            loggersStatus,
            loggersLatest
        }
    }, [loggersData, latestLogsData])

    const fetchData = useCallback(async () => {
        const loggersDataResponse = await axios.get(`${import.meta.env.VITE_API}/api/logger`, { withCredentials: true })
        setLoggersData(loggersDataResponse.data)
        const latestLogsData = await axios.get(`${import.meta.env.VITE_API}/api/latest_log`, { withCredentials: true })
        setLatestLogsData(latestLogsData.data)
    }, [])

    const value = useMemo(() => ({
        loggersData,
        latestLogsData,
        fetchData,
        loggersStatus,
        loggersLatest
    }), [loggersData, latestLogsData, loggersStatus, loggersLatest])

    return <LogDataContext.Provider value={value}>{children}</LogDataContext.Provider>
};

export const useLogData = () => {
    const context = useContext(LogDataContext)
    if (context === undefined) {
        throw new Error('useLogData must be used within a LogDataProvider')
    }
    return context
};