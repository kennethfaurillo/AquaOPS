import { useEffect, useMemo, useState } from "react"

const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine)

    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const value = useMemo(() => ({
        isOnline,
    }), [isOnline])

    return value
}

export default useOnlineStatus