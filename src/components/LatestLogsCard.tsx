import { Separator } from "./ui/separator";
import LatestLogTable from "./LatestLogTable";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";

function LatestLogsCard() {
    return (
        <Card >
            <CardHeader className='rounded-t-lg bg-piwad-lightblue-600'>
                <CardTitle className='text-piwad-lightyellow-300'>
                    Data Logger List
                </CardTitle>
                <CardDescription className='text-slate-200'>
                    <>Latest Log: Logger #1 {Date()} </>
                </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent>
                <LatestLogTable />
            </CardContent>
        </Card>
    )
}

export default LatestLogsCard