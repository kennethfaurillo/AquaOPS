import valve_blowOff from '@/assets/geoBlowOff.json'
import piliBoundary from '@/assets/geoBoundary.json'
import hydrants from '@/assets/geoHdyrant.json'
import pipelines from '@/assets/geoPipeline.json'
import proposed_wellsite from '@/assets/geoProposedWellSite.json'
import specific_capacity from '@/assets/geoSpecificCapacity.json'
import { capitalize, isValueInRange, lerp } from '@/lib/utils'
import ResetViewControl from '@20tab/react-leaflet-resetview'
import axios from 'axios'
import { addHours, addMinutes } from 'date-fns'
import { DivIcon, Icon, LatLng } from 'leaflet'
import 'leaflet.fullscreen/Control.FullScreen.css'
import 'leaflet.fullscreen/Control.FullScreen.js'
import { BatteryFullIcon, BatteryLowIcon, BatteryMediumIcon, BatteryWarningIcon, BellOffIcon, BellRingIcon, EarthIcon, FoldVerticalIcon, LucideIcon, MapPinIcon, MoonIcon, SunIcon, UnfoldVerticalIcon } from 'lucide-react'
import moment from 'moment'
import { useCallback, useEffect, useState } from 'react'
import { GeoJSON, LayerGroup, LayersControl, MapContainer, Marker, Popup, TileLayer, Tooltip, useMapEvents } from 'react-leaflet'
import { toast } from 'sonner'
import './Map.css'
import { DataLog, Datalogger, LoggerLog, Source } from './Types'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tooltip as HoverTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

import { useSharedStateContext } from '@/hooks/useSharedStateContext'
import icProposedWellsite from '../assets/button.png'
import icSurface from '../assets/Filter.svg'
import icHydrant from '../assets/Hydrant.svg'
import logoMain from '../assets/logo-main.png'
import icLogger from '../assets/meter.png'
import icStation from '../assets/Station.svg'
import icSpring from '../assets/Tank.svg'
import icValve from '../assets/Tube.svg'
import { Separator } from './ui/separator'
import Time from './Time'

const loggerIcon = new Icon({
  iconUrl: icLogger,
  iconSize: [24, 24],
})

const StationIcon = new Icon({
  iconUrl: icStation,
  iconSize: [22, 22],
})

const springIcon = new Icon({
  iconUrl: icSpring,
  iconSize: [24, 24],
})

const surfaceIcon = new Icon({
  iconUrl: icSurface,
  iconSize: [24, 24],
})

const valveIcon = new Icon({
  iconUrl: icValve,
  iconSize: [7, 7],
})

const hydrantIcon = new Icon({
  iconUrl: icHydrant,
  iconSize: [10, 10],
})

const proposedWellsiteIcon = new Icon({
  iconUrl: icProposedWellsite,
  iconSize: [10, 10]
})

const colorMap = {
  '32mm': '#65aff5',
  '50mm': '#f20a82',
  '75mm': '#3ff9ff',
  '100mm': '#a1e751',
  '150mm': '#8879eb',
  '200mm': '#d674ee',
  '250mm': '#def31e',
  '300mm': '#eacb50',
}

const voltageIconMap = {
  full: <BatteryFullIcon color='green' className='size-4' />,
  high: <BatteryMediumIcon color='green' className='size-4' />,
  medium: <BatteryMediumIcon color='orange' className='size-4' />,
  low: <BatteryLowIcon color='red' className='size-4' />,
  critical: <BatteryWarningIcon color='red' className='size-4 animate-pulse' />
}

const pressureClassMap = {
  red: '!text-red-500 font-bold',
  normal: '!text-piwad-blue-600 font-bold',
  yellow: '!text-yellow-600 font-bold',
  invalid: 'hidden'
}
interface Props {
  source: Source
}

