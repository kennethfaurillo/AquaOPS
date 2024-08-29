import axios from "axios"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Label } from "./ui/label"

function LoggerDialog({ loggerDialogOpen, setLoggerDialogOpen, loggerInfo }) {
    const [loggerConfig, setLoggerConfig] = useState({})
    const [loadingConfigChange, setloadingConfigChange] = useState(false)

    const { user, token } = useAuth()

    useEffect(() => {
        // cleanup when closing config dialog
        if(!loggerDialogOpen) {
            setLoggerConfig({})
            setloadingConfigChange(false)
        }
    }, [loggerDialogOpen])

    return (<>
        <Dialog open={loggerDialogOpen} onOpenChange={setLoggerDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-piwad-blue-500">Logger Information and Configuration</DialogTitle>
                    <DialogDescription>Only Admins can modify logger configuration and information</DialogDescription>
                </DialogHeader>
                {loggerInfo ?
                    // TODO: Change min max to sliders
                    // TODO: Input validation using zod
                    <div className="text-left">
                        <p className="text-xl text-left font-semibold">Logger Info</p>
                        <div className="grid grid-cols-2 gap-x-4">
                            <div>
                                <Label htmlFor="loggerName" className="text-slate-600">Logger Name</Label>
                                <Input id={"loggerName"} placeholder={loggerInfo.Name?.split('_').slice(2)} disabled />
                            </div>
                            <div>
                                <Label htmlFor="loggerID" className="text-slate-600">Logger ID</Label>
                                <Input id={"loggerID"} placeholder={loggerInfo.LoggerId} disabled />
                            </div>
                            <div>
                                <Label htmlFor="loggerLat" className="text-slate-600">Latitude</Label>
                                <Input id={"loggerLat"} placeholder={loggerInfo.Latitude}
                                    onChange={(e) => setLoggerConfig({ ...loggerConfig, Latitude: e.target.value })} disabled />
                            </div>
                            <div>
                                <Label htmlFor="loggerLong" className="text-slate-600">Longitude</Label>
                                <Input id={"loggerLong"} placeholder={loggerInfo.Longitude}
                                    onChange={(e) => setLoggerConfig({ ...loggerConfig, Longitude: e.target.value })} disabled />
                            </div>
                        </div>
                        <div className="my-2" />
                        <p className="text-xl text-left font-semibold">Logger Alarm Limits</p>
                        <div className="text-md font-medium">Voltage</div>
                        <div className="flex items-center gap-x-4 mt-1">
                            <Label htmlFor="voltageLow" className="text-slate-600">Lower Limit</Label>
                            <Input id={"voltageLow"} placeholder={loggerInfo?.VoltageLimit?.split(',')[0] ?? "N/A"} disabled={!loggerInfo?.VoltageLimit || user.Type != 'admin'}
                                onChange={(e) => setLoggerConfig({ ...loggerConfig, VoltageLow: e.target.value })} />
                            <Label htmlFor="voltageHigh" className="text-slate-600">Upper Limit</Label>
                            <Input id={"voltageHigh"} placeholder={loggerInfo?.VoltageLimit?.split(',')[1] ?? "N/A"} disabled={!loggerInfo?.VoltageLimit || user.Type != 'admin'}
                                onChange={(e) => setLoggerConfig({ ...loggerConfig, VoltageHigh: e.target.value })} />
                        </div>
                        <div className="text-md font-medium mt-1">Flow</div>
                        <div className="flex items-center space-x-2 mt-1">
                            <Label htmlFor="flowLow" className="text-slate-600">Lower Limit</Label>
                            <Input id={"flowLow"} placeholder={loggerInfo?.FlowLimit?.split(',')[0] ?? "N/A"} disabled={user.Type != 'admin'}
                                onChange={(e) => setLoggerConfig({ ...loggerConfig, FlowLow: e.target.value })} />
                            <Label htmlFor="flowHigh" className="text-slate-600">Upper Limit</Label>
                            <Input id={"flowHigh"} placeholder={loggerInfo?.FlowLimit?.split(',')[1] ?? "N/A"} disabled={user.Type != 'admin'}
                                onChange={(e) => setLoggerConfig({ ...loggerConfig, FlowHigh: e.target.value })} />
                        </div>
                        <div className="text-md font-medium mt-1">Pressure</div>
                        <div className="flex items-center space-x-2 mt-1">
                            <Label htmlFor="pressureLow" className="text-slate-600">Lower Limit</Label>
                            <Input id={"pressureLow"} placeholder={loggerInfo?.PressureLimit?.split(',')[0] ?? "N/A"} disabled={user.Type != 'admin'}
                                onChange={(e) => setLoggerConfig({ ...loggerConfig, PressureLow: e.target.value })} />
                            <Label htmlFor="pressureHigh" className="text-slate-600">Upper Limit</Label>
                            <Input id={"pressureHigh"} placeholder={loggerInfo?.PressureLimit?.split(',')[1] ?? "N/A"} disabled={user.Type != 'admin'}
                                onChange={(e) => setLoggerConfig({ ...loggerConfig, PressureHigh: e.target.value })} />
                        </div>
                    </div> : <Loader2Icon className="animate-spin m-auto size-16" />}
                <DialogClose asChild><Button>Close</Button></DialogClose>
                {!loadingConfigChange ?
                    <Button className="bg-green-500" onClick={async () => {
                        setloadingConfigChange(true)
                        toast.loading("Updating Limits")
                        const _loggerConfig = {}
                        if (loggerConfig.VoltageLow && loggerConfig.VoltageHigh) {
                            _loggerConfig.VoltageLimit = loggerConfig.VoltageLow + ',' + loggerConfig.VoltageHigh
                        }
                        if (loggerConfig.FlowLow && loggerConfig.FlowHigh) {
                            _loggerConfig.FlowLimit = loggerConfig.FlowLow + ',' + loggerConfig.FlowHigh
                        }
                        if (loggerConfig.PressureLow && loggerConfig.PressureHigh) {
                            _loggerConfig.PressureLimit = loggerConfig.PressureLow + ',' + loggerConfig.PressureHigh
                        }
                        // Update logger config
                        try {
                            const changeConfigResponse = await axios.patch(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/logger_limits/${loggerInfo.LoggerId}`, {
                                ..._loggerConfig,
                                user
                            })
                            setTimeout(() => {
                                toast.dismiss()
                                toast.success("Limits Changed!", { description: "The logger configuration limits have been successfully updated." })
                                setloadingConfigChange(false)
                                setLoggerDialogOpen(false)
                            }, 500)
                        } catch (e) {
                            setTimeout(() => {
                                toast.dismiss()
                                toast.error("Invalid Limits!", { description: "There was an error updating the logger configuration limits. Please check the values and try again." })
                                setloadingConfigChange(false)
                                setLoggerDialogOpen(false)
                            }, 500)
                        }
                    }} disabled={loadingConfigChange}>Save</Button>
                    : <Button className="bg-green-500"> <Loader2Icon className="animate-spin" /></Button>
                }
            </DialogContent>
        </Dialog>
    </>
    )
}
export default LoggerDialog