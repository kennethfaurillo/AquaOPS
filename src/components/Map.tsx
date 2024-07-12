import ResetViewControl from '@20tab/react-leaflet-resetview';
import axios from 'axios';
import { DivIcon, Icon } from 'leaflet';
import { BadgeCheckIcon, BadgeHelpIcon, BadgeMinusIcon, CalendarRangeIcon, LucideIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { GeoJSON, MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';
import { toast } from 'sonner';
import { pipelines } from '../assets/pipelines';
import './Map.css';
import { DataLog, Datalogger } from './Types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import { useDrawerDialogContext } from '../hooks/useDrawerDialogContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import moment from 'moment';

let loggerIcon = new Icon({
  iconUrl: "src/assets/meter.png",
  iconSize: [30, 30],
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
]

function LoggerMapCard() {
  const [loggersLatest, setLoggersLatest] = useState(new Map())
  const [map, setMap] = useState(null)
  const [weight, setWeight] = useState(5); // Initial weight
  const [basemap, setBasemap] = useState(basemaps.at(0))
  // const [mapTheme, setMapTheme] = useState("light")

  const { setLogger, setChartDrawerOpen, } = useDrawerDialogContext()

  useEffect(() => {
    if (!map) return
    const updateWeight = () => {
      const zoom = map.getZoom();
      // Adjust weight based on zoom level
      const newWeight = Math.max(2, 1 + (zoom - 13) / 1); // Example calculation
      // console.log(newWeight)
      setWeight(newWeight);
    };

    map.on('zoomend', updateWeight);
    updateWeight(); // Set initial weight based on initial zoom

    return () => {
      map.off('zoomend', updateWeight);
    };
  }, [map]);


  // Initial load
  useEffect(() => {
    async function fetchData() {
      try {
        const loggersInfoResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/logger/`)
        const latestLogsResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/latest_log/`)
        // setLoggersInfo(loggersInfoResponse.data)
        // setLatestLogs(latestLogsResponse.data)
        //@ts-ignore
        let tempLoggersLatest = new Map()
        loggersInfoResponse.data.map((logger: Datalogger) => {
          latestLogsResponse.data.map((log: DataLog) => {
            if (logger.LoggerId == log.LoggerId) {
              //@ts-ignore
              tempLoggersLatest.set(log.LoggerId, { ...logger, ...log })
            }
          })
        })
        setLoggersLatest(tempLoggersLatest)
      }
      catch (error) {
        //@ts-ignore
        console.log(error)
      }
      // finally {
      //   setLoading(false)
      // }
    }
    fetchData()
  }, [])

  const DisplaySelectors = ({ map }) => {
    const [openPopover, setOpenPopover] = useState(false)
    return (
      <>
        <Popover open={openPopover} onOpenChange={setOpenPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className=" justify-start text-white border-white/20 bg-blue-800/50"
            >
              {basemap ? (
                <>
                  <basemap.icon className="mr-2 h-4 w-4 shrink-0" />
                  {basemap.label}
                </>
              ) : (
                <>+ Set Basemap</>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" side="right" align="start">
            <Command>
              {/* <CommandInput placeholder="Change basemap..." /> */}
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {basemaps.map((bmap) => (
                    <CommandItem
                      key={bmap.name}
                      value={bmap.name}
                      className={`${bmap.name === basemap?.name ? "bg-piwad-yellow-100" : "bg-none"} gap-2`}
                      onSelect={(name) => {
                        setBasemap(basemaps.find((priority) => priority.name === name) || null)
                        setOpenPopover(false)
                      }}
                    >
                      <bmap.icon />
                      <span>{bmap.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </>
    )
  }

  const DisplayPosition = ({ map }) => {
    const center = [51.505, -0.09]
    const zoom = 13

    const [position, setPosition] = useState(() => map.getCenter())

    const onClick = useCallback(() => {
      map.setView(center, zoom)
    }, [map])
    const onMove = useCallback(() => {
      setPosition(map.getCenter())
    }, [map])

    useEffect(() => {
      map.on('move', onMove)
      return () => {
        map.off('move', onMove)
      }
    }, [map, onMove])
    return (
      <>
        <div>
          Coordinates: {position.lat.toFixed('6')}°, {position.lng.toFixed('6')}°
        </div>
        <div className='mb-3 sm:-mb-6 sm:mt-2 sm:space-x-4'>
          {DisplaySelectors(map)}
        </div>
      </>
    )
  }

  const onEachPipeline = (feature, layer) => {
    // console.log(feature.properties)
    if (feature.properties && feature.properties.ogr_fid) {
      // layer.bindTooltip(feature.properties.ogr_fid)
      // layer.bindTooltip(<Tooltip permanent>{feature.properties.ogr_fid}</Tooltip>)
      // layer.on('')
      layer.on('click', () => {
        console.log("click")
        console.log(feature.properties)
        // setHoverPipeline(feature.properties)
        toast.info(`Pipeline #${feature.properties?.ogr_fid} ${feature.properties?.location.toUpperCase()}`, {
          // description: `Size: ${feature.properties.size} | Length ${feature.properties.lenght}`,
          description: <>
            <span>Size: {feature?.properties.size}</span>
            <span> | Length: {feature?.properties.lenght.replace('.', '')}</span>
            <div>
              {feature.properties["year inst."] ? <>Install Date: {feature.properties["year inst."].toUpperCase()}</> : <span>{null}</span>}

            </div>
          </>,
        })
        // layer.openTooltip();
      });
      // layer.on('mouseover', () => {
      //   console.log("hover")
      //   setHoverPipeline(feature.properties)
      //   // layer.openTooltip();
      // });
      // layer.on('mouseout', () => {
      //   console.log("unhover")
      //   setHoverPipeline(null)
      //   // layer.closePopup();
      // });
    }
  };

  // const displayMap = useMemo(() => (
  const displayMap = (() => (
    <MapContainer // @ts-ignore
      center={[13.58438280013, 123.2738403740]} ref={setMap} style={{ height: '71vh' }}
      scrollWheelZoom={true} zoom={13.5} maxZoom={18} minZoom={13} doubleClickZoom={false}
      maxBounds={[[13.676173, 123.111745], [13.516072, 123.456730]]}>
      <ResetViewControl title="Reset View" icon={"🔍"} />
      <TileLayer
        url={basemap ? basemap.url : "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        className='z-0'

      />
      <GeoJSON data={pipelines} style={(feature) => ({
        color: basemap?.name === "stdDark" ? colorMap[feature?.properties.size] : "#58D68D90",//"#6792A0",
        weight: weight,
      })}
        onEachFeature={onEachPipeline}
      >
      </GeoJSON>
      {loggersLatest.size ?
        <>
          {Array.from(loggersLatest, ([loggerId, loggerData]) => (
            <div key={loggerId}>
              <Marker position={[loggerData.Latitude, loggerData.Longitude]} icon={loggerIcon} eventHandlers={{
                click: (event) => {
                  setChartDrawerOpen(true)
                  setLogger(loggerData)
                },
              }}>
                <Tooltip permanent direction={'top'}>
                  <div className='text-piwad-blue-400 font-bold drop-shadow-xl'>
                    {loggerData.CurrentPressure ? <>{loggerData.CurrentPressure}<em> psi</em><br /></> : null}
                  </div>
                  <div className='text-[#f1663b] font-bold'>
                    {loggerData.CurrentFlow ? <>{loggerData.CurrentFlow}<em> lps</em></> : null}
                  </div>
                  <div className='text-slate-600 font-light text-[.55rem] drop-shadow-xl text-right'>
                    {loggerData.LogTime ? <>{moment(loggerData.LogTime.replace('Z',''), true).format('M/D HH:mm')}<br /></> : null}
                  </div>
                </Tooltip>
              </Marker>
              <Marker position={[loggerData.Latitude, loggerData.Longitude]} icon={new DivIcon({ iconSize: [0, 0] })}>
                {basemap?.name == "stdDark" ?
                  // TODO: fix text color not changing
                  <Tooltip permanent direction='bottom' className={"logger-label-dark"}>{loggerData.Name.replaceAll('-', ' ').split('_').slice(2)}</Tooltip> :
                  <Tooltip permanent direction='bottom' > {loggerData.Name.replaceAll('-', ' ').split('_').slice(2)}</Tooltip>
                }
              </Marker>
            </div>
          ))}
        </>
        : null
      }
    </MapContainer>
  ))

  return (
    <>
      <Card className='col-span-full xl:col-span-9 z-0 drop-shadow-xl' >
        <CardHeader className='rounded-t-lg bg-piwad-lightblue-600'>
          <CardTitle className='text-slate-950'>
            <div className="grid grid-cols-6">
              <div className="col-span-6 md:col-span-2">
                <p className="mb-1 text-piwad-lightyellow-300">Data Logger Map</p>
                <Separator className='mt-2 w-11/12' />
                <div className="text-base text-slate-200 mb-2">{map ? <DisplayPosition map={map} /> : null}</div>
              </div>
              <div className="col-span-6  lg:col-span-4 flex items-center space-x-4 rounded-md border-2 border-piwad-yellow-0 -my-2 py-2">
                <div className="grid grid-cols-9 flex-1 space-y-1 mx-4">
                  <div className="text-piwad-yellow-50 hidden sm:flex text-sm md:text-xl font-medium co leading-none col-span-full justify-center sm:justify-normal sm:col-span-2 flex items-center">
                    Logger Status:</div>
                  <div className="text-white text-xs md:text-xl font-medium leading-none col-span-3 justify-center sm:justify-normal sm:col-span-2 flex items-center">
                    {5}&nbsp;<BadgeCheckIcon color='lightgreen' />&nbsp;Active</div>
                  <div className="text-white text-xs md:text-xl font-medium leading-none col-span-3 justify-center sm:justify-normal sm:col-span-2 flex items-center">
                    {0}&nbsp;<BadgeMinusIcon color='red' />&nbsp;Disabled</div>
                  <div className="text-white text-xs md:text-xl font-medium leading-none col-span-3 justify-center sm:justify-normal sm:col-span-2 flex items-center">
                    {2}&nbsp;<BadgeHelpIcon color='yellow' />&nbsp;Unknown</div>
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