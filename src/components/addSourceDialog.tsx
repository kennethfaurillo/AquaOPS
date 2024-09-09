import axios from "axios"
import { Loader2Icon } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Separator } from "./ui/separator"


function AddSourceDialog({ addSourceDialogOpen, setAddSourceDialogOpen }) {
    const [loggerConfig, setLoggerConfig] = useState({})
    const [loadingConfigChange, setloadingConfigChange] = useState(false)
    const [activeTab, setActiveTab] = useState<"config" | "limits" | "history">("config")
    const [configLogs, setConfigLogs] = useState([])



    useEffect(() => {
        console.log("addsourcedialog")
    }, [])

    return (<>
        <Dialog open={addSourceDialogOpen} onOpenChange={setAddSourceDialogOpen} >
            <DialogContent>
                <DialogTitle className="text-piwad-blue-500">Add New Water Source</DialogTitle>
                <DialogDescription hidden>Add new water source information</DialogDescription>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle>Water Source Information</CardTitle>
                        <CardDescription>Only Admins can add new water sources</CardDescription>
                        <Separator />
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-x-4">
                            <div>
                                <Label htmlFor="sourceName" className="text-slate-600">Source Name</Label>
                                <Input id={"sourceName"} className=":required" placeholder={'Well Spring'} disabled/>
                            </div>
                            <div>
                                <Label htmlFor="sourceIdNo" className="text-slate-600">Source ID</Label>
                                <Input id={"sourceIdNo"} placeholder={'12345'} disabled/>
                            </div>
                            <div>
                                <Label htmlFor="sourceLat" className="text-slate-600">Latitude</Label>
                                <Input id={"sourceLat"} placeholder={"13.4123"} disabled/>
                            </div>
                            <div>
                                <Label htmlFor="sourceLong" className="text-slate-600">Longitude</Label>
                                <Input id={"sourceLong"} placeholder={"125.2326"} disabled/>
                            </div>
                            <div>
                                <Label className="text-slate-600">Type</Label><br />
                                <Select disabled>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Source Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Well">Well</SelectItem>
                                        <SelectItem value="Surface">Surface</SelectItem>
                                        <SelectItem value="Spring">Spring</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="capacity" className="text-slate-600">Capacity (<strong><em>lps</em></strong>)</Label>
                                <Input id={"capacity"} placeholder={"30"} disabled/>
                            </div>
                            <div>
                                <Label htmlFor="hpRating" className="text-slate-600">HP Rating (<strong><em>hp</em></strong>)</Label>
                                <Input id={"hpRating"} placeholder={"30"} disabled/>
                            </div>
                            <div>
                                <Label htmlFor="supplyVoltage" className="text-slate-600">Supply Voltage (<strong><em>V</em></strong>)</Label>
                                <Input id={"supplyVoltage"} placeholder={"460"} disabled/>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <DialogClose asChild><Button>Close</Button></DialogClose>
                <Button className="bg-green-500" disabled>Save</Button>
            </DialogContent>
        </Dialog>
    </>
    )
}
export default AddSourceDialog