function SourceMarker({ source }: Props) {
  if (source.Type == 'well')
    return (
      <Marker position={[source.Latitude, source.Longitude]} icon={StationIcon}>
        <Popup className='custom-popup'>
          <div className="popup-container">
            <div className="popup-header flex space-x-2">
              <img src={icStation} alt="Icon" className="size-6" />
              <div className='my-auto'>PS {source.SourceIdNo} {source.Name}</div>
            </div>
            <div className="popup-content">
              <div><strong>Water Permit:</strong> {source.WaterPermitNo}</div>
              <div><strong>Capacity:</strong> {source.Capacity} <em>lps</em></div>
              <div><strong>HP Rating:</strong> {source.HpRating} <em>hp</em></div>
              <div><strong>Supply Voltage:</strong> {source.SupplyVoltage} <em>V</em></div>
            </div>
          </div>
        </Popup>
      </Marker>
    )
  if (source.Type == 'spring')
    return (
      <Marker position={[source.Latitude, source.Longitude]} icon={springIcon}>
        <Popup className='custom-popup'>
          <div className="popup-container">
            <div className="popup-header flex space-x-2">
              <img src={icSpring} alt="Icon" className="size-6" />
              <div className='my-auto'>{source.Name}</div>
            </div>
            <div className="popup-content">
              <div><strong>Water Permit:</strong> {source.WaterPermitNo}</div>
              <div><strong>Capacity:</strong> {source.Capacity} <em>lps</em></div>
            </div>
          </div>
        </Popup>
      </Marker>
    )
  if (source.Type == 'surface')
    return (
      <Marker position={[source.Latitude, source.Longitude]} icon={surfaceIcon}>
        <Popup className='custom-popup'>
          <div className="popup-container">
            <div className="popup-header flex space-x-2">
              <img src={icSurface} alt="Icon" className="size-6" />
              <div className='my-auto'>{source.Name}</div>
            </div>
            <div className="popup-content">
              <div><strong>Water Permit:</strong> {source.WaterPermitNo}</div>
              <div><strong>Capacity:</strong> {source.Capacity} <em>lps</em></div>
            </div>
          </div>
        </Popup>
      </Marker>
    )
}

const pressureDisplay = (currentPressure: number, pressureLimit: string) => {
  if (pressureLimit == null)
    return <div className='font-bold'>{currentPressure.toFixed(1)} <em> psi</em><br /></div>
  return (
    <div className={pressureClassMap[checkPressure(currentPressure, pressureLimit)]}>
      <>{currentPressure.toFixed(1)}<em> psi</em><br /></>
    </div>)
}

type Basemap = {
  name: String,
  label: String,
  url: String,
  icon: LucideIcon
}

const basemaps: Basemap[] = [
  {
    name: "osmLight",
    label: "Light Map",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    icon: SunIcon
  },
  {
    name: "stdDark",
    label: "Dark Map",
    url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
    icon: MoonIcon
  },
  {
    name: "arcSat",
    label: "Sat Map",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    icon: EarthIcon
  },
]

function checkVoltage(voltage: number, voltageLimit: string): 'critical' | 'low' | 'medium' | 'high' | 'full' {
  let [min, max] = voltageLimit.split(',')
  const perc = lerp(min, max, voltage)
  if (perc >= 83) {
    return 'full'
  } else if (perc >= 58) {
    return 'high'
  } else if (perc >= 33) {
    return 'medium'
  } else if (perc >= 16) {
    return 'low'
  } else {
    return 'critical'
  }
}

function checkPressure(pressure: number, pressureLimit: string): 'red' | 'yellow' | 'normal' | 'invalid' {
  let [min, max] = pressureLimit.split(',').map((val) => +val)
  pressure = +pressure.toFixed(1)
  if (pressure < -10) {
    return 'invalid'
  }
  if (pressure >= max + 20) {
    return 'red'
  } else if (pressure >= max) {
    return 'yellow'
  } else if (pressure >= min) {
    return 'normal'
  } else if (pressure >= (min - 5)) {
    return 'yellow'
  } else {
    return 'red'
  }
}

