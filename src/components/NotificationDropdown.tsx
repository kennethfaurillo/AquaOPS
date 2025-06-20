import { BellIcon, XIcon, AlertCircleIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { useEffect, useMemo, useState } from "react"
import { Notification } from "./Types"
import axios from "axios"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
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
    const [notifications, setNotifications] = useState<Notification[] | undefined>(undefined)
    const { triggerFetchNotification } = useWebSocket()
    const { isAuthenticated } = useAuth()
    const unreadCount = useMemo(() => {
        return notifications ? notifications.filter(n => !n.IsRead).length : 0
    }, [notifications])

    const fetchNotifications = async (includeRead?: boolean,) => {
        try {
            const notificationResponse = await axios.get(`${import.meta.env.VITE_API}/api/notifications`, {
                withCredentials: true,
                params: {
                    includeRead: includeRead ?? false, // Default to false if not provided
                    test: 'testdata'
                }
            })
            const data: Notification[] = notificationResponse.data
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
            setNotifications([data, ...(notifications || [])])
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

    useEffect(() => {
        if (!isAuthenticated) {
            return
        }
        fetchNotifications()
    }, [])

    // set realtime subscriptions for notifications
    useEffect(() => {
        if (Number.isNaN(triggerFetchNotification) || triggerFetchNotification == undefined) {
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
                    {/* Notification Card */}
                    {notifications?.length ? notifications.map((notification: Notification, index) => {
                        let iconColor
                        switch (notification.Type) {
                            case "sample-pass":
                                iconColor = 'text-green-500'
                                break
                            case 'sample-resample':
                                iconColor = 'text-yellow-500'
                                break
                            case 'sample-fail':
                                iconColor = 'text-red-500'
                                break
                            default:
                                iconColor = 'text-blue-500'
                                break
                        }
                        return (
                            <div className=" bg-blue-500" onClick={() => {
                                const markAsRead = async () => {
                                    if (notification.IsRead) return;
                                    try {
                                        setNotifications((prev: Notification[] | undefined) =>
                                            prev ? prev.map((n) =>
                                                n.NotificationId === notification.NotificationId ? { ...n, IsRead: true } : n
                                            ) : []
                                        );
                                    } catch (err) {
                                        console.error("Failed to mark notification as read", err);
                                    }
                                };
                                markAsRead();
                            }} key={notification.NotificationId} >
                                <DropdownMenuItem className={`rounded-none p-0`} >
                                    <div className={`flex items-center gap-2 ${iconColor} ${notification.IsRead ? 'bg-white' : 'bg-blue-50'} p-2 hover:bg-gray-200 flex-1`}>
                                        <AlertCircleIcon size={16} className="shrink-0" />
                                        <div className="flex-col mr-1">
                                            <div className="text-sm text-black font-semibold">{notification.Title}</div>
                                            <div className="text-xs text-gray-600">{notification.Message}</div>
                                            <div className="text-xs text-gray-400">{new Date(notification.Timestamp).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            </div>
                        )
                    }) :
                        <div className="text-center pb-2 text-sm text-gray-400"> No Notifications</div>
                    }
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}