import { ListFilterIcon, Loader2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { useState } from "react"
import { EventLog } from "./Types"

function EventLogsDialog({ eventlogsDialogOpen, setEventlogsDialogOpen, eventLogs }) {
    const eventTypeColorMap = {
        Authentication: 'text-blue-500/80',
        EditProfile: 'text-green-500/80',
        EditLogger: 'text-orange-500/80',
        Report: 'text-yellow-500/80',
        UserCreate: 'text-purple-500/80'
    }
    const [eventTypeFilter, setEventTypeFilter] = useState({
        Authentication: true,
        EditProfile: true,
        EditLogger: true,
        Report: true,
        UserCreate: true
    })
    return (<>
        <Dialog open={eventlogsDialogOpen} onOpenChange={setEventlogsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-piwad-blue-500 flex gap-x-2">
                        System Event Logs
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <ListFilterIcon size={20} className="cursor-pointer" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>
                                    Filter Event Types
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {Object.keys(eventTypeFilter).map((eventType) => (
                                    <DropdownMenuCheckboxItem
                                        key={eventType}
                                        checked={eventTypeFilter[eventType]}
                                        onCheckedChange={(checked) => setEventTypeFilter(prev => ({
                                            ...prev,
                                            [eventType]: checked
                                        }))}
                                    >
                                        {eventType}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </DialogTitle>
                    <DialogDescription>Only Admins can view these Logs</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[70dvh] rounded-md border p-4 font-sans">
                    {eventLogs.length ?
                        eventLogs.map((log: EventLog) => 
                            eventTypeFilter[log.EventType] ? (
                            <div key={log.LogId}>
                                <div className="flex justify-between">
                                    <div className="text-[.66rem] text-slate-800/80 ml-0">
                                        <span>{(new Date(log.Timestamp)).toLocaleString()} - </span>
                                        <span className="font-bold"> {log.EventType}: {log.Event} </span>
                                    </div>
                                    <div className="text-[.66rem] text-blue-700/80 mr-2">{log.IpAddress}</div>
                                </div>
                                <div key={log.LogId} className={`text-sm ${eventTypeColorMap[log.EventType] ?? "text-black"}`}>
                                    {log.Message}
                                </div>
                                <Separator className="my-2" />
                            </div>
                        ): null) :
                        <div className="justify-center flex-col h-[50vh] text-red-500/90 font-semibold">
                            <Loader2Icon className="animate-spin size-24 mx-auto h-full " />
                        </div>}
                </ScrollArea>
                <DialogClose asChild><Button>Close</Button></DialogClose>
            </DialogContent>
        </Dialog>
    </>
    )
}
export default EventLogsDialog