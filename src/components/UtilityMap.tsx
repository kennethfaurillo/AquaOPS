import { useLogData } from "@/hooks/useLogData"
import { useSharedStateContext } from "@/hooks/useSharedStateContext"
import { addMinutes } from "date-fns"
import { LockIcon, LockOpenIcon, MapIcon } from "lucide-react"
import moment from "moment"
import { useEffect, useMemo, useRef, useState } from "react"
import { FullscreenControl, NavigationControl, LogoControl, Map as MapDiv, MapRef, Marker, PointLike, TerrainControl } from "react-map-gl/maplibre"
import FloatingCardLabel from "./FloatingCardLabel"
import { loggerIcon } from "./map/LoggerLayer"
import { checkVoltage, parseLoggerName, voltageIconMap } from "./map/utils"
import { Datalogger, LoggerLog } from "./Types"
import { Tooltip as HoverTooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { Separator } from "./ui/separator"

type CardPosition = "left" | "right"


function LoggerMarkerCard({ loggerData, onClick }: { loggerData: LoggerLog, onClick: (loggerData: LoggerLog) => void }) {
    const [cardPosition, setCardPosition] = useState<CardPosition>(() => (Math.random() > 0.5 ? "right" : "left"))
    const [cardLocation, setCardLocation] = useState<{ lng: number; lat: number }>({
        lng: loggerData.Longitude,
        lat: loggerData.Latitude
    })
    const offset = useMemo<PointLike>(() => (cardPosition === "right" ? [16, 0] : [-16, 0]), [cardPosition]
    )
    const [isDraggable, setIsDraggable] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    return (
        <>
            <Marker
                longitude={loggerData.Longitude}
                latitude={loggerData.Latitude}
                className={`flex gap-x-1 items-center justify-center cursor-pointer`}
                onClick={() => onClick(loggerData)}

            >
                <img
                    src={loggerIcon.options.iconUrl}
                    alt="Logger Icon"
                    className={`w-6 h-6 transition-all duration-800 ${isHovered && 'animate-pulse'}`}
                    style={{ objectFit: "contain" }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                />
            </Marker>
            <Marker
                key={`${loggerData.LoggerId}-${cardPosition}`}
                longitude={cardLocation.lng}
                latitude={cardLocation.lat}
                anchor={cardPosition === "right" ? "left" : "right"}
                offset={offset} // Adjust offset based on position
                className={`flex gap-x-1 items-center justify-center`}
                draggable={isDraggable}
                onDragEnd={(e) => {
                    setCardLocation({ lng: e.lngLat.lng, lat: e.lngLat.lat })
                }}
            >
                <div
                    className={`bg-white/60 backdrop-blur-[1px] shadow-lg items-center rounded-xl px-2 py-1 relative ${isDraggable && 'hover:scale-110'} ${isHovered && 'animate-pulse shadow-xl'} `}
                    style={{
                        fontFamily: 'Roboto, sans-serif'
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Status Bar */}
                    <div className="flex justify-between">
                        {/* Buttons */}
                        <div className="text-[.45rem] flex px-1"
                            role="button"
                            onClick={() => { // Toggle position lock on click
                                setIsDraggable(prev => !prev) // Toggle draggable state
                                // setCardLocation({ lng: loggerData.Longitude, lat: loggerData.Latitude }) // Reset position to original location
                                // setCardPosition(prev => prev === "right" ? "left" : "right")
                            }}>
                            <HoverTooltip delayDuration={75}>
                                <TooltipTrigger >
                                    {isDraggable ?
                                        <LockOpenIcon size={12} color="orange" /> :
                                        <LockIcon size={12} color="teal" />
                                    }
                                </TooltipTrigger>
                                <TooltipContent side='top' className='text-zinc-600 text-xs [&>*]:animate-none'>
                                    {isDraggable ?
                                        <> Click to lock position</> :
                                        <> Click to unlock position</>
                                    }
                                </TooltipContent>
                            </HoverTooltip>
                        </div>
                        <div className="flex space-x-1 justify-end">
                            <div className='text-slate-600 font-light text-[.55rem] drop-shadow-xl text-right'>
                                {loggerData.LogTime ? <>{moment(loggerData.LogTime.replace('Z', ''), true).format('MMM D h:mm a')}<br /></> : null}
                            </div>
                            <HoverTooltip delayDuration={75}>
                                <TooltipTrigger className="justify-end">
                                    {voltageIconMap[checkVoltage(loggerData.AverageVoltage, loggerData.VoltageLimit)]}
                                </TooltipTrigger>
                                <TooltipContent side='right' className='text-red-600 text-xs'>
                                    <>
                                        <strong>{loggerData.AverageVoltage} <em>V</em></strong>
                                    </>
                                </TooltipContent>
                            </HoverTooltip>
                        </div>
                    </div>
                    {/* Logger Name */}
                    <div className="font-semibold min-w-28 max-w-40 text-xs px-1 cursor-pointer hover:underline hover:scale-105"
                        onClick={() => onClick(loggerData)}>
                        {parseLoggerName(loggerData.Name)}
                    </div>
                    {/* Log Values */}
                    <div className="flex space-x-2 mt-0.5 mb-0.5">
                        {!loggerData.CurrentPressure ? null :
                            <div className="bg-green-100 rounded-md px-2 py-0.5 text-xs font-semibold">{loggerData.CurrentPressure.toFixed(1)} psi</div>
                        }
                        {!loggerData.CurrentFlow ? null :
                            <div className="bg-blue-100 rounded-md px-2 py-0.5 text-xs font-semibold">{loggerData.CurrentFlow.toFixed(1)} lps</div>
                        }
                    </div>
                </div>
            </Marker>
        </>
    )
}

const UtilityMap = () => {
    const [expandLoggerStatus, setExpandLoggerStatus] = useState<boolean>(false)

    const { loggersData, latestLogsData } = useLogData()
    const { setChartDrawerOpen, setLogger } = useSharedStateContext()
    const isFullscreen = useRef(false)
    const mapRef = useRef<MapRef>(null)

    const { loggersStatus, loggersLatest }: { loggersStatus: { Active: number; Delayed: number; Inactive: number; Disabled: number }, loggersLatest: Map<string, LoggerLog> } = useMemo(() => {
        const loggersStatus = { Active: 0, Delayed: 0, Inactive: 0, Disabled: 0 }
        let loggersLatest = new Map()
        loggersData.map((logger: Datalogger) => {
            latestLogsData.map((log: LoggerLog) => {
                if (logger.LoggerId == log.LoggerId) {
                    if (!logger.Enabled) {
                        loggersStatus.Disabled++
                        return
                    }
                    // Count as Active if last log within 30m, Delayed: 3h, Inactive: beyond 3h
                    const logTime = new Date(log.LogTime.slice(0, -1))
                    if (logTime > addMinutes(new Date(), -30)) {
                        loggersStatus.Active++
                    } else if (logTime > addMinutes(new Date(), -180)) {
                        loggersStatus.Delayed++
                    } else {
                        loggersStatus.Inactive++
                    }
                    loggersLatest.set(log.LoggerId, { ...logger, ...log })
                }
            })
        })
        return {
            loggersStatus,
            loggersLatest
        }
    }, [loggersData, latestLogsData])

    const handleLoggerClick = (loggerData: LoggerLog) => {
        setChartDrawerOpen(true)
        setLogger(loggerData)
    }

    useEffect(() => {
        const handleFullscreenChange = () => {
            const fsElement = document.fullscreenElement?.className;
            console.log('setting is full screen:', fsElement === "maplibregl-map");
            isFullscreen.current = fsElement === "maplibregl-map";
        }

        const handleFKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'f' && mapRef.current) {
                if (isFullscreen.current) {
                    document.exitFullscreen();
                } else {
                    console.log('exiting fullscreen2')
                    mapRef.current?.getContainer().requestFullscreen();
                }
            }
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('keypress', handleFKeyPress);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        }
    }, []);

    return (
        <div className='col-span-full xl:col-span-9 z-0 drop-shadow-xl h-full cursor'>
            {/* Map Card Label */}
            <FloatingCardLabel className='absolute top-4 left-4 z-[401]'
                title='Utility Map' subtitle={"Visualize assets and real-time data"}
                icon={<MapIcon size={24} />} />
            <MapDiv
                initialViewState={{
                    longitude: 123.2871642,
                    latitude: 13.589451,
                    zoom: 14
                }}
                ref={mapRef}
                mapStyle="https://raw.githubusercontent.com/go2garret/maps/main/src/assets/json/openStreetMap.json"
            >
                <FullscreenControl position="bottom-right"/>
                <NavigationControl position="bottom-right"/>
                
                {/* Logger Status Indicator */}
                <div className='absolute top-3 right-3 rounded-sm bg-slate-50 font-semibold text-sm cursor-default p-2 z-[400] flex items-center gap-x-1 outline outline-2 outline-black/20'
                    onMouseOver={() => setExpandLoggerStatus(true)}
                    onMouseOut={() => setExpandLoggerStatus(false)}>
                    <HoverTooltip delayDuration={25}>
                        <TooltipTrigger asChild className='cursor-pointer'>
                            <div className='flex gap-x-1 items-center'>
                                <div className='size-2 bg-green-500 rounded-full' />
                                {loggersStatus.Active}
                                <div className={`font-sans overflow-hidden transition-opacity ease-in-out duration-200 ${expandLoggerStatus ? `` : `w-0 opacity-0`}`}>
                                    Active
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side='bottom' className='text-xs font-extralight' sideOffset={16}>
                            {loggersStatus.Active} data loggers are active and have sent data recently
                        </TooltipContent>
                    </HoverTooltip>
                    <Separator orientation='vertical' className='h-4' />
                    <HoverTooltip delayDuration={25}>
                        <TooltipTrigger asChild className='cursor-pointer'>
                            <div className='flex gap-x-1 items-center'>
                                <div className='size-2 bg-yellow-300 rounded-full' />
                                {loggersStatus.Delayed}
                                <div className={`font-sans overflow-hidden transition-opacity ease-in-out duration-200 ${expandLoggerStatus ? `` : `w-0 opacity-0`}`}>
                                    Delayed
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side='bottom' className='text-xs font-extralight mr-3' sideOffset={16}>
                            {/* TODO: change descriptions */}
                            {loggersStatus.Delayed} data loggers are active but have not yet sent data recently
                        </TooltipContent>
                    </HoverTooltip>
                    <Separator orientation='vertical' className='h-4' />
                    <HoverTooltip delayDuration={25}>
                        <TooltipTrigger asChild className='cursor-pointer'>
                            <div className='flex gap-x-1 items-center'>
                                <div className='size-2 bg-orange-500 rounded-full' />
                                {loggersStatus.Inactive}
                                <div className={`font-sans overflow-hidden transition-opacity ease-in-out duration-200 ${expandLoggerStatus ? `` : `w-0 opacity-0`}`}>
                                    Inactive
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side='bottom' className='text-xs font-extralight mr-3' sideOffset={16}>
                            {loggersStatus.Inactive} data loggers are enabled but have not sent data in the last 3 hours
                        </TooltipContent>
                    </HoverTooltip>
                </div>
                {Array.from(loggersLatest, ([loggerId, loggerData]) => (
                    <div key={loggerId} >
                        {/* Logger Marker */}
                        <LoggerMarkerCard key={loggerId} loggerData={loggerData}
                            onClick={() => handleLoggerClick(loggerData)} />
                    </div>
                ))}
            </MapDiv>
        </div>
    )
}

export default UtilityMap