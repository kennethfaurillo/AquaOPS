import { useAuth } from "@/hooks/useAuth"
import { useLogData } from "@/hooks/useLogData"
import { formatLoggerName, isValidFlowLimit, isValidLatitude, isValidLongitude, isValidPressureLimit, isValidSimCardNumber, isValidVoltageLimit, parseLoggerName } from "@/lib/utils"
import axios from "axios"
import { Loader2Icon } from "lucide-react"
import moment from "moment"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"
import { Switch } from "./ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"

type LoggerConfigInput = {
    LoggerName?: string
    LoggerId?: string
    Latitude?: string
    Longitude?: string
    SIM?: string
    VoltageLow?: string
    VoltageHigh?: string
    FlowLow?: string
    FlowHigh?: string
    PressureLow?: string
    PressureHigh?: string
}

type LoggerLimits = {
    VoltageLimit?: string
    PrevVoltageLimit?: string
    FlowLimit?: string
    PrevFlowLimit?: string
    PressureLimit?: string
    PrevPressureLimit?: string
}

type LoggerConfig = {
    LoggerName?: string
    PrevLoggerName?: string
    LoggerId?: string
    PrevLoggerId?: string
    SimNo?: string
    PrevSimNo?: string
    Coordinates?: string
    PrevCoordinates?: string
    Visibility?: string
}

type ConfigLog = {
    LogId: string
    Username: string
    LoggerId?: string
    Parameter: string
    ChangedValues: string
    Timestamp: string
    IpAddress?: string
}

interface LoggerDialogProps {
    loggerDialogOpen: boolean
    setLoggerDialogOpen: (open: boolean) => void
    loggerInfo: {
        LoggerId: string
        Name: string
        Latitude: string
        Longitude: string
        SimNo: string
        Type: string
        Visibility: string
        VoltageLimit?: string
        FlowLimit?: string
        PressureLimit?: string
    }
}

