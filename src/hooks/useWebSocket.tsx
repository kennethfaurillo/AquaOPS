import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type AlarmStatusTrigger = {
  type: 'alarm_status';
  event: 'update';
  alarmId?: string;
  logTime?: string;
}

type WebSocketContextType = {
  triggerFetchLogData: Date;
  triggerFetchNotification: string | undefined;
  triggerFetchAlarmStatus: AlarmStatusTrigger | undefined;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)
let isInit = false
const ALARM_STATUS_DEBOUNCE_MS = 1200

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [triggerFetchLogData, setTriggerFetchLogData] = useState(new Date())
  const [triggerFetchNotification, setTriggerFetchNotification] = useState<string | undefined>(undefined)
  const [triggerFetchAlarmStatus, setTriggerFetchAlarmStatus] = useState<AlarmStatusTrigger | undefined>(undefined)
  let ws: WebSocket
  let reconTimeout: ReturnType<typeof setTimeout>
  let alarmStatusDebounceTimeout: ReturnType<typeof setTimeout> | undefined

  useEffect(() => {
    if (isInit) return // WebSocket already initialized, skip reconnection
    isInit = true
    function connectWs() {
      // check if ws is already open
      if (ws && ws.readyState === ws.OPEN) {
        return
      }
      ws = new WebSocket(`${import.meta.env.VITE_WS}`)
      ws.onmessage = (msgEvent) => {
        // Types of messages:
        // watchdog updates: {"type":"watchdog","event":"update","filename":"LOGGER_ID_TIMESTAMP.txt"}
        // notifications: {"type":"notification","event":"new","notificationId":"NOTIFICATION_ID" 
        // alarm status: {"type":"alarm_status","event":"update","alarmId":"ALARM_ID","logTime":"2024-06-01T12:00:00Z"}
        // TODO: add "read" and "delete" events
        try {
          const data = JSON.parse(msgEvent.data);
          if (data.type === 'watchdog' && data.event == 'update') {
            setTriggerFetchLogData(data.filename ?? new Date())
          }
          if (data.type === 'notification' && data.event === 'new') {
            // console.log("New notification received:", data)
            setTriggerFetchNotification(data.notificationId)
          }
          if (data.type === 'alarm_status' && data.event === 'update') {
            if (alarmStatusDebounceTimeout) {
              clearTimeout(alarmStatusDebounceTimeout)
            }
            alarmStatusDebounceTimeout = setTimeout(() => {
              setTriggerFetchAlarmStatus({
                type: 'alarm_status',
                event: 'update',
                alarmId: data.alarmId,
                logTime: data.logTime,
              })
            }, ALARM_STATUS_DEBOUNCE_MS)
          }
        } catch (error) {
          // Non-JSON data, ignore
          console.error("WebSocket message parsing error:", error)
        }
      };
      ws.onclose = () => {
        // console.log("WebSocket disconnected, retrying...")
        reconTimeout = setTimeout(() => connectWs(), 5000)
      }
      ws.onerror = (error) => {
        console.error("WebSocket Error:", error)
        ws.close()
      }
    }

    connectWs()

    return () => {
      if (ws && ws.readyState === ws.OPEN) {
        ws.close()
      }
      if (reconTimeout) {
        clearTimeout(reconTimeout)
      }
      if (alarmStatusDebounceTimeout) {
        clearTimeout(alarmStatusDebounceTimeout)
      }
    }
  }, [])

  const value = useMemo(() => ({
    triggerFetchLogData,
    triggerFetchNotification,
    triggerFetchAlarmStatus,
  }), [triggerFetchLogData, triggerFetchNotification, triggerFetchAlarmStatus])

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider")
  }
  return context
}
