import { RouterIcon } from "lucide-react";
import FloatingCardLabel from "./FloatingCardLabel";
import LatestLogTable from "./LatestLogTable";
import { ScrollArea } from "./ui/scroll-area";

function TableCard() {
    return (
        <section className="h-[calc(100vh-3.5rem)] flex flex-col bg-white">
            <ScrollArea className="flex-1">
            <div className="flex justify-center pt-4">
                <FloatingCardLabel className="w-full mx-4"
                    title="Data Loggers" subtitle="View and manage data loggers" icon={<RouterIcon size={24} />} />
            </div>
            <div className="mx-4 ">
                <LatestLogTable />
            </div>
            </ScrollArea>
        </section>
    )
}

export default TableCard