function LoggerDialog({ loggerDialogOpen, setLoggerDialogOpen, loggerInfo }: LoggerDialogProps) {
    const [loggerConfig, setLoggerConfig] = useState<LoggerConfigInput>({})
    const [loadingConfigChange, setloadingConfigChange] = useState(false)
    const [activeTab, setActiveTab] = useState<"config" | "limits" | "history">("config")
    const [configLogs, setConfigLogs] = useState<ConfigLog[]>([])
    const [visibility, setVisibility] = useState({
        map: false,
        table: false
    })

    const { user } = useAuth()
    const isAdmin = (user && user.Type === 'admin') ?? false
    const { fetchData } = useLogData()

    const abortConfigSave = useCallback((error: string, description: string) => {
        setloadingConfigChange(false)
        toast.error(error, { description })
    }, [])

    const handleConfigSave = useCallback(async () => {
        setloadingConfigChange(true)
        // loggerInfo - current logger info from server
        // loggerConfig - input from user
        // _loggerLimits/_loggerConfig - data to be sent to server
        const _loggerLimits: LoggerLimits = {}
        const _loggerConfig: LoggerConfig = {}
        // Logger info
        // Validate Logger Name: at least 3 characters, alphanumeric, no special characters except -
        if (loggerConfig.LoggerName) {
            if (loggerConfig.LoggerName.length < 3) {
                setloadingConfigChange(false)
                toast.error("Invalid Logger Name!", { description: "Logger name must be at least 3 characters long." })
                return
            }
            if (/[_=]/.test(loggerConfig.LoggerName)) {
                setloadingConfigChange(false)
                toast.error("Invalid Logger Name!", { description: "Logger name cannot contain underscores or equal signs." })
                return
            }
            _loggerConfig.LoggerName = formatLoggerName(loggerConfig.LoggerName, loggerInfo.Name)
            // Include old logger config values
            _loggerConfig.PrevLoggerName = loggerInfo.Name
        }
        // Validate Latitude and Longitude
        if (loggerConfig.Latitude || loggerConfig.Longitude) {
            // only validate if at least one is provided
            if (!loggerConfig.Latitude || !loggerConfig.Longitude) {
                // if either is missing (xor)
                return abortConfigSave("Invalid Coordinates", "Both Latitude and Longitude must be provided.")
            }
            if (!isValidLatitude(loggerConfig.Latitude) || !isValidLongitude(loggerConfig.Longitude)) {
                // Check if Latitude and Longitude validity
                return abortConfigSave("Invalid Coordinates", "Coordinates must be valid and within the Pili area")
            }
            // Coordinates are valid, set them
            _loggerConfig.Coordinates = Number(loggerConfig.Latitude).toFixed(5) + ',' + Number(loggerConfig.Longitude).toFixed(5)
            _loggerConfig.PrevCoordinates = loggerInfo.Latitude + ',' + loggerInfo.Longitude
        }
        // Simcard Number
        if (loggerConfig.SIM) {
            if (!isValidSimCardNumber(loggerConfig.SIM)) {
                return abortConfigSave("Invalid SIM Card Number", "SIM Card Number must be 10 digits long and start with a '9'.")
            }
            if (loggerConfig.SIM !== loggerInfo.SimNo) {
                _loggerConfig.SimNo = loggerConfig.SIM
                _loggerConfig.PrevSimNo = loggerInfo.SimNo
            }
        }
        // Logger Limits
        if (loggerConfig.VoltageLow || loggerConfig.VoltageHigh) {
            if (!loggerConfig.VoltageLow || !loggerConfig.VoltageHigh) {
                return abortConfigSave("Invalid Voltage Limits", "Both Voltage Low and High must be provided.")
            }
            if (!isValidVoltageLimit(loggerConfig.VoltageLow, loggerConfig.VoltageHigh)) {
                return abortConfigSave("Invalid Voltage Limits", "Voltage limits must be between 2.0V and 4.5V, and Low must be less than High.")
            }
        }
        if (loggerConfig.FlowLow || loggerConfig.FlowHigh) {
            if (!loggerConfig.FlowLow || !loggerConfig.FlowHigh) {
                return abortConfigSave("Invalid Flow Limits", "Both Flow Low and High must be provided.")
            }
            if (!isValidFlowLimit(loggerConfig.FlowLow, loggerConfig.FlowHigh)) {
                return abortConfigSave("Invalid Flow Limits", "Invalid Flow limits.")
            }
        }
        if (loggerConfig.PressureLow || loggerConfig.PressureHigh) {
            if (!loggerConfig.PressureLow || !loggerConfig.PressureHigh) {
                return abortConfigSave("Invalid Pressure Limits", "Both Pressure Low and High must be provided.")
            }
            if (!isValidPressureLimit(loggerConfig.PressureLow, loggerConfig.PressureHigh)) {
                return abortConfigSave("Invalid Pressure Limits", "Invalid Pressure limits.")
            }
        }
        if (loggerConfig.VoltageLow && loggerConfig.VoltageHigh) {
            _loggerLimits.VoltageLimit = loggerConfig.VoltageLow + ',' + loggerConfig.VoltageHigh
            _loggerLimits.PrevVoltageLimit = loggerInfo.VoltageLimit
        }
        if (loggerConfig.FlowLow && loggerConfig.FlowHigh) {
            _loggerLimits.FlowLimit = loggerConfig.FlowLow + ',' + loggerConfig.FlowHigh
            _loggerLimits.PrevFlowLimit = loggerInfo.FlowLimit
        }
        if (loggerConfig.PressureLow && loggerConfig.PressureHigh) {
            _loggerLimits.PressureLimit = loggerConfig.PressureLow + ',' + loggerConfig.PressureHigh
            _loggerLimits.PrevPressureLimit = loggerInfo.PressureLimit
        }
        // Logger Visibility
        const loggerVisibility = `${visibility.map ? 'map' : ''}${visibility.map && visibility.table ? ',table' : visibility.table ? 'table' : ''}`
        if (loggerVisibility !== loggerInfo.Visibility) {
            _loggerConfig.Visibility = `${visibility.map ? 'map' : ''}${visibility.map && visibility.table ? ',table' : visibility.table ? 'table' : ''}`
        }
        try {
            if (Object.keys(_loggerLimits).length) {
                toast.loading("Updating Limits")
                const changeConfigResponse = await axios.patch(`${import.meta.env.VITE_API}/api/logger_limits/${loggerInfo.LoggerId}`, {
                    ..._loggerLimits,
                    user
                }, { withCredentials: true })
                setTimeout(() => {
                    toast.dismiss()
                    toast.success("Limits Changed!", { description: "The logger alarm limits have been successfully updated." })
                    setloadingConfigChange(false)
                    setLoggerDialogOpen(false)
                }, 500)
            } else if (Object.keys(_loggerConfig).length) {
                toast.loading("Updating Config")
                const changeConfigResponse = await axios.patch(`${import.meta.env.VITE_API}/api/logger_config/${loggerInfo.LoggerId}`, {
                    ..._loggerConfig,
                    user
                }, { withCredentials: true })
                setTimeout(() => {
                    toast.dismiss()
                    toast.success("Config Changed!", { description: "The logger configuration has been successfully updated." })
                    setloadingConfigChange(false)
                    setLoggerDialogOpen(false)
                }, 500)
            } else {
                setTimeout(() => {
                    toast.dismiss()
                    toast.success("Config Unchanged!", { description: "No change has been done to the logger configuration." })
                    setloadingConfigChange(false)
                    setLoggerDialogOpen(false)
                }, 125)
            }
        } catch (e: any) {
            console.log(e)
            setTimeout(() => {
                toast.dismiss()
                toast.error(e?.response?.data ?? "Invalid Config!", { description: "There was an error updating the logger configuration. Please check the values and try again." })
                setloadingConfigChange(false)
                setLoggerDialogOpen(false)
            }, 500)
        }
        // Force refresh map and logger table
        fetchData()
    }, [loggerConfig, visibility, loggerInfo, user, fetchData, setLoggerDialogOpen])

    const fetchConfigLogs = async () => {
        const configLogResponse = await axios.get(`${import.meta.env.VITE_API}/auth/config-log?loggerId=${loggerInfo.LoggerId}`, { withCredentials: true })
        setConfigLogs(configLogResponse.data)
        return
    }
    useEffect(() => {
        if (!loggerInfo || !loggerInfo.Visibility) {
            return
        }
        setVisibility({
            map: loggerInfo.Visibility.split(',').includes('map'),
            table: loggerInfo.Visibility.split(',').includes('table')
        })
    }, [loggerInfo])

    useEffect(() => {
        if (loggerDialogOpen) {
            fetchConfigLogs()
        }
        // cleanup when closing config dialog
        if (!loggerDialogOpen) {
            setLoggerConfig({})
            setloadingConfigChange(false)
            setConfigLogs([])
            setVisibility({
                map: false,
                table: false
            })
        }
    }, [loggerDialogOpen])

    return (<>
        <Dialog open={loggerDialogOpen} onOpenChange={setLoggerDialogOpen}>
            <DialogContent>
                <DialogTitle className="text-piwad-blue-500">Logger Configuration</DialogTitle>
                <DialogDescription hidden>View and edit logger Information and Configuration</DialogDescription>
                <Tabs defaultValue={activeTab} value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
                    <TabsList className="grid grid-cols-3 mx-2 ">
                        <TabsTrigger value="config" >Information</TabsTrigger>
                        <TabsTrigger value="limits" >Alarms</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                    {loggerInfo ? <>
                        <TabsContent value="config">
                            <Card>
                                <CardHeader className="py-4">
                                    <CardTitle>
                                        Logger Information
                                    </CardTitle>
                                    <CardDescription>Only Admins can modify logger configuration and information</CardDescription>
                                    <Separator />
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-x-4">
                                        <div className="flex items-center justify-evenly col-span-2">
                                            <div className="flex items-center space-x-1">
                                                <Switch id="showOnMap"
                                                    checked={visibility.map ?? false}
                                                    onCheckedChange={(checked) => { setVisibility({ ...visibility, map: checked }) }} />
                                                <Label htmlFor="showOnMap" >Show on Map</Label>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Switch id="showInTable"
                                                    checked={visibility.table ?? false}
                                                    onCheckedChange={(checked) => { setVisibility({ ...visibility, table: checked }) }} />
                                                <Label htmlFor="showInTable">Show in Table</Label>
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="loggerName" className="text-slate-600">Logger Name</Label>
                                            <Input id={"loggerName"} placeholder={parseLoggerName(loggerInfo.Name)} className="uppercase"
                                                value={loggerConfig.LoggerName ?? ''}
                                                onChange={(e) => setLoggerConfig((prev) => ({ ...prev, LoggerName: e.target.value.toUpperCase() }))} />
                                        </div>
                                        <div>
                                            <Label htmlFor="loggerID" className="text-slate-600">Logger ID</Label>
                                            <Input id={"loggerID"} placeholder={loggerInfo.LoggerId} type="number"
                                                value={loggerConfig.LoggerId ?? ''} disabled
                                                onChange={(e) => setLoggerConfig((prev) => ({ ...prev, LoggerId: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="loggerLat" className="text-slate-600">Latitude</Label>
                                            <Input id={"loggerLat"} placeholder={loggerInfo.Latitude}
                                                value={loggerConfig.Latitude ?? ''}
                                                onChange={(e) => setLoggerConfig((prev) => ({ ...prev, Latitude: e.target.value }))} />
                                        </div>
                                        <div>
                                            <Label htmlFor="loggerLong" className="text-slate-600">Longitude</Label>
                                            <Input id={"loggerLong"} placeholder={loggerInfo.Longitude}
                                                value={loggerConfig.Longitude ?? ''}
                                                onChange={(e) => setLoggerConfig((prev) => ({ ...prev, Longitude: e.target.value }))} />
                                        </div>
                                        <div>
                                            <Label className="text-slate-600">Parameters</Label><br />
                                            <ToggleGroup type="multiple" size={'sm'} variant={"outline"} className="justify-evenly" value={[...loggerInfo.Type.split(','), 'voltage']} >
                                                <ToggleGroupItem value="voltage" className="italic data-[state=on]:bg-piwad-blue-200/60">v</ToggleGroupItem>
                                                <ToggleGroupItem value="pressure" className="italic data-[state=on]:bg-piwad-blue-200/60">psi</ToggleGroupItem>
                                                <ToggleGroupItem value="flow" className="italic data-[state=on]:bg-piwad-blue-200/60">lps</ToggleGroupItem>
                                            </ToggleGroup>
                                        </div>
                                        <div>
                                            <Label htmlFor="simNo" className="text-slate-600">Sim Card No.</Label>
                                            <Input id={"simNo"} placeholder={loggerInfo.SimNo}
                                                value={loggerConfig.SIM ?? ''}
                                                onChange={(e) => setLoggerConfig({ ...loggerConfig, SIM: e.target.value })} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="limits">
                            <Card>
                                <CardHeader className="py-4">
                                    <CardTitle>Alarm Settings</CardTitle>
                                    <CardDescription>Only Admins can configure alarm thresholds
                                    </CardDescription>
                                    <Separator />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-md font-medium">Voltage</div>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <Label htmlFor="voltageLow" className="text-slate-600">Lower Limit</Label>
                                        <Input id={"voltageLow"} placeholder={loggerInfo?.VoltageLimit?.split(',')[0] ?? "N/A"} disabled={!loggerInfo?.VoltageLimit || !isAdmin}
                                            value={loggerConfig.VoltageLow ?? ''}
                                            onChange={(e) => setLoggerConfig({ ...loggerConfig, VoltageLow: e.target.value })} />
                                        <Label htmlFor="voltageHigh" className="text-slate-600">Upper Limit</Label>
                                        <Input id={"voltageHigh"} placeholder={loggerInfo?.VoltageLimit?.split(',')[1] ?? "N/A"} disabled={!loggerInfo?.VoltageLimit || !isAdmin}
                                            value={loggerConfig.VoltageHigh ?? ''}
                                            onChange={(e) => setLoggerConfig({ ...loggerConfig, VoltageHigh: e.target.value })} />
                                    </div>
                                    <div className="text-md font-medium mt-1">Flow</div>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <Label htmlFor="flowLow" className="text-slate-600">Lower Limit</Label>
                                        <Input id={"flowLow"} placeholder={loggerInfo?.FlowLimit?.split(',')[0] ?? "N/A"} disabled={!isAdmin}
                                            value={loggerConfig.FlowLow ?? ''}
                                            onChange={(e) => setLoggerConfig({ ...loggerConfig, FlowLow: e.target.value })} />
                                        <Label htmlFor="flowHigh" className="text-slate-600">Upper Limit</Label>
                                        <Input id={"flowHigh"} placeholder={loggerInfo?.FlowLimit?.split(',')[1] ?? "N/A"} disabled={!isAdmin}
                                            value={loggerConfig.FlowHigh ?? ''}
                                            onChange={(e) => setLoggerConfig({ ...loggerConfig, FlowHigh: e.target.value })} />
                                    </div>
                                    <div className="text-md font-medium mt-1">Pressure</div>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <Label htmlFor="pressureLow" className="text-slate-600">Lower Limit</Label>
                                        <Input id={"pressureLow"} placeholder={loggerInfo?.PressureLimit?.split(',')[0] ?? "N/A"} disabled={!isAdmin}
                                            value={loggerConfig.PressureLow ?? ''}
                                            onChange={(e) => setLoggerConfig({ ...loggerConfig, PressureLow: e.target.value })} />
                                        <Label htmlFor="pressureHigh" className="text-slate-600">Upper Limit</Label>
                                        <Input id={"pressureHigh"} placeholder={loggerInfo?.PressureLimit?.split(',')[1] ?? "N/A"} disabled={!isAdmin}
                                            value={loggerConfig.PressureHigh ?? ''}
                                            onChange={(e) => setLoggerConfig({ ...loggerConfig, PressureHigh: e.target.value })} />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="history">
                            <Card>
                                <CardHeader className="py-4">
                                    <CardTitle>Configuration History</CardTitle>
                                    <CardDescription>A chronological list of all changes made to the configuration and information of the data logger
                                    </CardDescription>
                                    <Separator />
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[300px] w-full rounded-md border">
                                        <div className="p-4">
                                            {configLogs.length ? configLogs.map((log, index) => {
                                                if (log.ChangedValues.search(';') !== -1) {
                                                    log.ChangedValues = log.ChangedValues.replaceAll('(', '').split(';').join(' to ')
                                                }
                                                return (
                                                    <div key={index}>
                                                        <h4 className="text-sm font-medium">{moment(log.Timestamp).format('YYYY-MM-DD h:mm A')}</h4>
                                                        <p className="break-all text-sm  text-muted-foreground ch">[<strong>{log.Username}</strong>] changed {log.Parameter}: {log.ChangedValues}</p>
                                                        {index < configLogs.length - 1 && <Separator className="my-2" />}
                                                    </div>
                                                )
                                            }) : null}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </> : <Loader2Icon className="animate-spin m-auto size-16" />}
                </Tabs>
                <DialogClose asChild><Button>Close</Button></DialogClose>
                {!loadingConfigChange ?
                    <Button className="bg-green-500" type='submit' onClick={handleConfigSave} disabled={loadingConfigChange}>Save</Button>
                    : <Button className="bg-green-500"> <Loader2Icon className="animate-spin" /></Button>
                }
            </DialogContent>
        </Dialog>
    </>
    )
}
export default LoggerDialog