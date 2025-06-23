import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type WebSocketContextType = {
  triggerFetchLogData: Date;
  triggerFetchNotification: string | undefined;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)
let isInit = false

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [triggerFetchLogData, setTriggerFetchLogData] = useState(new Date())
  const [triggerFetchNotification, setTriggerFetchNotification] = useState(undefined)
  let ws: WebSocket
  let reconTimeout: NodeJS.Timeout

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
    }
  }, [])

  const value = useMemo(() => ({
    triggerFetchLogData,
    triggerFetchNotification,
  }), [triggerFetchLogData, triggerFetchNotification])

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
