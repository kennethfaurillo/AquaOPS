import valve_blowOff from '@/assets/geoBlowOff.json'
import piliBoundary from '@/assets/geoBoundary.json'
import hydrants from '@/assets/geoHdyrant.json'
import pipelines from '@/assets/geoPipeline.json'
import source_spring from '@/assets/geoSourceSpring.json'
import source_surface from '@/assets/geoSourceSurface.json'
import source_well from '@/assets/geoSourceWell.json'
import specific_capacity from '@/assets/geoSpecificCapacity.json'
import { capitalize, isValueInRange, lerp } from '@/lib/utils'
import ResetViewControl from '@20tab/react-leaflet-resetview'
import axios from 'axios'
import { addHours } from 'date-fns'
import { DivIcon, Icon } from 'leaflet'
import 'leaflet.fullscreen/Control.FullScreen.css'
import 'leaflet.fullscreen/Control.FullScreen.js'
import { BadgeAlertIcon, BadgeCheckIcon, BadgeMinusIcon, BatteryFullIcon, BatteryLowIcon, BatteryMediumIcon, BatteryWarningIcon, BellOffIcon, BellRingIcon, EarthIcon, LucideIcon, MoonIcon, SunIcon } from 'lucide-react'
import moment from 'moment'
import { useCallback, useEffect, useState } from 'react'
import { GeoJSON, LayerGroup, LayersControl, MapContainer, Marker, TileLayer, Tooltip, useMapEvents } from 'react-leaflet'
import { toast } from 'sonner'
import { useDrawerDialogContext } from '../hooks/useDrawerDialogContext'
import './Map.css'
import { DataLog, Datalogger, LoggerLog } from './Types'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

import icValve from '../assets/button.png'
import icDam from '../assets/dam2.png'
import icSpring from '../assets/hot-spring.png'
import icHydrant from '../assets/hydrant.png'
import logoMain from '../assets/logo-main.png'
import icMeter from '../assets/meter.png'
import icPump from '../assets/water-pump.png'

const loggerIcon = new Icon({
  iconUrl: icMeter,
  iconSize: [24, 24],
})

const wellIcon = new Icon({
  iconUrl: icPump,
  iconSize: [22, 22],
})

const springIcon = new Icon({
  iconUrl: icSpring,
  iconSize: [30, 30],
})

const riverIcon = new Icon({
  iconUrl: "src/assets/river.png",
  iconSize: [30, 30],
})

const sumpIcon = new Icon({
  iconUrl: "src/assets/sump.png",
  iconSize: [30, 30],
})

const damIcon = new Icon({
  iconUrl: icDam,
  iconSize: [30, 30],
})

const valveIcon = new Icon({
  iconUrl: icValve,
  iconSize: [7, 7],
})

const hydrantIcon = new Icon({
  iconUrl: icHydrant,
  iconSize: [8, 8],
})

