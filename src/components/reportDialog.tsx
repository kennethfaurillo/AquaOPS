import { useAuth } from "@/hooks/useAuth"
import { cn, generateReport, jsonToCSV } from "@/lib/utils"
import { addDays, format } from "date-fns"
import { CalendarIcon, Loader2Icon } from "lucide-react"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { toast } from "sonner"
import { Button } from "./ui/button"
import { Calendar } from "./ui/calendar"
import { Checkbox } from "./ui/checkbox"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Label } from "./ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { TooltipProvider } from "./ui/tooltip"

function ReportDialog({ reportDialogOpen, setReportDialogOpen, loggerInfo, allowedDates }) {
    const today = new Date((new Date()).toDateString())
    // Time interval for report generation
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(today, -1),
        to: today,
    })
    // Allowed dates for report generation
    // Loading state for report generation
    const [loadingReport, setLoadingReport] = useState(false)
    // Link to download generated report
    const [link, setLink] = useState(null)
    // Which logs are checked 
    const [reportChecked, setReportChecked] = useState<Object>({
        flow: false,
        pressure: false,
        voltage: false,
        totalizerPositive: false,
        totalizerNegative: false
    })
    const { user, token } = useAuth()

    useEffect(() => {
        // cleanup when closing report dialog
        if(!reportDialogOpen){
            setLoadingReport(false)
            setReportChecked({
                flow: false,
                pressure: false,
                voltage: false,
                totalizerPositive: false,
                totalizerNegative: false
            })
            setLink(null)
        }
    }, [reportDialogOpen])

    return (<>
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-piwad-blue-500">Datalog Report Generation</DialogTitle>
                    {loggerInfo ? <DialogDescription>For {loggerInfo.Name?.replaceAll('-', ' ').replaceAll('=', '-').split('_').slice(2)} Logger</DialogDescription> : null}
                </DialogHeader>
                {loggerInfo ?
                    <div className="text-center">
                        <p className="text-lg text-left font-semibold">Report Type</p>
                        {/* Checkbox Group */}
                        <TooltipProvider>
                            <div className="mt-1">
                                {loggerInfo.Type.includes("flow") ?
                                    <span className="space-x-1 mx-4">
                                        <Checkbox id="cbFlow" checked={reportChecked.flow} onCheckedChange={isChecked => {
                                            setReportChecked({
                                                ...reportChecked,
                                                flow: isChecked
                                            })
                                            if (!reportChecked.flow) {
                                                setReportChecked({
                                                    ...reportChecked,
                                                    flow: isChecked,
                                                    totalizerPositive: false,
                                                    totalizerNegative: false,
                                                })
                                            }
                                        }} />
                                        <Label htmlFor="cbFlow">Flow</Label>
                                    </span> : null
                                }
                                {loggerInfo.Type.includes("pressure") ?
                                    <span className="space-x-1 mx-4">
                                        <Checkbox id="cbPressure" checked={reportChecked.pressure} onCheckedChange={isChecked => {
                                            setReportChecked({
                                                ...reportChecked,
                                                pressure: isChecked
                                            })
                                        }} />
                                        <Label htmlFor="cbPressure">Pressure</Label>
                                    </span> : null
                                }
                                <span className="space-x-1 mx-4">
                                    <Checkbox id="cbVoltage" checked={reportChecked.voltage} onCheckedChange={isChecked => {
                                        setReportChecked({
                                            ...reportChecked,
                                            voltage: isChecked
                                        })
                                    }} />
                                    <Label htmlFor="cbVoltage">Voltage</Label>
                                </span>
                            </div>
                            {reportChecked.flow ?
                                <>
                                    {/* TODO: Totalizer should be a separate report */}
                                    <span className="space-x-1 mx-4">
                                        <Checkbox id="cbTotalizerPositive" checked={reportChecked.totalizerPositive} onCheckedChange={isChecked => {
                                            setReportChecked({
                                                ...reportChecked,
                                                totalizerPositive: isChecked
                                            })
                                        }} disabled />
                                        <Label htmlFor="cbTotalizerPositive">Totalizer Positive</Label>
                                    </span>
                                    <span className="space-x-1 mx-4">
                                        <Checkbox id="cbTotalizerNegative" checked={reportChecked.totalizerNegative} onCheckedChange={isChecked => {
                                            setReportChecked({
                                                ...reportChecked,
                                                totalizerNegative: isChecked
                                            })
                                        }} disabled />
                                        <Label htmlFor="cbTotalizerNegative">Totalizer Negative</Label>
                                    </span>
                                </> : null
                            }
                            <div className="mt-1"></div>
                        </TooltipProvider>
                        <p className="text-lg text-left font-semibold">Report Time Range</p>
                        {/* Time Range Group */}
                        <div className="flex gap-x-2 mt-1">
                            <Popover modal>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className="w-fit justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {date.from.toString() == date.to.toString() ?
                                                        <>
                                                            {format(date.from, "LLL dd, y")}
                                                        </> :
                                                        <>
                                                            {format(date.from, "LLL dd, y")} -{" "}
                                                            {format(date.to, "LLL dd, y")}
                                                        </>
                                                    }
                                                </>
                                            ) : format(date.from, "LLL dd, y")
                                        ) : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    {allowedDates.length ?
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={date?.from}
                                            selected={date}
                                            onSelect={setDate}
                                            numberOfMonths={1}
                                            disabled={(calDate) => {
                                                return !allowedDates.includes(calDate.toDateString())
                                            }}
                                        />
                                        : null}
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div> : <Loader2Icon className="animate-spin m-auto size-16" />}
                <div className="grid grid-cols-2 gap-x-2">
                    {[reportChecked.flow, reportChecked.pressure, reportChecked.voltage].includes(true) && (date?.from || date?.to) && !loadingReport ?
                        <Button className="bg-piwad-lightyellow-500 text-black" onClick={async () => {
                            console.log(reportChecked)
                            console.log(loggerInfo && (date?.from || date?.to))
                            setLoadingReport(true)
                            setLink(null)
                            toast.loading("Generating Report")
                            try {
                                const reportJson = await generateReport(loggerInfo, reportChecked, date, user)
                                // Header containing logger info, no need to send column headers
                                const header = `${loggerInfo.Name} ${loggerInfo.LoggerId} ${loggerInfo.Model} ${loggerInfo.Latitude},${loggerInfo.Longitude}`
                                const _link = jsonToCSV(reportJson, header)
                                setTimeout(() => {
                                    setLoadingReport(false)
                                    toast.dismiss()
                                    toast.success("Report Generated!")
                                    setLink(_link)
                                }, 750)
                            } catch (error) {
                                console.log(error)
                                setLoadingReport(false)
                                toast.dismiss()
                                toast.error(error)
                            }
                        }}>Generate Report</Button> :
                        (loadingReport ?
                            <Button className="bg-piwad-lightyellow-500 text-black" disabled><Loader2Icon className="animate-spin size-4 mr-2" />Generating Report</Button> :
                            <Button className="bg-piwad-lightyellow-500 text-black" disabled>Generate Report</Button>)
                    }
                    {link ? <Button className="bg-green-500" onClick={() => {
                        link.click()
                        setTimeout(() => setLink(null), 500)
                    }}>Download Report</Button> : <Button className="bg-green-500" disabled>Download Report</Button>}
                </div>
                <DialogClose asChild><Button>Close</Button></DialogClose>
            </DialogContent>
        </Dialog>
    </>
    )
}
export default ReportDialog