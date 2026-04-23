import { useLogData } from '@/hooks/useLogData'
import { useMapContext } from '@/hooks/useMapContext'
import { useSharedStateContext } from '@/hooks/useSharedStateContext'
import { useWebSocket } from '@/hooks/useWebSocket'
import { parseLoggerName } from '@/lib/utils'
import ResetViewControl from '@20tab/react-leaflet-resetview'
import { LatLng, Map as LMap } from 'leaflet'
import 'leaflet.fullscreen/Control.FullScreen.css'
import 'leaflet.fullscreen/Control.FullScreen.js'
import { AlertTriangleIcon, FoldVerticalIcon, MapIcon, MoonIcon, SirenIcon, SunIcon, UnfoldVerticalIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { LayersControl, MapContainer, TileLayer, useMapEvents, ZoomControl } from 'react-leaflet'
import logoMain from '../assets/logo-main.png'
import logoPiwad from '../assets/piwad-logo.png'
import FloatingCardLabel from './FloatingCardLabel'
import './Map.css'
import BarangayLayer from './map/BarangayLayer'
import BlowoffLayer from './map/BlowoffLayer'
import CapacityLayer from './map/CapacityLayer'
import HydrantLayer from './map/HydrantLayer'
import { LoggerLayer } from './map/LoggerLayer'
import { PipelineLayer } from './map/PipelineLayer'
import ProposedSiteLayer from './map/ProposedSiteLayer'
import { SampleLayer } from './map/SampleLayer'
import { SourceLayer } from './map/SourceLayer'
import { ServiceConnectionsLayer } from './map/ServiceConnectionsLayer'
import {
  Basemap, basemaps
} from './map/utils'
import Time from './Time'
import { LoggerLog } from './Types'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'
import { Tooltip as HoverTooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import axios from 'axios'

// Extend Leaflet.Map type to include toggleFullscreen (possible typo)
type LeafletMap = LMap & { toggleFullscreen: () => void }

type LoggerAlarmStatus = {
  Id: number
  LoggerId: string
  AlarmLevel: 'WARNING' | 'CRITICAL'
  StartTime: string
  LatestValue: number
  ThresholdValue: number
  IsAcknowledged?: boolean
  Count?: number
  LastNotifyTime?: string
}

const fullscreenPluginProps = {
  fullscreenControl: true,
  fullscreenControlOptions: { position: 'bottomleft' },
} as const

function LoggerMap() {
  const { map, setMap } = useMapContext();
  const [weight, setWeight] = useState<number>(5)
  const [basemap, setBasemap] = useState<Basemap>(basemaps[0])
  const [position, setPosition] = useState<{ lat: number; lng: number }>({ lat: 13.586680, lng: 123.279893 })
  const [fullscreenMap, setFullscreenMap] = useState<boolean>(false)
  const [expandLoggerStatus, setExpandLoggerStatus] = useState<boolean>(false)
  const [expandMapTable, setExpandMapTable] = useState<boolean>(false)
  const [expandAlarmOverlay, setExpandAlarmOverlay] = useState<boolean>(true)
  const [alarmStatuses, setAlarmStatuses] = useState<LoggerAlarmStatus[]>([])

  const { setChartDrawerOpen, setLogger } = useSharedStateContext()
  const { triggerFetchAlarmStatus } = useWebSocket()
  const { loggersStatus, loggersLatest } = useLogData()
  const { BaseLayer } = LayersControl
  const scaleFactor = 1

  const fetchAlarmStatuses = useCallback(async (signal?: AbortSignal) => {
    const response = await axios.get(`${import.meta.env.VITE_API}/api/alarm_status`, {
      withCredentials: true,
      signal,
    })
    const alarmRows = response.data as LoggerAlarmStatus[]

    setAlarmStatuses(alarmRows.filter((alarm) => alarm.AlarmLevel === 'WARNING' || alarm.AlarmLevel === 'CRITICAL'))
  }, [])

  const updateWeight = useCallback(() => {
    if (!map) {
      return
    }
    const zoom = map.getZoom();
    // Adjust weight based on zoom level
    const newWeight = Math.max(2, 1 + (zoom - 13) / scaleFactor);
    setWeight(newWeight);
  }, [map]);

  // Map event listeners for fullscreen toggle
  useEffect(() => {
    if (!map) return

    map.on('enterFullscreen exitFullscreen', (e) => {
      if (e.type == "enterFullscreen") {
        setFullscreenMap(true);
      } else {
        setFullscreenMap(false);
      }
    });

    return () => {
      map.off('enterFullscreen exitFullscreen');
    };
  }, [map]);

  useEffect(() => {
    const controller = new AbortController()

    fetchAlarmStatuses(controller.signal).catch((error) => {
      if (!axios.isCancel(error) && error.name !== 'CanceledError') {
        setAlarmStatuses([])
      }
    })

    return () => {
      controller.abort()
    }
  }, [fetchAlarmStatuses])

  useEffect(() => {
    if (triggerFetchAlarmStatus == null) {
      return
    }

    const controller = new AbortController()

    fetchAlarmStatuses(controller.signal).catch((error) => {
      if (!axios.isCancel(error) && error.name !== 'CanceledError') {
        setAlarmStatuses([])
      }
    })

    return () => {
      controller.abort()
    }
  }, [fetchAlarmStatuses, triggerFetchAlarmStatus])

  const themeToggleOnclick = () => {
    const newBasemap = basemaps.find((bmap) => bmap.name != basemap.name)
    if (newBasemap) {
      setBasemap(newBasemap)
    }
  }

  const handleLoggerClick = useCallback((loggerData: LoggerLog) => {
    if (map && fullscreenMap) {
      map.toggleFullscreen()
    }
    setChartDrawerOpen(true)
    setLogger(loggerData)
  }, [map, fullscreenMap])

  const MapEvents = () => {
    if (!map) {
      return
    }
    useMapEvents({
      moveend() {
        setPosition(map.getCenter())
      },
      dblclick(e) {
        map.flyTo(e.latlng, map.getZoom() + 1)
      },
      zoomend() {
        updateWeight()
      },
      keypress(e) {
        if (!(e.originalEvent.key == 'f' || e.originalEvent.key == 'F')) return
        map.toggleFullscreen()
      }
    })
    return null
  }

  const activeAlarmStatuses = alarmStatuses
    .map((alarm) => {
      const loggerData = loggersLatest.get(alarm.LoggerId)
      return {
        ...alarm,
        loggerData,
      }
    })
    .filter((alarm) => alarm.loggerData)

  const warningAlarmCount = activeAlarmStatuses.filter((alarm) => alarm.AlarmLevel === 'WARNING').length
  const criticalAlarmCount = activeAlarmStatuses.filter((alarm) => alarm.AlarmLevel === 'CRITICAL').length

  return (
    <>
      <div className='col-span-full xl:col-span-9 z-0 drop-shadow-xl h-full'>
        {/* Map Card Label */}
        <FloatingCardLabel className='absolute top-4 left-4 z-[401]'
          title='Utility Map' subtitle={map ? `Coordinates: ${position.lat.toFixed(6)}°, ${position.lng.toFixed(6)}°` : ''}
          icon={<MapIcon size={24} />} />
        <div className='h-full bg-blue-500'>
          <MapContainer
            whenReady={() => {
              updateWeight()
            }}
            className='cursor-crosshair size-full'
            center={[13.589451, 123.2871642]}
            ref={(instance: LeafletMap) => {
              setMap(instance)
            }}
            {...(fullscreenPluginProps as unknown as Record<string, unknown>)} zoomControl={false}
            scrollWheelZoom={true} zoom={13.5} maxZoom={18} minZoom={12} doubleClickZoom={false}
            maxBounds={[[13.696173, 123.111745], [13.456072, 123.456730]]}>
            <ZoomControl position='bottomleft' />
            <ResetViewControl position='bottomleft' title="Reset View" icon={"🔍"} />
            <LayersControl position='topright' >
              <BaseLayer name='Street Map' checked>
                <TileLayer
                  url={basemap ? basemap.url : "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"}
                  attribution={basemap.name == 'osmLight' ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' : '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
                />
              </BaseLayer>
              <BaseLayer name='Satellite Map'>
                <TileLayer
                  url={"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"}
                  attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                />
              </BaseLayer>
              <BarangayLayer />
              <CapacityLayer />
              <BlowoffLayer />
              <PipelineLayer basemap={basemap} weight={weight} />
              <SourceLayer />
              <HydrantLayer />
              <ProposedSiteLayer />
              <LoggerLayer basemap={basemap} loggersLatestData={loggersLatest}
                onMarkerClick={handleLoggerClick} />
              <SampleLayer />
              <ServiceConnectionsLayer />
            </LayersControl>
            <MapEvents />
            {/* Logger Status Indicator */}
            <div className='absolute top-16 right-3 rounded-lg bg-slate-50 font-semibold text-sm cursor-default p-2 z-[400] flex items-center gap-x-1 outline outline-2 outline-black/20'
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
            <Card className='absolute bottom-24 left-1/2 z-[400] w-[22rem] max-w-[calc(100%-3rem)] -translate-x-1/2 bg-white/90 backdrop-blur-[2px] outline outline-2 outline-black/20 sm:bottom-8 sm:max-w-[calc(100%-8rem)]'>
              <CardHeader className='space-y-1 px-3 py-2'>
                <CardTitle className='flex items-center justify-between gap-2 text-sm text-piwad-lightblue-500'>
                  <span className='inline-flex items-center gap-2'>
                    <SirenIcon className='h-4 w-4' /> Alarms
                  </span>
                  <div className='flex items-center gap-2 text-xs font-medium'>
                    <span className='inline-flex items-center gap-1 text-amber-600'>
                      <span className='size-2 rounded-full bg-amber-400' /> {warningAlarmCount}
                    </span>
                    <span className='inline-flex items-center gap-1 text-red-600'>
                      <span className='size-2 rounded-full bg-red-500' /> {criticalAlarmCount}
                    </span>
                    {expandAlarmOverlay ?
                      <FoldVerticalIcon cursor={'pointer'} size={16} onClick={() => setExpandAlarmOverlay(false)} />
                      : <UnfoldVerticalIcon cursor={'pointer'} size={16} onClick={() => setExpandAlarmOverlay(true)} />
                    }
                  </div>
                </CardTitle>
              </CardHeader>
              {expandAlarmOverlay ? <CardContent className='px-3 pb-3 pt-0'>
                {activeAlarmStatuses.length ? <div className='max-h-[16rem] space-y-2 overflow-y-auto pr-1'>
                  {activeAlarmStatuses.map((alarm) => (
                    <button
                      key={alarm.Id}
                      type='button'
                      className='flex w-full items-start justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left transition-colors hover:bg-slate-100'
                      onClick={() => {
                        if (alarm.loggerData && map) {
                          map.flyTo([alarm.loggerData.Latitude, alarm.loggerData.Longitude], Math.max(map.getZoom(), 16))
                        }
                      }}
                    >
                      <div className='min-w-0'>
                        <div className='flex items-center gap-2'>
                          <span className='truncate text-xs font-semibold text-slate-800'>
                            {alarm.loggerData ? parseLoggerName(alarm.loggerData.Name) : alarm.LoggerId}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-1 py-0.5 text-[10px] font-semibold ${alarm.AlarmLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            <AlertTriangleIcon className='h-3 w-3' /> {alarm.AlarmLevel}
                          </span>
                        </div>
                        <div className='mt-1 text-xs text-slate-600'>
                          Current: {alarm.LatestValue.toFixed(2)} psi • Threshold: {alarm.ThresholdValue.toFixed(2)} psi
                        </div>
                        <div className='mt-1 text-[11px] text-slate-500'>
                          Since: {new Date(alarm.StartTime.replace('Z', '')).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                      <div className='ml-3 shrink-0 text-right text-[11px] text-slate-500'>
                        <div>{alarm.Count ?? 0} hits</div>
                        {alarm.IsAcknowledged ? <div className='text-green-600'>Ack</div> : <div className='text-red-500'>Live</div>}
                      </div>
                    </button>
                  ))}
                </div> : (
                  <div className='rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500'>
                    No warning or critical alarms to display.
                  </div>
                )}
              </CardContent> : null}
            </Card>
            {basemap ?
              basemap.name == "osmLight" ?
                <Button className='absolute bottom-8 right-4 z-[401] size-12 p-0 rounded-full opacity-80' onClick={themeToggleOnclick}><MoonIcon /></Button>
                : <Button className='absolute bottom-8 right-4 z-[401] size-12 p-0 rounded-full opacity-80' variant={"secondary"} onClick={themeToggleOnclick}><SunIcon /></Button>
              : null}
            {fullscreenMap ?
              <div className='absolute bottom-4 left-4 p-2 rounded-full z-[400]'>
                <img src={logoMain} className='h-12 sm:h-16 md:h-20' />
              </div>
              : <div className='absolute bottom-4 left-4 p-2 rounded-full z-[400]'>
                <img src={logoPiwad} className='h-14' />
              </div>}
            {fullscreenMap ?
              <div className='absolute top-2 left-12 p-2 rounded-full z-[400]'>
                <Time color='black' />
              </div>
              : null}
            {fullscreenMap ?
              <>
                <Card className='absolute bottom-6 translate-x-[60%] sm:top-28 sm:bottom-auto sm:right-3 sm:translate-x-0 z-[401] bg-white/70 backdrop-blur-[2px] outline outline-2 outline-black/20'>
                  <CardHeader className="px-2 py-1 rounded-t-lg space-y-1 w-48">
                    <CardTitle className="text-base text-piwad-lightblue-500 flex gap-x-1 justify-between items-center">
                      Data Loggers
                      {expandMapTable ?
                        <FoldVerticalIcon cursor={'pointer'} size={16} onClick={() => setExpandMapTable(false)} />
                        : <UnfoldVerticalIcon cursor={'pointer'} size={16} onClick={() => setExpandMapTable(true)} />
                      }
                    </CardTitle>
                  </CardHeader>
                  {/* Logger Table Map Overlay */}
                  <CardContent className='px-2 pb-0'>
                    {loggersLatest.size && expandMapTable ?
                      <>
                        {Array.from(loggersLatest, ([loggerId, loggerData]) => (
                          map?.getBounds().contains(new LatLng(loggerData.Latitude, loggerData.Longitude))) ?
                          <div key={loggerId}>
                            <div className='flex items-center gap-x-2'>
                              <div className='w-[14ch] font-semibold cursor-pointer text-xs sm:text-sm text-slate-800 font-sans'
                                onClick={() => map.flyTo([loggerData.Latitude, loggerData.Longitude])}
                                onDoubleClick={() => map.flyTo([loggerData.Latitude, loggerData.Longitude], 20)}>
                                {parseLoggerName(loggerData.Name)}
                              </div>
                              <div className='text-right w-[10ch] font-sans text-slate-800'>
                                {loggerData.CurrentPressure ? <div>{loggerData.CurrentPressure} <em>psi</em></div> : null}
                                {loggerData.CurrentFlow ? <div>{loggerData.CurrentFlow} <em>lps</em></div> : null}
                              </div>
                            </div>
                            <Separator />
                          </div> :
                          null
                        )}
                      </> : null}
                  </CardContent>
                </Card>
              </> : null}
          </MapContainer>
        </div>
      </div>
      {/* move zoom controls to the middle left */}
      <style>
        {`
          .leaflet-bottom.leaflet-left {
            top: 12rem;
            left: 0.5rem;
            transform: translateY(-50%);
            display: flex;
            height: fit-content;
            flex-direction: column;
            gap: 4px;
          }
        `}
      </style>
    </>
  )
}

export default LoggerMap;