const colorMap = {
  "32mm": "#65aff5",
  "50mm": "#f20a82",
  "75mm": "#3ff9ff",
  "100mm": "#a1e751",
  "150mm": "#8879eb",
  "200mm": "#d674ee",
  "250mm": "#def31e",
  "300mm": "#eacb50",
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

function checkVoltage(voltage: number, voltageLimit: string): 'unknown' | 'critical' | 'low' | 'medium' | 'high' | 'full' {
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

function LoggerMapCard() {
  const [loggersLatest, setLoggersLatest] = useState(new Map())
  const [map, setMap] = useState(null)
  const [weight, setWeight] = useState(5); // Initial weight
  const [basemap, setBasemap] = useState(basemaps.at(0))
  const [loggersStatus, setLoggersStatus] = useState({ Active: 0, Inactive: 0, Disabled: 0 })
  const [position, setPosition] = useState({ lat: 13.586680, lng: 123.279893 })
  const [fullscreenMap, setFullscreenMap] = useState(false)
  const [alarm, setAlarm] = useState({})
  const [showAlarm, setShowAlarm] = useState(true)

  const { setLogger, setChartDrawerOpen, } = useDrawerDialogContext()
  const { BaseLayer, Overlay } = LayersControl
  const scaleFactor = 1

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
    async function fetchData() {
      try {
        const loggersInfoResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/logger/`)
        const latestLogsResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/latest_log/`)
        let tempLoggersLatest = new Map()
        const tempLoggersStatus = { Active: 0, Inactive: 0, Disabled: 0 }
        loggersInfoResponse.data.map((logger: Datalogger) => {
          latestLogsResponse.data.map((log: DataLog) => {
            if (logger.LoggerId == log.LoggerId) {
              tempLoggersLatest.set(log.LoggerId, { ...logger, ...log })
              // Count as Active if last log within 3 days 
              if (log.Name.toLowerCase().includes('old')) {
                tempLoggersStatus.Disabled++
              }
              else if (new Date(log.LogTime) > addHours(new Date(), -24)) {
                tempLoggersStatus.Active++
              } else {
                tempLoggersStatus.Inactive++
              }
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
    fetchData()
    // Setup SSE Listener for new logs
    const sse = new EventSource(`//${import.meta.env.VITE_SSE_HOST}:${import.meta.env.VITE_SSE_PORT}/sse`);
    const sseLog = () => {
      fetchData()
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

  const DisplayPosition = ({ map }) => {
    const center = [13.586680, 123.279893]
    const zoom = 13.5
    const onClick = useCallback(() => {
      map.setView(center, zoom)
    }, [map])
    return (
      <>
        <div onClick={onClick} className='cursor-pointer'>
          Coordinates: {position.lat.toFixed('6')}°, {position.lng.toFixed('6')}°
        </div>
        <div className='mb-3 sm:-mb-6 sm:mt-2 sm:space-x-4' />
      </>
    )
  }

  const onEachPipeline = (feature, layer) => {
    layer.bindTooltip(`Pipeline: ${feature.properties?.location.toUpperCase()}`, { direction: 'center' })
    if (feature.properties && feature.properties.ogr_fid) {
      layer.on('click', () => {
        console.log(feature.properties)
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
  };

  const onEachArea = (feature, layer) => {
    if (feature.properties && feature.properties.Name) {
      layer.on('dblclick', () => {
        console.log(feature.properties)
        toast.info(`Baranggay: ${feature.properties?.Name}`)
      });
    }
  };

  const onEachWell = (feature, layer) => {
    layer.setIcon(wellIcon)
    layer.bindTooltip(feature.properties?.well_activ, { direction: 'top' })
    layer.bindPopup(() => `
    <div class="popup-container">
      <div class="popup-header flex space-x-2">
        <img src=${icPump} alt="Icon" class="size-4" />
        <div>${feature.properties?.well_activ || 'No Data'}</div>
      </div>
      <div class="popup-content">
        <div><strong>Address:</strong> ${feature.properties?.address || 'No Data'}</div>
        <div><strong>Date Installed:</strong> ${feature.properties?.date_installed || 'No Data'}</div>
        <div><strong>Pressure Setting:</strong> ${feature.properties?.pressure_setting || 'No Data'}</div>
        <div><strong>Pipe Size:</strong> ${feature.properties?.pipe_size || 'No Data'}</div>
      </div>
    </div>
    ` , {
      className: 'custom-popup',
      offset: [100, 150]
    }
    )

  }

  const onEachSpring = (feature, layer) => {
    layer.setIcon(springIcon)
    layer.bindTooltip(feature.properties?.SPRING, { direction: 'top' })
  }

  const onEachSurface = (feature, layer) => {
    layer.setIcon(damIcon)
    layer.bindTooltip(feature.properties?.SURFACE, { direction: 'top' })
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

  const onEachHydrant = (feature, layer) => {
    layer.setIcon(hydrantIcon)
    layer.bindTooltip('Hydrant: ' + capitalize(feature.properties?.location) + '\n', { direction: 'top' })
    layer.bindPopup(() => `
    <div class="popup-container">
      <div class="popup-header flex space-x-2">
        <img src=${icHydrant} alt="Icon" class="size-4" />
        <div>${capitalize(feature.properties?.location) || 'No Data'}</div>
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
      keypress(e) {
        if (!(e.originalEvent.key == 'f' || e.originalEvent.key == 'F')) return
        map.toggleFullscreen()
      }
    })
    return false
  }

  const displayMap = (() => (
    <MapContainer
      className='cursor-crosshair'
      center={[13.586680, 123.279893]} ref={setMap} style={{ height: '78dvh' }} fullscreenControl={{ pseudoFullscreen: true }}
      scrollWheelZoom={true} zoom={13.5} maxZoom={18} minZoom={12} doubleClickZoom={false}
      maxBounds={[[13.676173, 123.111745], [13.516072, 123.456730]]}>
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
        <Overlay name='Baranggay Boundaries'>
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
        <Overlay name='Springs' checked>
          <GeoJSON data={source_spring} onEachFeature={onEachSpring} />
        </Overlay>
        <Overlay name='Surface Water' checked>
          <GeoJSON data={source_surface} onEachFeature={onEachSurface} />
        </Overlay>
        <Overlay name='Blow Off Valves' >
          <GeoJSON data={valve_blowOff} onEachFeature={onEachBlowOff} />
        </Overlay>
        <Overlay name='Pump Stations' checked>
          <GeoJSON data={source_well} onEachFeature={onEachWell} />
        </Overlay>
        <Overlay name='Data Loggers' checked>
          <LayerGroup>
            {loggersLatest.size ?
              <>
                {Array.from(loggersLatest, ([loggerId, loggerData]) => (
                  <div key={loggerId}>
                    <Marker position={[loggerData.Latitude, loggerData.Longitude]} icon={loggerIcon} eventHandlers={{
                      click: () => {
                        if (fullscreenMap) map.toggleFullscreen()
                        setChartDrawerOpen(true)
                        setLogger(loggerData)
                      },
                    }}>
                      <Tooltip permanent direction={'top'}>
                        {checkVoltage(loggerData.AverageVoltage, loggerData.VoltageLimit) == 'full' ?
                          <BatteryFullIcon color='green' className='size-4' /> : null}
                        {checkVoltage(loggerData.AverageVoltage, loggerData.VoltageLimit) == 'high' ?
                          <BatteryMediumIcon color='green' className='size-4' /> : null}
                        {checkVoltage(loggerData.AverageVoltage, loggerData.VoltageLimit) == 'medium' ?
                          <BatteryMediumIcon color='orange' className='size-4' /> : null}
                        {checkVoltage(loggerData.AverageVoltage, loggerData.VoltageLimit) == 'low' ?
                          <BatteryLowIcon color='red' className='size-4' /> : null}
                        {checkVoltage(loggerData.AverageVoltage, loggerData.VoltageLimit) == 'critical' ?
                          <BatteryWarningIcon color='red' className='size-4 animate-pulse'/> : null}
                        <div className={`${showAlarm && Object.keys(alarm).length && alarm[loggerId].Pressure ? '!text-red-500' : '!text-piwad-blue-600'} font-bold`}>
                          {loggerData.CurrentPressure != null ? <>{loggerData.CurrentPressure.toFixed(1)}<em> psi</em><br /></> : null}
                        </div>
                        <div className={`${showAlarm && Object.keys(alarm).length && alarm[loggerId].Flow ? '!text-red-500' : null} font-bold`}>
                          {loggerData.CurrentFlow != null ? <>{loggerData.CurrentFlow}<em> lps</em></> : null}
                        </div>
                        <div className='text-slate-600 font-light text-[.55rem] drop-shadow-xl text-right'>
                          {loggerData.LogTime ? <>{moment(loggerData.LogTime.replace('Z', ''), true).format('MMM D h:mm a')}<br /></> : null}
                        </div>
                      </Tooltip>
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
          <div className='flex justify-around space-y-2 w-full px-0 md:px-72'>
            <div className="text-piwad-blue-600 text-xs lg:text-xl py-1 font-semibold font-sans leading-none col-start-1 col-span-3 justify-center flex items-center backdrop-blur-[1px] z-[400]">
              {loggersStatus.Active}&nbsp;<BadgeCheckIcon className='sm:mx-1' color='lightgreen' />&nbsp;Active</div>
            <div className="text-piwad-blue-600 text-xs lg:text-xl py-1 font-semibold font-sans leading-none col-span-3 justify-center flex items-center backdrop-blur-[1px] z-[400]">
              {loggersStatus.Inactive}&nbsp;<BadgeAlertIcon className='sm:mx-1' color='yellow' />&nbsp;Inactive</div>
            <div className="text-piwad-blue-600 text-xs lg:text-xl py-1 font-semibold font-sans leading-none col-span-2 justify-center flex items-center backdrop-blur-[1px] z-[400]">
              {loggersStatus.Disabled}&nbsp;<BadgeMinusIcon className='sm:mx-1' color='red' />&nbsp;Disabled</div>
          </div>
        </>
        : null}
    </MapContainer>
  ))

  return (
    <>
      <Card className='col-span-full xl:col-span-9 z-0 drop-shadow-xl rounded-b-lg overflow-hidden'>
        <CardHeader className='rounded-t-lg bg-piwad-lightblue-600'>
          <CardTitle className='text-slate-950'>
            <div className="grid grid-cols-6">
              <div className="col-span-6 sm:col-span-2">
                <p className="mb-1 text-piwad-lightyellow-300">Utility Map</p>
                <div className="text-base text-slate-200 mb-2 ">{map ? <DisplayPosition map={map} /> : null}</div>
              </div>
              <div className="col-span-6 sm:col-span-4 flex items-center space-x-4 rounded-md border-2 border-piwad-yellow-0 -my-2 py-2">
                <div className="grid grid-cols-9 flex-1 space-y-1 mx-4">
                  <div className="text-white text-xs lg:text-xl font-medium leading-none col-span-3 justify-center  flex items-center">
                    {loggersStatus.Active}&nbsp;<BadgeCheckIcon className='sm:mx-1' color='lightgreen' />&nbsp;Active</div>
                  <div className="text-white text-xs lg:text-xl font-medium leading-none col-span-3 justify-center  flex items-center">
                    {loggersStatus.Inactive}&nbsp;<BadgeAlertIcon className='sm:mx-1' color='yellow' />&nbsp;Inactive</div>
                  <div className="text-white text-xs lg:text-xl font-medium leading-none col-span-3 justify-center  flex items-center">
                    {loggersStatus.Disabled}&nbsp;<BadgeMinusIcon className='sm:mx-1' color='red' />&nbsp;Disabled</div>
                </div>
              </div>
            </div>
          </CardTitle>
          <CardDescription>
          </CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          {displayMap()}
        </CardContent>
      </Card>
    </>
  )
}

export default LoggerMapCard;


