import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, InfoIcon } from 'lucide-react'
import { Notification } from './Types'
import React from 'react'

interface NotificationDropDownProps {
    notification: Notification,
    onClick?: () => Promise<void>
}
const NotificationDropDownItem = React.memo(({ notification, onClick }: NotificationDropDownProps) => {
    let iconColor, Icon
    switch (notification.Type) {
        case "sample-pass":
            iconColor = 'text-green-500'
            Icon = CheckCircleIcon
            break
        case 'sample-resample':
            iconColor = 'text-yellow-500'
            Icon = AlertTriangleIcon
            break
        case 'sample-fail':
            iconColor = 'text-red-500'
            Icon = AlertCircleIcon
            break
        default:
            iconColor = 'text-blue-500'
            Icon = InfoIcon
            break
    }
    return (
        <div
            onClick={onClick}
            role="button"   
            tabIndex={0}
        >
            <div className={`cursor-pointer flex items-center gap-2 ${iconColor} ${notification.IsRead ? 'bg-white' : 'bg-blue-50'} select-none p-2 hover:bg-gray-200 active:bg-gray-100 flex-1`}>
                <Icon size={16} className="shrink-0" />
                <div className="flex-col mr-1">
                    <div className="text-sm text-black font-semibold">{notification.Title}</div>
                    <div className="text-xs text-gray-600">{notification.Message}</div>
                    <div className="text-xs text-gray-400">{new Date(notification.Timestamp).toLocaleString()}</div>
                </div>
            </div>
        </div>
    )
}, (prevProps, nextProps) => {
    // Only re-render if these props change
    return prevProps.notification.IsRead === nextProps.notification.IsRead &&
           prevProps.notification.NotificationId === nextProps.notification.NotificationId;
})

export default NotificationDropDownItem 