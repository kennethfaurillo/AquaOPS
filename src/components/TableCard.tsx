import { useState } from "react";
import LatestLogTable from "./LatestLogTable";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { PlusCircleIcon, PlusIcon, PlusSquareIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

function TableCard() {
    const [latestLog, setLatestLog] = useState(null)
    const [activeTab, setActiveTab] = useState("loggers")
    return (
        <>
            <TooltipProvider delayDuration={200}>
                <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} >
                    <TabsList className="grid grid-cols-3 w-full mr-1 bg-slate-200/80">
                        <TabsTrigger value="loggers">Data Loggers</TabsTrigger>
                        <TabsTrigger value="sources">Water Sources</TabsTrigger>
                        <TabsTrigger value="stations">Pump Stations</TabsTrigger>
                    </TabsList>
                    {/* <CardTitle className='text-piwad-lightyellow-300'>
                        Data Logger List
                    </CardTitle>
                    <CardDescription className='text-slate-200'>
                        <>Latest Log: {latestLog?.Name ? capitalize(latestLog.Name.replaceAll('-', ' ').split('_').slice(2).join(' ')) + " Logger" : "N/A"} {latestLog?.LogTime ? (new Date(latestLog.LogTime.slice(0, -1))).toLocaleString() : null}</>
                    </CardDescription> */}
                    <TabsContent value="loggers" forceMount hidden={activeTab != "loggers"}>
                        <Card>
                            <CardHeader className="py-4">
                                <div className="relative flex-row">
                                    <CardTitle>Data Loggers</CardTitle>
                                    <Tooltip>
                                        <TooltipTrigger asChild><PlusCircleIcon color="#4186E5" className="absolute right-1 top-1 text-slate-900 cursor-pointer" /></TooltipTrigger>
                                        <TooltipContent>Add New Logger</TooltipContent>
                                    </Tooltip>
                                    <CardDescription>View and manage data loggers</CardDescription>
                                </div>
                                <Separator />
                            </CardHeader>
                            <CardContent>
                                <LatestLogTable setLatestLog={setLatestLog} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="sources" forceMount hidden={activeTab != "sources"}>
                        <Card>
                            <CardHeader className="py-4">
                                <div className="relative flex-row">
                                    <CardTitle>Water Sources</CardTitle>
                                    <Tooltip>
                                        <TooltipTrigger asChild><PlusCircleIcon color="#4186E5" className="absolute right-1 top-1 text-slate-900 cursor-pointer" /></TooltipTrigger>
                                        <TooltipContent>Add New Source</TooltipContent>
                                    </Tooltip>
                                    
                                    <CardDescription>Update water source information</CardDescription>
                                </div>
                                <Separator />
                            </CardHeader>
                            <CardContent className="relative">
                                <LatestLogTable setLatestLog={setLatestLog} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="stations" forceMount hidden={activeTab != "stations"}>
                        <Card>
                            <CardHeader className="py-4">
                                <div className="relative flex-row">
                                    <CardTitle>Pump Stations</CardTitle>
                                    <Tooltip>
                                        <TooltipTrigger asChild><PlusCircleIcon color="#4186E5" className="absolute right-1 top-1 text-slate-900 cursor-pointer" /></TooltipTrigger>
                                        <TooltipContent>Add New Station</TooltipContent>
                                    </Tooltip>
                                    
                                    <CardDescription>Configure pump station settings</CardDescription>
                                </div>
                                <Separator />
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <LatestLogTable setLatestLog={setLatestLog} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </TooltipProvider>

        </>
    )
}

export default TableCard