import { BellIcon, XIcon, AlertCircleIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Notification } from "./Types"
import axios from "axios"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { ScrollArea } from "./ui/scroll-area"
import NotificationDropDownItem from "./NotificationDropDownItem"

type SampleNotificationType = {
    sampleId: string
    value: number
    clType: 'cl' | 'clo2' | 'variable'
    samplingPointId: string
    gpsVerified: boolean
    isPass: boolean
    coordinates: {
        lat: number
        lon: number
    }
}

export function NotificationDropdown({ }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const { triggerFetchNotification } = useWebSocket()
    const { isAuthenticated } = useAuth()
    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.IsRead).length
    }, [notifications])

    const fetchNotifications = async (includeRead?: boolean,) => {
        try {
            const notificationsResponse = await axios.get(`${import.meta.env.VITE_API}/api/notifications`, {
                withCredentials: true,
                params: {
                    includeRead: includeRead ?? false,
                }
            })
            const data: Notification[] = notificationsResponse.data
            setNotifications(data)
        } catch (error) {
            console.error("Error fetching notifications:", error)
        }
    }

    const fetchNotification = async (notificationId: string) => {
        console.log("Fetching notification with ID:", notificationId)
        try {
            const notificationResponse = await axios.get<Notification>(`${import.meta.env.VITE_API}/api/notifications`, {
                withCredentials: true,
                params: {
                    notificationId: notificationId
                }
            })
            const data: Notification = notificationResponse.data
            const sampleData: SampleNotificationType = JSON.parse(notificationResponse.data.Data)
            console.log("Fetched notification:", data)
            setNotifications((prev) => {
                const exists = prev.some(n => n.NotificationId === data.NotificationId)
                return exists ? prev : [data, ...prev]
            })
            if (data.Priority == 1) {
                toast.error(notificationResponse.data.Message, {
                    description: `Value: ${sampleData.value ?? 'N/A'}`,
                    duration: 60_000,
                })
            } else if (data.Priority == 2) {
                toast.warning(notificationResponse.data.Message, {
                    description: `Value: ${sampleData.value ?? 'N/A'}`,
                    duration: 10000,
                })
            } else if (data.Priority == 3) {
                toast.success(notificationResponse.data.Message, {
                    description: `Value: ${sampleData.value ?? 'N/A'}`,
                    duration: 10000,
                })
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error)
        }
    }
    const setNotificationRead = useCallback(
        async (notification: Notification) => {
            console.log("Setting notification as read:", notification.NotificationId)
            if (notification.IsRead || (notification.NotificationId == null)) return;
            try {
                // Update notification as read in the backend
                await axios.patch(`${import.meta.env.VITE_API}/api/notification/${notification.NotificationId}/read`, {}, {
                    withCredentials: true
                });
                setNotifications((prev: Notification[]) =>
                    prev.map((n) =>
                        n.NotificationId === notification.NotificationId ? { ...n, IsRead: true } : n
                    )
                );
            } catch (err) {
                console.error("Failed to mark notification as read", err);
            }
        }, [])

    useEffect(() => {
        if (!isAuthenticated) {
            return
        }
        fetchNotifications()
    }, [])

    // set realtime subscriptions for notifications
    useEffect(() => {
        if (triggerFetchNotification == undefined) {
            return
        }
        fetchNotification(triggerFetchNotification)
    }, [triggerFetchNotification])

    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <div className="relative self-center mr-2 text-gray-500">
                    <BellIcon size={24} />
                    {unreadCount ?
                        <div className="absolute size-4 rounded-full -top-1 -right-1 bg-red-500 text-[8px] text-white items-center justify-center flex" >
                            {unreadCount > 99 ? '99' : unreadCount}
                        </div> : null}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-0 w-fit max-w-72">
                <DropdownMenuLabel className="flex items-center justify-center p-3">
                    <div className="relative self-center text-gray-500 mr-2">
                        <BellIcon size={20} />
                    </div>
                    <div>
                        Notifications
                    </div>
                    <button className="text-xs ml-8 text-blue-500 hover:text-blue-700 cursor-pointer">
                        Mark all as read
                    </button>
                    <button
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XIcon className="ml-2 h-4 w-4" />
                    </button>
                </DropdownMenuLabel>
                <ScrollArea className={`${notifications?.length ? 'h-72' : 'h-12'}`}>
                    {notifications?.length ? notifications.map((notification: Notification) =>
                        <NotificationDropDownItem key={notification.NotificationId} notification={notification} 
                        onClick={() => setNotificationRead(notification)} />
                    ) :
                        <div className="text-center pb-2 text-sm text-gray-400"> No Notifications</div>
                    }
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}