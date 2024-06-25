import LatestLogsCard from "@/components/LatestLogsCard";
import '../App.css';
import Header from "../components/Header";
import LoggerMapCard from "../components/Map";
import '../index.css';

function DashboardPage() {
    return (
        <>
            <div className='m-auto h-dvh bg-slate-100'>
                <Header user={{"FirstName":"Mr.", "LastName": "Piwad"}}/>
                <div className='grid grid-cols-12 gap-2 mt-2 mx-4 '>
                    <div className="col-span-full xl:col-span-3">
                        <LatestLogsCard/>
                    </div>
                    <div className="col-span-full xl:col-span-9 z-0">
                        <LoggerMapCard />
                    </div>
                </div>
                {/* <div className='grid sm:grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2 mx-4'>
                    <CardDemo className='mx-auto'></CardDemo>
                    <CardDemo className='mx-auto'></CardDemo>
                    <CardDemo className='mx-auto'></CardDemo>
                </div>
                <CardDemo className='mx-auto'></CardDemo> */}
            </div >
        </>
    )
}

export default DashboardPage