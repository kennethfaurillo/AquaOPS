import { useAuth } from "@/hooks/useAuth"
import { useMapContext } from '@/hooks/useMapContext'
import { useWebSocket } from "@/hooks/useWebSocket"
import axios from "axios"
import { BellIcon, XIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import NotificationDropDownItem from "./NotificationDropDownItem"
import { Notification } from "./Types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { ScrollArea } from "./ui/scroll-area"

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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { triggerFetchNotification } = useWebSocket()
    const { isAuthenticated } = useAuth()
    const { focusPosition } = useMapContext();
    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.IsRead).length
    }, [notifications])

    const fetchNotification = useCallback(async (notificationId: string) => {
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
    }, [])

    const fetchNotifications = useCallback(async (includeRead?: boolean) => {
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
    }, [])

    const markNotifRead = useCallback(
        async (notification: Notification) => {
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

    const markAllNotifRead = useCallback(
        async (notificationIds: string[]) => {
            if (!notificationIds || notificationIds.length === 0) return;
            try {
                // Update all notifications as read in the backend
                await axios.patch(`${import.meta.env.VITE_API}/api/notifications/mark-read`, {
                    notificationIds: notificationIds
                }, {
                    withCredentials: true
                });
                setNotifications((prev: Notification[]) =>
                    prev.map((n) => ({ ...n, IsRead: true }))
                );
            } catch (err) {
                console.error("Failed to mark all notifications as read", err);
            }
        }, [])

    const handleNotificationClick = useCallback(async (notification: Notification) => {
        // Mark as read
        await markNotifRead(notification);

        // Extract coordinates from notification data if available
        try {
            if (notification.Data) {
                const data = JSON.parse(notification.Data);
                if (data.coordinates && data.coordinates.lat && data.coordinates.lon) {
                    focusPosition(data.coordinates.lat, data.coordinates.lon, 17); // Zoom level 17
                }
            }
        } catch (error) {
            console.error("Error parsing notification data:", error);
        }
    }, [markNotifRead, focusPosition]);

    const handleMarkAllReadClick = useCallback(async () => {
        const notificationIds: string[] = []
        notifications.forEach(notification => {
            // If the notification is not read, add to the list to mark as read
            if (!notification.IsRead) {
                notificationIds.push(notification.NotificationId)
            }
        })
        await markAllNotifRead(notificationIds)
    }, [notifications, markAllNotifRead])

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
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen} >
            <DropdownMenuTrigger onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
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
                    <button className="text-xs ml-8 text-blue-500 hover:text-blue-700 cursor-pointer"
                    onClick={handleMarkAllReadClick}>
                        Mark all as read
                    </button>
                    <button
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => setIsDropdownOpen(false)}
                    >
                        <XIcon className="ml-2 h-4 w-4" />
                    </button>
                </DropdownMenuLabel>
                <ScrollArea className={`h-64`}>
                    {notifications?.length ? notifications.map((notification: Notification) =>
                        <NotificationDropDownItem key={notification.NotificationId} notification={notification}
                            onClick={() => handleNotificationClick(notification)} />
                    ) :
                        <div className="text-center pb-2 text-sm text-gray-400"> No Notifications</div>
                    }
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}