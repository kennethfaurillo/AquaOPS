import { Separator } from "./ui/separator";
import LatestLogTable from "./LatestLogTable";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { useState } from "react";

function LatestLogsCard() {
    const [latestLogTime, setLatestLogTime] = useState(null)
    return (
        <Card >
            <CardHeader className='rounded-t-lg bg-piwad-lightblue-600'>
                <CardTitle className='text-piwad-lightyellow-300'>
                    Data Logger List
                </CardTitle>
                <CardDescription className='text-slate-200'>
                    <>Latest Log: Logger #1 {latestLogTime ? (new Date(latestLogTime)).toString() : null}</>
                </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent>
                <LatestLogTable setLatestLogTime={setLatestLogTime}/>
            </CardContent>
        </Card>
    )
}

export default LatestLogsCard