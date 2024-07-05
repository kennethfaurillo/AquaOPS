import { Separator } from "./ui/separator";
import LatestLogTable from "./LatestLogTable";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { useState } from "react";
import { capitalize } from "@/lib/utils";

function LatestLogsCard() {
    const [latestLog, setLatestLog] = useState(null)
    return (
        <Card className="drop-shadow-xl ">
            <CardHeader className='rounded-t-lg bg-piwad-lightblue-600'>
                <CardTitle className='text-piwad-lightyellow-300'>
                    Data Logger List
                </CardTitle>
                <CardDescription className='text-slate-200'>
                    <>Latest Log: {latestLog?.Name ? capitalize(latestLog.Name.replaceAll('-', ' ').split('_').slice(2).join(' '))+" Logger" : "N/A"} {latestLog?.LogTime ? (new Date(latestLog.LogTime.slice(0,-1))).toLocaleString() : null}</>
                </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent>
                <LatestLogTable setLatestLog={setLatestLog}/>
            </CardContent>
        </Card>
    )
}

export default LatestLogsCard