import { Loader2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"

function EventLogsDialog({ eventlogsDialogOpen, setEventlogsDialogOpen, eventLogs }) {
    const eventTypeColorMap = {
        Authentication: 'text-blue-500/80',
        EditProfile: 'text-green-500/80',
        EditLogger: 'text-orange-500/80',
        Report: 'text-yellow-500'
    }
    return (<>
        <Dialog open={eventlogsDialogOpen} onOpenChange={setEventlogsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-piwad-blue-500">System Event Logs</DialogTitle>
                    <DialogDescription>Only Admins can view these Logs</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[70dvh] rounded-md border p-4 font-sans">
                    {eventLogs.length ?
                        eventLogs.map((log) => (
                            <div key={log.LogId}>
                                <div className="flex justify-between">
                                    <div className="text-[.66rem] text-slate-800/80 ml-0">
                                        <span>{(new Date(log.Timestamp)).toLocaleString()} - </span>
                                        <span className="font-bold"> {log.EventType} </span>
                                    </div>
                                    <div className="text-[.66rem] text-blue-700/80 mr-2">{log.IpAddress}</div>
                                </div>
                                <div key={log.LogId} className={`text-sm ${eventTypeColorMap[log.EventType] ?? "text-black"}`}>
                                    {log.Message}
                                </div>
                                <Separator className="my-2" />
                            </div>
                        )) :
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