function LoggerMapCard() {
  const [loggersLatest, setLoggersLatest] = useState(new Map())
  const [map, setMap] = useState(null)
  const [weight, setWeight] = useState(5)
  const [basemap, setBasemap] = useState(basemaps.at(0))
  const [sources, setSources] = useState([])
  const [loggersStatus, setLoggersStatus] = useState({ Active: 0, Delayed: 0, Inactive: 0, Disabled: 0 })
  const [position, setPosition] = useState({ lat: 13.586680, lng: 123.279893 })
  const [fullscreenMap, setFullscreenMap] = useState(false)
  const [alarm, setAlarm] = useState({})
  const [showAlarm, setShowAlarm] = useState(true)
  const [expandLoggerStatus, setExpandLoggerStatus] = useState(false)
  const [expandMapTable, setExpandMapTable] = useState(false)

  const { setChartDrawerOpen, setLogger, mapRefreshToggle } = useSharedStateContext()
  const { BaseLayer, Overlay } = LayersControl
  const scaleFactor = 1

  // Forced Refresh when updating database
  useEffect(() => {
    return () => {
      fetchLatestLogsInfo()
      console.log("forced map refresh")
    }
  }, [mapRefreshToggle])

  useEffect(() => {
    if (!map) return

    const updateWeight = () => {
      const zoom = map.getZoom();
      // Adjust weight based on zoom level
      const newWeight = Math.max(2, 1 + (zoom - 13) / scaleFactor);
      setWeight(newWeight);
    };

    map.on('enterFullscreen exitFullscreen', (e) => {
      if (e.type == "enterFullscreen") {
        setFullscreenMap(true);
      } else {
        setFullscreenMap(false);
      }
    });

    map.on('zoomend', updateWeight);
    updateWeight(); // Set initial weight based on initial zoom

    return () => {
      map.off('zoomend', updateWeight);
    };
  }, [map]);

  // Check for alarms
  useEffect(() => {
    if (loggersLatest.size) {
      let _alarm = { ...alarm }
      loggersLatest.forEach((logger: LoggerLog, key) => {
        const loggerId = logger.LoggerId
        _alarm = { ..._alarm, [loggerId]: { Voltage: false, Pressure: false, Flow: false } }
        // check voltage
        if (!isValueInRange(logger.VoltageLimit, logger.AverageVoltage)) {
          _alarm[loggerId].Voltage = true
        }
        // check pressure
        if (logger.PressureLimit && !isValueInRange(logger.PressureLimit, logger.CurrentPressure)) {
          _alarm[loggerId].Pressure = true
        }
        // check voltage
        if (logger.FlowLimit && !isValueInRange(logger.FlowLimit, logger.CurrentFlow)) {
          _alarm[loggerId].Flow = true
        }
      })
      setAlarm(_alarm)
    }
  }, [loggersLatest])

  // Initial load
  useEffect(() => {
    fetchSources()
    fetchLatestLogsInfo()
    // Setup SSE Listener for new logs
    const sse = new EventSource(`//${import.meta.env.VITE_SSE_HOST}:${import.meta.env.VITE_SSE_PORT}/sse`);
    const sseLog = () => {
      fetchLatestLogsInfo()
    }
    if (sse) {
      sse.addEventListener('LogEvent', sseLog)
    }
    return () => {
      if (sse) {
        sse.removeEventListener('LogEvent', sseLog)
      }
      sse.close()
    }
  }, [])

  /**
   * Fetch latest logs with Datalogger Information
   */
  async function fetchLatestLogsInfo() {
    try {
      const loggersInfoResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/logger/`)
      const latestLogsResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/latest_log/`)
      const tempLoggersStatus = { Active: 0, Delayed: 0, Inactive: 0, Disabled: 0 }
      let tempLoggersLatest = new Map()
      loggersInfoResponse.data.map((logger: Datalogger) => {
        latestLogsResponse.data.map((log: DataLog) => {
          if (logger.LoggerId == log.LoggerId) {
            if (!logger.Enabled) {
              tempLoggersStatus.Disabled++
              return
            }
            // Count as Active if last log within 30m, Delayed: 3h, Inactive: beyond 3h
            const logTime = new Date(log.LogTime.slice(0, -1))
            if (logTime > addMinutes(new Date(), -30)) {
              tempLoggersStatus.Active++
            } else if (logTime > addMinutes(new Date(), -180)) {
              tempLoggersStatus.Delayed++
            } else {
              tempLoggersStatus.Inactive++
            }
            tempLoggersLatest.set(log.LoggerId, { ...logger, ...log })
          }
        })
      })
      setLoggersStatus(tempLoggersStatus)
      setLoggersLatest(tempLoggersLatest)
    }
    catch (error) {
      console.log(error)
    }
  }

  /**
   * Fetch Pump Station Information
   */
  async function fetchSources() {
    try {
      const sourceInfo = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/source/`)
      setSources(sourceInfo.data)
    } catch (error) {
      console.log(error)
    }
  }

  const DisplayPosition = ({ map }) => {
    const center = [13.586680, 123.279893]
    const zoom = 13.5
    const onClick = useCallback(() => {
      map.setView(center, zoom)
    }, [map])
    return `${position.lat.toFixed(6)}°, ${position.lng.toFixed(6)}°`
  }

  const onEachPipeline = (feature, layer) => {
    layer.bindTooltip(`Pipeline: ${feature.properties?.location.toUpperCase()}`, { direction: 'center' })
    if (feature.properties && feature.properties.ogr_fid) {
      layer.on('click', () => {
        toast.info(`Pipeline #${feature.properties?.ogr_fid} ${capitalize(feature.properties?.location)}`, {
          description: <>
            <span>Size: {feature?.properties.size}</span>
            <span> | Length: {feature?.properties.lenght.replace('.', '')}</span>
            <div>
              {feature.properties["year inst."] ? <>Install Date: {feature.properties["year inst."].toUpperCase()}</> : <span>{null}</span>}
            </div>
          </>,
        })
      });
    }
  }

  const onEachArea = (feature, layer) => {
    if (feature.properties && feature.properties.Name) {
      layer.on('dblclick', () => {
        console.log(feature.properties)
        toast.info(`Barangay ${feature.properties?.Name}`)
      });
    }
  }

  const onEachSpecificCapacity = (feature, layer) => {
    layer.bindTooltip(feature.properties?.cap, { direction: 'center' })
    layer.on('dblclick', () => {
      toast.info(`Capacity: ${feature.properties?.cap}`)
    });
  }

  const onEachBlowOff = (feature, layer) => {
    layer.setIcon(valveIcon)
    layer.bindTooltip('Blow-off Valve: ' + feature.properties?.location.toUpperCase() + '\n' + feature.properties?.size, { direction: 'top' })
  }

  const onEachProposedWellsite = (feature, layer) => {
    layer.setIcon(proposedWellsiteIcon)
    layer.bindTooltip('Proposed Well Site: ' + capitalize(feature.properties?.location.toUpperCase()) + '\n', { direction: 'top' })
  }

  const onEachHydrant = (feature, layer) => {
    layer.setIcon(hydrantIcon)
    layer.bindTooltip('Hydrant: ' + capitalize(feature.properties?.location) + '\n', { direction: 'top' })
    layer.bindPopup(() => `
    <div class="popup-container">
      <div class="popup-header flex space-x-2">
        <img src=${icHydrant} alt="Icon" class="size-6" />
        <div class='my-auto'>${capitalize(feature.properties?.location) || 'No Data'}</div>
      </div>
      <div class="popup-content">
        <div><strong>Date Installed:</strong> ${moment(feature.properties['year inst.'], true).format('MM-DD-YYYY') || 'No Data'}</div>
        <div><strong>Type:</strong> ${capitalize(feature.properties?.type) || 'No Data'}</div>
        <div><strong>Pipe Size:</strong> ${feature.properties?.size || 'No Data'}</div>
      </div>
    </div>
    ` , {
      className: 'custom-popup',
      offset: [100, 150]
    }
    )
  }

  const themeToggleOnclick = () => {
    setBasemap(basemaps.find((bmap) => bmap.name != basemap.name))
  }

  const MapEvents = () => {
    useMapEvents({
      mousemove(e) {
        setPosition({ lat: e.latlng.lat, lng: e.latlng.lng })
      },
      moveend(e) {
        setPosition(map.getCenter())
      },
      keypress(e) {
        if (!(e.originalEvent.key == 'f' || e.originalEvent.key == 'F')) return
        map.toggleFullscreen()
      }
    })
    return false
  }

  const displayMap = (() => (
    <TooltipProvider>
      <MapContainer
        className='cursor-crosshair'
        center={[13.589451, 123.2871642]} ref={setMap} style={{ height: '78dvh' }} fullscreenControl={{ pseudoFullscreen: true }}
        scrollWheelZoom={true} zoom={13.5} maxZoom={18} minZoom={12} doubleClickZoom={false} zoomSnap={.2}
        maxBounds={[[13.696173, 123.111745], [13.456072, 123.456730]]}>
        <ResetViewControl title="Reset View" icon={"🔍"} />
        <LayersControl position='topright'>
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
          <Overlay name='Barangay Boundaries'>
            <GeoJSON data={piliBoundary} style={{ fillOpacity: 0, weight: 1, color: 'orange' }} onEachFeature={onEachArea} />
          </Overlay>
          <Overlay name='Specific Capacity'>
            <GeoJSON data={specific_capacity} style={{ fillOpacity: 0, weight: 1, color: 'violet' }} onEachFeature={onEachSpecificCapacity} />
          </Overlay>
          <Overlay name='Pipelines' checked>
            <GeoJSON data={pipelines} style={(feature) => ({
              color: basemap?.name === "stdDark" ? colorMap[feature?.properties.size] : "#58D68D90",
              weight: weight,
            })}
              onEachFeature={onEachPipeline}
            />
          </Overlay>
          <Overlay name='Fire Hydrants' checked>
            <GeoJSON data={hydrants} onEachFeature={onEachHydrant} />
          </Overlay>
          <Overlay name='Blow Off Valves' >
            <GeoJSON data={valve_blowOff} onEachFeature={onEachBlowOff} />
          </Overlay>
          <Overlay name='Water Sources' checked>
            <LayerGroup>
              {sources.length ?
                sources.map((source: Source, index) => (
                  <div key={index}>
                    <SourceMarker source={source} />
                  </div>
                )) : null}
            </LayerGroup>
          </Overlay>
          <Overlay name='Proposed Well Sites' checked>
            <GeoJSON data={proposed_wellsite} onEachFeature={onEachProposedWellsite} />
          </Overlay>
          <Overlay name='Data Loggers' checked>
            <LayerGroup>
              {loggersLatest.size ?
                <>
                  {Array.from(loggersLatest, ([loggerId, loggerData]) =>
                  (
                    <div key={loggerId}>
                      <Marker position={[loggerData.Latitude, loggerData.Longitude]} icon={loggerIcon} eventHandlers={{
                        click: () => {
                          if (fullscreenMap) map.toggleFullscreen()
                          setChartDrawerOpen(true)
                          setLogger(loggerData)
                        },
                      }}>
                        {!(loggerData?.Visibility.split(',').includes('map')) ? null : <Tooltip permanent direction={'top'} interactive={true}>
                          <div className='text-slate-600 font-light text-[.55rem] drop-shadow-xl text-right'>
                            {loggerData.LogTime ? <>{moment(loggerData.LogTime.replace('Z', ''), true).format('MMM D h:mm a')}<br /></> : null}
                          </div>
                          <div className='flex justify-between space-x-2'>
                            {loggerData.CurrentPressure == null ? null :
                              pressureDisplay(loggerData.CurrentPressure, loggerData.PressureLimit)
                            }
                            <HoverTooltip delayDuration={75}>
                              <TooltipTrigger >
                                {loggerData.Type.includes('pressure') ? voltageIconMap[checkVoltage(loggerData.AverageVoltage, loggerData.VoltageLimit)] : null}
                              </TooltipTrigger>
                              <TooltipContent side='right' className='text-red-600 text-xs'>
                                <>
                                  <strong>{loggerData.AverageVoltage} <em>V</em></strong>
                                </>
                              </TooltipContent>
                            </HoverTooltip>
                          </div>
                          <div className='flex justify-between space-x-2'>
                            {loggerData.CurrentFlow == null ? null :
                              <div className='font-bold'>{loggerData.CurrentFlow}<em> lps</em> </div>
                            }
                            <HoverTooltip delayDuration={75}>
                              <TooltipTrigger >
                                {loggerData.Type.includes('flow') && !loggerData.Type.includes('pressure') ? voltageIconMap[checkVoltage(loggerData.AverageVoltage, loggerData.VoltageLimit)] : null}
                              </TooltipTrigger>
                              <TooltipContent side='right' className='text-red-600 text-xs'>
                                <>
                                  <strong>{loggerData.AverageVoltage} <em>V</em></strong>
                                </>
                              </TooltipContent>
                            </HoverTooltip>
                          </div>
                        </Tooltip>}
                      </Marker>
                      <Marker position={[loggerData.Latitude, loggerData.Longitude]} icon={new DivIcon({ iconSize: [0, 0] })}>
                        {basemap?.name == "stdDark" ?
                          <div><Tooltip permanent direction='bottom' className='logger-label-dark'>{loggerData.Name.replaceAll('-', ' ').replaceAll('=', '-').split('_').slice(2)}</Tooltip></div> :
                          <Tooltip permanent direction='bottom'>{loggerData.Name.replaceAll('-', ' ').replaceAll('=', '-').split('_').slice(2)}</Tooltip>
                        }
                      </Marker>
                    </div>
                  ))}
                </>
                : null
              }
            </LayerGroup>
          </Overlay>
        </LayersControl>
        <MapEvents />
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
              {loggersStatus.Disabled} data loggers are disabled and not in operation
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
              {loggersStatus.Inactive} data loggers are enabled but have not sent data in the last 6 hours.
            </TooltipContent>
          </HoverTooltip>
        </div>
        {showAlarm ? <Button className='absolute bottom-24 right-4 z-[401] size-12 p-0 rounded-full opacity-80' onClick={() => setShowAlarm(!showAlarm)}><BellRingIcon /></Button>
          : <Button className='absolute bottom-24 right-4 z-[401] size-12 p-0 rounded-full opacity-100' onClick={() => setShowAlarm(!showAlarm)}><BellOffIcon /></Button>}
        {basemap ?
          basemap.name == "osmLight" ?
            <Button className='absolute bottom-8 right-4 z-[401] size-12 p-0 rounded-full opacity-80' onClick={themeToggleOnclick}><MoonIcon /></Button>
            : <Button className='absolute bottom-8 right-4 z-[401] size-12 p-0 rounded-full opacity-80' variant={"secondary"} onClick={themeToggleOnclick}><SunIcon /></Button>
          : null}
        {fullscreenMap ?
          <>
            <div className='absolute bottom-4 left-4 p-2 rounded-full z-[400]'>
              <img src={logoMain} className='h-12 sm:h-16 md:h-20' />
            </div>
          </>
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
                      map.getBounds().contains(new LatLng(loggerData.Latitude, loggerData.Longitude))) ?
                      <div key={loggerId}>
                        <div className='flex items-center gap-x-2'>
                          <div className='w-[14ch] font-semibold cursor-pointer text-xs sm:text-sm text-slate-800 font-sans'
                            onClick={() => map.setView([loggerData.Latitude, loggerData.Longitude])}
                            onDoubleClick={() => map.setView([loggerData.Latitude, loggerData.Longitude], 20)}>
                            {loggerData.Name.replaceAll('-', ' ').replaceAll('=', '-').split('_').at(-1)}
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
    </TooltipProvider>
  ))

  return (
    <>
      <Card className='col-span-full xl:col-span-9 z-0 drop-shadow-xl rounded-b-lg overflow-hidden'>
        <CardHeader className='rounded-t-lg bg-piwad-lightblue-600 py-4 space-y-1'>
          <CardTitle className='flex justify-between'>
            <div className='space-y-1'>
              <div className='text-piwad-lightyellow-400 flex gap-x-1'>
                <MapPinIcon />Utility Map
              </div>
              <div className='text-white/80 text-sm'>
                {map ? <>Coordinates: <DisplayPosition map={map} /> </> : null}
              </div>
            </div>
            <div>
              <Time />
            </div>
          </CardTitle>
          <CardDescription/>
          <Separator />
        </CardHeader>
        <CardContent className='p-0'>
          {displayMap()}
        </CardContent>
      </Card>
    </>
  )
}

export default LoggerMapCard;


