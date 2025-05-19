import TableCard from "@/components/TableCard";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { DrawerProvider } from "@/hooks/useDrawerContext";
import useIsFirstRender from "@/hooks/useIsFirstRender";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useLogData } from "@/hooks/useLogData";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ChevronUpIcon } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import '../App.css';
import Header from "../components/Header";
import '../index.css';
const LoggerMap = lazy(() => import('@/components/LoggerMap'));


const MapFallback = () => (
    <div className="flex items-center justify-center h-full w-full bg-slate-50 rounded-lg border border-slate-200 p-6">
        <div className="text-center">
            <div className="animate-spin mb-3 h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full mx-auto"></div>
            <p className="text-slate-600 font-medium">Loading map data...</p>
            <p className="text-slate-400 text-sm">Please wait a moment</p>
        </div>
    </div>
)

function DashboardPage() {
    const [dashboardPrefs, setDashboardPrefs] = useLocalStorage('dashboardPrefs', {
        showLoggerList: true,
        showLoggerMap: true
    })
    const { triggerFetch } = useWebSocket()
    const { fetchData } = useLogData()
    const isFirstRender = useIsFirstRender()
    const isWideScreen = window.innerWidth >= 1280
    const [showScrollButton, setShowScrollButton] = useState(false)

    // fetch on render
    useEffect(() => {
        fetchData()
    }, [fetchData])

    // refetch on dashboardPrefs change
    useEffect(() => {
        if (isFirstRender) {
            return
        }
        fetchData()
    }, [isFirstRender, dashboardPrefs, fetchData])

    useEffect(() => {
        if (isFirstRender) {
            return
        }
        fetchData()
    }, [isFirstRender, triggerFetch, fetchData]); // Depend on triggerFetch

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            setShowScrollButton(scrollTop > 400);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className='flex flex-col min-h-dvh overflow-hidden bg-slate-100'>
            <DrawerProvider>
                <Header dashboardPrefs={dashboardPrefs} setDashboardPrefs={setDashboardPrefs} />
                {isWideScreen && dashboardPrefs?.showLoggerList && dashboardPrefs?.showLoggerMap ? (
                    <ResizablePanelGroup direction="horizontal" className="flex flex-1">
                        <ResizablePanel minSize={23} >
                            <TableCard />
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={77} minSize={45} >
                            <Suspense fallback={<MapFallback />}>
                                <LoggerMap />
                            </Suspense>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                ) : (
                    <div className="grid grid-cols-12 gap-4">
                        {dashboardPrefs?.showLoggerList ? (
                            <div className={`col-span-full xl:col-span-3`}>
                                <TableCard />
                            </div>
                        ) : null}
                        {dashboardPrefs?.showLoggerMap ? (
                            <div className={`col-span-full xl:col-span-${dashboardPrefs?.showLoggerList ? 9 : 'full'} z-0 min-h-dvh`}>
                                <Suspense fallback={<MapFallback />}>
                                    <LoggerMap />
                                </Suspense>
                                <button
                                    type="button"
                                    className={`fixed bottom-4 left-4 bg-blue-500 text-white rounded-full p-2 shadow-lg hover:bg-blue-600 transition duration-300 ease-in-out ${showScrollButton ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                                    aria-label="Scroll to top"
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                >
                                    <ChevronUpIcon size={24} />
                                </button>
                            </div>
                        ) : null}
                    </div>
                )}
            </DrawerProvider>
        </div>
    )
}

export default DashboardPage