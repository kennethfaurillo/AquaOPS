import { PlusCircleIcon } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import LatestLogTable from "./LatestLogTable";
import WaterSourceTable from "./WaterSourceTable";
import { useDialogContext } from "@/hooks/useDialogContext";

function TableCard() {
    const [latestLog, setLatestLog] = useState(null)
    const [activeTab, setActiveTab] = useState("loggers")
    const { addSourceDialogOpen, setAddSourceDialogOpen } = useDialogContext()
    return (
        <>
            <TooltipProvider delayDuration={200}>
                <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} >
                    <TabsList className="grid grid-cols-2 w-full mr-1 bg-slate-200/80">
                        <TabsTrigger value="loggers">Loggers</TabsTrigger>
                        <TabsTrigger value="stations">Water Sources</TabsTrigger>
                    </TabsList>
                    <TabsContent value="loggers" forceMount hidden={activeTab != "loggers"}>
                        <Card>
                            <CardHeader className="py-4 rounded-t-lg bg-piwad-lightblue-600">
                                <div className="relative flex-row">
                                    <CardTitle className="text-piwad-lightyellow-400 ">Data Loggers</CardTitle>
                                    <CardDescription className="text-white/80">View and manage data loggers</CardDescription>
                                    <Separator />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <LatestLogTable setLatestLog={setLatestLog} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="stations" forceMount hidden={activeTab != "stations"}>
                        <Card>
                            <CardHeader className="py-4 rounded-t-lg bg-piwad-lightblue-600">
                                <div className="relative flex-row">
                                    <CardTitle className="text-piwad-lightyellow-400">Water Sources</CardTitle>
                                    <Tooltip>
                                        <TooltipTrigger asChild><PlusCircleIcon color="white" className="absolute right-1 top-1 text-slate-900 cursor-pointer" onClick={() => {
                                            setAddSourceDialogOpen(!addSourceDialogOpen)
                                        }} /></TooltipTrigger>
                                        <TooltipContent>Add New Source</TooltipContent>
                                    </Tooltip>
                                    <CardDescription className="text-white/80">Water Sources overview</CardDescription>
                                    <Separator />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <WaterSourceTable />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </TooltipProvider>
        </>
    )
}

export default TableCard