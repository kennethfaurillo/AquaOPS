import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react"

type WebSocketContextType = {
  triggerFetch: Date
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [triggerFetch, setTriggerFetch] = useState(new Date())
  const toggleTrigger = useCallback(() => {
    setTriggerFetch(new Date())
  }, [])
  let ws: WebSocket
  let reconTimeout: NodeJS.Timeout

  useEffect(() => {
    function connectWs() {
      // check if ws is already open
      if (ws && ws.readyState === ws.OPEN) {
        return
      }
      ws = new WebSocket(`${import.meta.env.VITE_WS}`)
      // console.log("WebSocket Connecting...")
      ws.onmessage = (msgEvent) => {
        // console.log("WebSocket Message Received")
        try {
          const data = JSON.parse(msgEvent.data);
          if (data.type === 'watchdog' && data.event == 'update') {
            // console.log('update')
            toggleTrigger()
          }
        } catch (error) {
          // Non-JSON data, ignore
          console.log(msgEvent.data.toString());
        }
      };
      ws.onopen = () => {
        // console.log("WebSocket Connection Opened")
      }
      ws.onclose = () => {
        console.log("WebSocket disconnected, retrying...")
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


  return (
    <WebSocketContext.Provider value={{ triggerFetch }}>
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
