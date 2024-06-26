import axios from 'axios';
import { DivIcon, Icon } from 'leaflet';
import { BadgeCheckIcon, BadgeHelpIcon, BadgeMinusIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { LayerGroup, MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';
import './Map.css';
import { DataLog, Datalogger } from './Types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';

let loggerIcon = new Icon({
  iconUrl: "src/assets/meter.png",
  iconSize: [30, 30],
})

function DisplayPosition({ map }) {
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
    <>Coordinates: {position.lat.toFixed('6')}°, {position.lng.toFixed('6')}°</>
  )
}

function LoggerMapCard() {
  const [loading, setLoading] = useState(true)
  const [loggersInfo, setLoggersInfo] = useState([])
  const [latestLogs, setLatestLogs] = useState([])
  const [loggersLatest, setLoggersLatest] = useState(new Map())
  const [map, setMap] = useState(null)


  // Initial load
  useEffect(() => {
    async function fetchData() {
      try {
        const loggersInfoResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/logger/`)
        const latestLogsResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/latest_log/`)
        setLoggersInfo(loggersInfoResponse.data)
        setLatestLogs(latestLogsResponse.data)
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
      finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // const displayMap = useMemo(() => (
  const displayMap = (() => (
    <MapContainer // @ts-ignore
      center={[13.58438280013, 123.2738403740]} ref={setMap} scrollWheelZoom={true} zoom={13.5} maxZoom={17} minZoom={13} style={{ height: '70vh' }} maxBounds={[[13.649076, 123.167956], [13.494945, 123.387211]]}>
      <TileLayer
        // url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" // @ts-ignore
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {/* Marker(Label) Layer */}
      <LayerGroup>
        {loggersLatest.size ?
          <>
            {Array.from(loggersLatest, ([loggerId, loggerData]) => (
              <div key={loggerId}>
                <Marker position={[loggerData.Latitude, loggerData.Longitude]} icon={loggerIcon}>
                  <Tooltip permanent direction={'top'}>
                    {loggerData.CurrentPressure ? <>{loggerData.CurrentPressure}<em> psi</em></> : "---"}<br />
                    {loggerData.CurrentFlow ? <>{loggerData.CurrentFlow}<em> lps</em></> : "---"}
                  </Tooltip>
                </Marker>
                <Marker position={[loggerData.Latitude, loggerData.Longitude]} icon={new DivIcon({ iconSize: [0, 0] })}>
                  <Tooltip permanent direction='bottom'>{loggerData.Name.replaceAll('-',' ').split('_').slice(2)}</Tooltip>
                </Marker>
              </div>
            ))}
          </>
          : null
        }

        {/* {loggersInfo.length ? <>{loggersInfo.map((logger: Datalogger, indexLogger) => (
        <>
          <Marker position={[logger.Latitude, logger.Longitude]} icon={loggerIcon} key={indexLogger} >
            {latestLogs.map((log: DataLog, indexLog) => (
              <>{logger.LoggerId == log.LoggerId ?
                <Tooltip permanent direction={'top'} key={indexLog}>
                  <>
                    Pressure: {log.CurrentPressure ?? "N/A"}<br />
                    Flow: {log.CurrentFlow ?? "N/A"} 
                  </>
                </Tooltip>
                : null}</>
            ))}
          </Marker>
          <Marker position={[logger.Latitude, logger.Longitude]} icon={new DivIcon({iconSize: [0, 0]})}>
            <Tooltip permanent direction='bottom'>{log.LoggerId}</Tooltip>
          </Marker>
        </>
      ))}</> : <></>} */}
      </LayerGroup>
    </MapContainer>
  ))


  return (
    <>
      <Card className='col-span-full xl:col-span-9 z-0' >
        <CardHeader className='rounded-t-lg bg-piwad-lightblue-600'>
          <CardTitle className='text-slate-950'>
            <div className="grid grid-cols-6">
              <div className="col-span-6 md:col-span-2">
                <p className="mb-1 text-piwad-lightyellow-300">Data Logger Map</p>
                <Separator className='mt-2 w-11/12' />
                <p className="text-base text-slate-200 mb-2">{map ? <DisplayPosition map={map} /> : null}</p>
              </div>
              <div className="col-span-6  lg:col-span-4 flex items-center space-x-4 rounded-md border-2 border-piwad-yellow-0 p-3 mb-0 ">
                <div className="grid grid-cols-9 flex-1 space-y-1 ">
                  <div className="text-piwad-yellow-50 text-lg md:text-xl font-medium co leading-none col-span-full justify-center sm:justify-normal sm:col-span-2 flex items-center">
                    Logger Status:</div>
                  <div className="text-white text-base md:text-xl font-medium leading-none col-span-3 justify-center sm:justify-normal sm:col-span-2 flex items-center">
                    {5}&nbsp;<BadgeCheckIcon color='lightgreen' />&nbsp;Active</div>
                  <div className="text-white text-base md:text-xl font-medium leading-none col-span-3 justify-center sm:justify-normal sm:col-span-2 flex items-center">
                    {0}&nbsp;<BadgeMinusIcon color='red' />&nbsp;Disabled</div>
                  <div className="text-white text-base md:text-xl font-medium leading-none col-span-3 justify-center sm:justify-normal sm:col-span-2 flex items-center">
                    {2}&nbsp;<BadgeHelpIcon color='yellow' />&nbsp;Unknown</div>
                  {/* <p className="text-sm text-muted-foreground">
                    Send notifications to device.
                  </p> */}
                </div>
              </div>
            </div>
          </CardTitle>
          {/* <CardDescription>

              </CardDescription> */}
        </CardHeader>
        <Separator className='mb-4' />
        <CardContent>
          {/* <MapContainer // @ts-ignore
            center={[13.58438280013, 123.2738403740]} ref={setMap} scrollWheelZoom={false} zoom={13.5} maxZoom={17} minZoom={13} style={{ height: '70vh' }} maxBounds={[[13.649076, 123.167956], [13.494945, 123.387211]]}>
            <TileLayer
              // url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" // @ts-ignore
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </MapContainer> */}
          {displayMap()}
        </CardContent>
      </Card>

    </>
  )
}

export default LoggerMapCard;