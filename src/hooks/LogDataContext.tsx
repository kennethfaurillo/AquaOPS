import { Datalogger, LoggerLog } from '@/components/Types'
import React, { createContext, useContext } from 'react'

// Define the context type
export interface LogDataContextType {
    loggersData: Datalogger[],
    latestLogsData: LoggerLog[],
    fetchData: () => void
}

// Create the context
export const LogDataContext = createContext<LogDataContextType | undefined>(undefined)

// Create the hook to use the context
export const useLogData = () => {
    const context = useContext(LogDataContext)
    if (context === undefined) {
        throw new Error('useLogData must be used within a LogDataProvider')
    }
    return context
};
