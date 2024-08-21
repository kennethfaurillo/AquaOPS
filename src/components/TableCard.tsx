import { PlusCircleIcon } from "lucide-react";
import { useState } from "react";
import LatestLogTable from "./LatestLogTable";
import StationTable from "./PumpStationTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

function TableCard() {
    const [latestLog, setLatestLog] = useState(null)
    const [activeTab, setActiveTab] = useState("loggers")
    return (
        <>
            <TooltipProvider delayDuration={200}>
                <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} >
                    <TabsList className="grid grid-cols-3 w-full mr-1 bg-slate-200/80">
                        <TabsTrigger value="loggers">Loggers</TabsTrigger>
                        <TabsTrigger value="sources">Sources</TabsTrigger>
                        <TabsTrigger value="stations">Stations</TabsTrigger>
                    </TabsList>
                    <TabsContent value="loggers" forceMount hidden={activeTab != "loggers"}>
                        <Card>
                            <CardHeader className="py-4 rounded-t-lg bg-piwad-lightblue-600">
                                <div className="relative flex-row">
                                    <CardTitle className="text-piwad-lightyellow-400 ">Data Loggers</CardTitle>
                                    <Tooltip>
                                        <TooltipTrigger asChild><PlusCircleIcon color="white" className="absolute right-1 top-1 text-slate-900 cursor-pointer" /></TooltipTrigger>
                                        <TooltipContent>Add New Logger</TooltipContent>
                                    </Tooltip>
                                    <CardDescription className="text-white/80">View and manage data loggers</CardDescription>
                                    <Separator />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <LatestLogTable setLatestLog={setLatestLog} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="sources" forceMount hidden={activeTab != "sources"}>
                        <Card>
                            <CardHeader className="py-4 rounded-t-lg bg-piwad-lightblue-600">
                                <div className="relative flex-row">
                                    <CardTitle className="text-piwad-lightyellow-400">Water Sources</CardTitle>
                                    <Tooltip>
                                        <TooltipTrigger asChild><PlusCircleIcon color="white" className="absolute right-1 top-1 text-slate-900 cursor-pointer" /></TooltipTrigger>
                                        <TooltipContent>Add New Source</TooltipContent>
                                    </Tooltip>

                                    <CardDescription className="text-white/80">Update water source information</CardDescription>
                                    <Separator />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* <LatestLogTable setLatestLog={setLatestLog} /> */}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="stations" forceMount hidden={activeTab != "stations"}>
                        <Card>
                            <CardHeader className="py-4 rounded-t-lg bg-piwad-lightblue-600">
                                <div className="relative flex-row">
                                    <CardTitle className="text-piwad-lightyellow-400">Pump Stations</CardTitle>
                                    <Tooltip>
                                        <TooltipTrigger asChild><PlusCircleIcon color="white" className="absolute right-1 top-1 text-slate-900 cursor-pointer" /></TooltipTrigger>
                                        <TooltipContent>Add New Station</TooltipContent>
                                    </Tooltip>

                                    <CardDescription className="text-white/80">Configure pump station settings</CardDescription>
                                    <Separator />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <StationTable />
                                {/* <LatestLogTable setLatestLog={setLatestLog} /> */}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </TooltipProvider>

        </>
    )
}

export default TableCard