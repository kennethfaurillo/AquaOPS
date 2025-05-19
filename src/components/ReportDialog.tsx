import { useAuth } from "@/hooks/useAuth"
import { generateReport, jsonToCSV } from "@/lib/utils"
import axios from "axios"
import { addDays, format } from "date-fns"
import { CalendarIcon, FileImageIcon, FileJsonIcon, FileSpreadsheetIcon, FileTypeIcon, Loader2Icon, SheetIcon } from "lucide-react"
import moment from "moment"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { toast } from "sonner"
import * as XLSX from 'xlsx'
import { Button } from "./ui/button"
import { Calendar } from "./ui/calendar"
import { Checkbox } from "./ui/checkbox"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Label } from "./ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

interface ReportDialogProps {
    reportDialogOpen: boolean
    setReportDialogOpen: (open: boolean) => void
    loggerInfo: any
    allowedDates: string[]
}

function ReportDialog({ reportDialogOpen, setReportDialogOpen, loggerInfo, allowedDates }: ReportDialogProps) {
    const today = new Date((new Date()).toDateString())
    // Time interval for report generation
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(today, -2),
        to: today,
    })
    // Allowed dates for report generation
    // Loading state for report generation
    const [loadingReport, setLoadingReport] = useState(false)
    // Links to download generated report
    const [link, setLink] = useState({ csv: null, json: null })
    // Which logs are checked 
    const [reportChecked, setReportChecked] = useState({
        param: null,
        flow: false,
        pressure: false,
        voltage: false,
        averaging: 'none',
        totalizerNet: false,
        totalizerPositive: false,
        totalizerNegative: false
    })
    // xlsx Workbook to generate 
    const [workbook, setWorkbook] = useState(XLSX.utils.book_new())
    // Report file type to download
    type ReportFileType = 'csv' | 'xlsx' | 'json' | 'png'
    const [reportFileType, setReportFileType] = useState<ReportFileType>('xlsx')
    const [allowedTotalizerDates, setAllowedTotalizerDates] = useState([])
    const { user } = useAuth()

    const fetchTotalizerDates = async (loggerId: string) => {
        const logDatesResponse = await axios.get(`${import.meta.env.VITE_API}/api/totalizer_log_dates/${loggerId}`, { withCredentials: true })
        return logDatesResponse.data
    }

    useEffect(() => {
        // fetch allowed totalizer dates
        (async () => {
            if (loggerInfo) {
                try {
                    const dates = await fetchTotalizerDates(loggerInfo.LoggerId)
                    setAllowedTotalizerDates(dates)
                } catch (error) {
                    console.log(error)
                }
            }
        })()
        // cleanup when closing report dialog
        if (!reportDialogOpen) {
            setLoadingReport(false)
            setReportChecked({
                param: null,
                flow: false,
                pressure: false,
                voltage: false,
                averaging: 'none',
                totalizerNet: false,
                totalizerPositive: false,
                totalizerNegative: false
            })
            setLink({ csv: null, json: null })
            setDate({
                from: addDays(today, -2),
                to: today,
            })
            setWorkbook(XLSX.utils.book_new())
            setReportFileType('xlsx')
            setAllowedTotalizerDates([])
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
                            <Tabs defaultValue="flow-pressure" onValueChange={() => {
                                setReportChecked({
                                    param: null,
                                    flow: false,
                                    pressure: false,
                                    voltage: false,
                                    averaging: 'none',
                                    totalizerNet: false,
                                    totalizerPositive: false,
                                    totalizerNegative: false
                                })
                            }}>
                                <TabsList>
                                    <TabsTrigger value="flow-pressure"> Flow & Pressure </TabsTrigger>
                                    <TabsTrigger value="totalizer" disabled={!loggerInfo.Type.includes("flow")}> Daily Volume </TabsTrigger>
                                </TabsList>
                                <p className="text-lg text-left font-semibold">Report Parameters</p>
                                <TabsContent value="flow-pressure"  >
                                    {/* Checkbox Group */}
                                    <div className="mt-1">
                                        {loggerInfo.Type.includes("flow") ?
                                            <span className="space-x-1 mx-4">
                                                <Checkbox id="cbFlow" checked={reportChecked.param == 'flow'} onCheckedChange={(isChecked) => {
                                                    setLink({ csv: null, json: null })
                                                    setReportChecked({
                                                        ...reportChecked,
                                                        // flow: isChecked
                                                        param: isChecked ? 'flow' : null
                                                    })
                                                }} />
                                                <Label htmlFor="cbFlow">Flow</Label>
                                            </span> : null
                                        }
                                        {loggerInfo.Type.includes("pressure") ?
                                            <span className="space-x-1 mx-4">
                                                <Checkbox id="cbPressure" checked={reportChecked.param == 'pressure'} onCheckedChange={isChecked => {
                                                    setLink({ csv: null, json: null })
                                                    setReportChecked({
                                                        ...reportChecked,
                                                        // pressure: isChecked
                                                        param: isChecked ? 'pressure' : null
                                                    })
                                                }} />
                                                <Label htmlFor="cbPressure">Pressure</Label>
                                            </span> : null
                                        }
                                        <span className="space-x-1 mx-4">
                                            <Checkbox id="cbVoltage" checked={reportChecked.param == 'voltage'} onCheckedChange={isChecked => {
                                                setLink(null)
                                                setReportChecked({
                                                    ...reportChecked,
                                                    // voltage: isChecked
                                                    param: isChecked ? 'voltage' : null
                                                })
                                            }} />
                                            <Label htmlFor="cbVoltage">Voltage</Label>
                                        </span>
                                    </div>
                                    <div className="mt-1">
                                        <p className="text-lg text-left font-semibold">Averaging</p>
                                        {/* Averaging Toggle Group */}
                                        <ToggleGroup type="single" value={reportChecked.averaging ?? 'none'} onValueChange={(value) => {
                                            if (!value) return
                                            console.log(value)
                                            setReportChecked({
                                                ...reportChecked,
                                                averaging: value
                                            })
                                        }}>
                                            <ToggleGroupItem value="none">
                                                <SheetIcon />
                                                <div className="ml-1">
                                                    None
                                                </div>
                                            </ToggleGroupItem>
                                            <ToggleGroupItem value="hourly">
                                                <SheetIcon />
                                                <div className="ml-1">
                                                    Hourly
                                                </div>
                                            </ToggleGroupItem>
                                            <ToggleGroupItem value="daily">
                                                <SheetIcon />
                                                <div className="ml-1">
                                                    Daily
                                                </div>
                                            </ToggleGroupItem>
                                        </ToggleGroup>
                                    </div>
                                    <div className="mt-1"></div>
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
                                                        onSelect={(range) => {
                                                            console.log("select")
                                                            setLink(null)
                                                            setWorkbook(XLSX.utils.book_new())
                                                            setDate(range)
                                                        }}
                                                        numberOfMonths={1}
                                                        disabled={(calDate) => {
                                                            return !allowedDates.includes(calDate.toDateString())
                                                        }}
                                                    />
                                                    : null}
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </TabsContent>
                                <TabsContent value="totalizer">
                                    {/* Checkbox Group */}
                                    {loggerInfo.Type.includes("flow") ?
                                        <div className="grid">
                                            <span className="space-x-1 mx-4">
                                                <Checkbox id="cbTotalizerNet" checked={reportChecked.totalizerNet} onCheckedChange={isChecked => {
                                                    setReportChecked({
                                                        ...reportChecked,
                                                        totalizerNet: isChecked
                                                    })
                                                }} />
                                                <Label htmlFor="cbTotalizerNet">Net Volume</Label>
                                            </span>
                                            <span className="space-x-1 mx-4">
                                                <Checkbox id="cbTotalizerPositive" checked={reportChecked.totalizerPositive} onCheckedChange={isChecked => {
                                                    setReportChecked({
                                                        ...reportChecked,
                                                        totalizerPositive: isChecked
                                                    })
                                                }} />
                                                <Label htmlFor="cbTotalizerPositive">Forward Volume</Label>
                                            </span>
                                            <span className="space-x-1 mx-4 overflow-hidden">
                                                <Checkbox id="cbTotalizerNegative" checked={reportChecked.totalizerNegative} onCheckedChange={isChecked => {
                                                    setReportChecked({
                                                        ...reportChecked,
                                                        totalizerNegative: isChecked
                                                    })
                                                }} />
                                                <Label htmlFor="cbTotalizerNegative">Reverse Volume</Label>
                                            </span>
                                        </div> : null
                                    }
                                    <div className="mt-1"></div>
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
                                                {allowedTotalizerDates.length ?
                                                    <Calendar
                                                        initialFocus
                                                        mode="range"
                                                        defaultMonth={date?.from}
                                                        selected={date}
                                                        onSelect={(range) => {
                                                            console.log("select")
                                                            setLink(null)
                                                            setWorkbook(XLSX.utils.book_new())
                                                            setDate(range)
                                                        }}
                                                        numberOfMonths={1}
                                                        disabled={(calDate) => {
                                                            return !allowedTotalizerDates.includes(calDate.toDateString())
                                                        }}
                                                    />
                                                    : null}
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </TabsContent>
                            </Tabs>
                            <p className="text-lg text-left font-semibold">Report File Format</p>
                            <ToggleGroup type="single" value={reportFileType} onValueChange={(value) => {
                                if (value) {
                                    setReportFileType(value)
                                }
                                setLink(null)
                            }}>
                                <Tooltip delayDuration={75}>
                                    <ToggleGroupItem value="xlsx">
                                        <TooltipTrigger asChild>
                                            <FileSpreadsheetIcon />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Worksheet File <strong><em>.xlsx</em></strong></p>
                                        </TooltipContent>
                                    </ToggleGroupItem>
                                </Tooltip>

                                <Tooltip delayDuration={75}>
                                    <ToggleGroupItem value="csv">
                                        <TooltipTrigger asChild>
                                            <FileTypeIcon />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>CSV File <strong><em>.csv</em></strong></p>
                                        </TooltipContent>
                                    </ToggleGroupItem>
                                </Tooltip>

                                <Tooltip delayDuration={75}>
                                    <ToggleGroupItem value="img" disabled>
                                        <TooltipTrigger asChild>
                                            <FileImageIcon />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Image File <strong><em>.png</em></strong></p>
                                        </TooltipContent>
                                    </ToggleGroupItem>
                                </Tooltip>

                                <Tooltip delayDuration={75}>
                                    <ToggleGroupItem value="json" >
                                        <TooltipTrigger asChild>
                                            <FileJsonIcon />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>JSON File <strong><em>.json</em></strong></p>
                                        </TooltipContent>
                                    </ToggleGroupItem>
                                </Tooltip>
                            </ToggleGroup>

                        </div> : <Loader2Icon className="animate-spin m-auto size-16" />}
                    <div className="grid grid-cols-2 gap-x-2">
                        {/* {[reportChecked.flow, reportChecked.pressure, reportChecked.voltage].includes(true) && (date?.from || date?.to) && !loadingReport ? */}
                        {(reportChecked.param != null || reportChecked.totalizerNet || reportChecked.totalizerPositive || reportChecked.totalizerNegative) && (date?.from || date?.to) && !loadingReport ?
                            <Button className="bg-piwad-lightyellow-500 text-black" onClick={async () => {
                                setLoadingReport(true)
                                toast.loading("Generating Report")
                                try {
                                    const reportJson = await generateReport(loggerInfo, reportChecked, date, user)
                                    // Header containing logger info, no need to send column headers
                                    const header = `${loggerInfo.Name} ${loggerInfo.LoggerId} ${loggerInfo.Model} ${loggerInfo.Latitude},${loggerInfo.Longitude}`
                                    let tempLink = { csv: null, json: null }
                                    // Create JSON File
                                    if (reportFileType == 'json') {
                                        const filename = `${loggerInfo.Name + '_' + loggerInfo.LoggerId + '_' + moment(date?.from).format('YYYY-MM-DD')}`
                                        const extension = 'json'
                                        const _blob = new Blob([JSON.stringify(reportJson)], { type: 'application/json' })
                                        const url = URL.createObjectURL(_blob)
                                        const jsonLink = document.createElement('a');
                                        jsonLink.download = `${filename}.${extension}`
                                        jsonLink.href = url;
                                        tempLink.json = jsonLink
                                    }
                                    // Create CSV File
                                    if (reportFileType == 'csv') {
                                        const csvLink = jsonToCSV(reportJson, header)
                                        tempLink.csv = csvLink
                                    }
                                    // Create XLSX File
                                    if (reportFileType == 'xlsx') {
                                        const worksheet = XLSX.utils.json_to_sheet(reportJson)
                                        XLSX.utils.book_append_sheet(workbook, worksheet, 'LogSheet1', true)
                                    }
                                    setTimeout(() => {
                                        toast.dismiss()
                                        toast.success("Report Generated!", { description: "Report ready to download" })
                                        setLink(tempLink)
                                        setLoadingReport(false)
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
                        {link && !loadingReport ? <Button className="bg-green-500" onClick={() => {
                            if (reportFileType == 'csv') {
                                link.csv.click()
                            }
                            else if (reportFileType == 'xlsx') {
                                XLSX.writeFile(workbook, `${loggerInfo.Name + '_' + loggerInfo.LoggerId + '_' + moment(date?.from).format('YYYY-MM-DD')}.xlsx`)
                            }
                            else if (reportFileType == 'png') {
                            }
                            else if (reportFileType == 'json') {
                                link.json.click()
                            }
                            setTimeout(() => {
                                setLink(null)
                                setWorkbook(XLSX.utils.book_new())
                            }, 500)
                        }}>Download Report</Button> : <Button className="bg-green-500" disabled>Download Report</Button>}
                    </div>
                    <DialogClose asChild><Button>Close</Button></DialogClose>
                </DialogContent>
            </Dialog>
    </>
    )
}
export default ReportDialog