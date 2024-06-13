import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import axios, { AxiosResponse } from 'axios'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BadgeCheckIcon, BadgeHelpIcon, BadgeMinusIcon, Loader2Icon, } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator'

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
    <>Coordinates: {position.lat.toFixed('6')}, {position.lng.toFixed('6')}</>
  )
}

function Map() {
  const [loading, setLoading] = useState(true)
  const [loggerInfo, setLoggerInfo] = useState([])
  const [latestLogs, setLatestLogs] = useState([])
  const [map, setMap] = useState(null)


  // Initial load
  useEffect(() => {
    async function fetchData() {
      axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/logger/`).then(response => {
        setLoggerInfo(response.data)
        console.log(response.data)
      }, error => {
        console.log(error.toString())
      }).finally(() => {
        setLoading(false)
      })

      axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/latest_log/`).then(response => {
        setLatestLogs(response.data)
        console.log(response.data)
      }, error => {
        console.log(error.toString())
      }).finally(() => {
        setLoading(false)
      })
    }
    fetchData()
  }, [])

  const displayMap = useMemo(() => (
    <MapContainer // @ts-ignore
      center={[13.58438280013, 123.2738403740]} ref={setMap} scrollWheelZoom={true} zoom={13.5} maxZoom={17} minZoom={13} style={{ height: '70vh' }} maxBounds={[[13.649076, 123.167956], [13.494945, 123.387211]]}>
      <TileLayer
        // url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" // @ts-ignore
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
    </MapContainer>
  ), [])


  return (
    <>
      <Card className='col-span-full xl:col-span-9 z-0' >
        <CardHeader className='rounded-t-lg bg-piwad-lightblue'>
          <CardTitle className='text-slate-950'>
            <div className="grid grid-cols-6">
              <div className="col-span-6 md:col-span-2">
                <p className="mb-1">Data Logger Map</p>
                <Separator className='mt-2 w-11/12'/>
                <p className="text-base text-slate-200 mb-2">{map ? <DisplayPosition map={map}/>: null}</p>
              </div>
              <div className="col-span-6  lg:col-span-4 flex items-center space-x-4 rounded-md border p-3 mb-0 bg-piwad-lightyellow">
                <div className="grid grid-cols-9 flex-1 space-y-1 ">
                  <div className="text-lg md:text-xl font-medium leading-none col-span-full justify-center sm:justify-normal sm:col-span-2 flex items-center">
                    Logger Status:</div>
                  <div className="text-base md:text-xl font-medium leading-none col-span-3 justify-center sm:justify-normal sm:col-span-2 flex items-center">
                    {5}&nbsp;<BadgeCheckIcon color='green' />&nbsp;Active</div>
                  <div className="text-base md:text-xl font-medium leading-none col-span-3 justify-center sm:justify-normal sm:col-span-2 flex items-center">
                    {0}&nbsp;<BadgeMinusIcon color='red' />&nbsp;Disabled</div>
                  <div className="text-base md:text-xl font-medium leading-none col-span-3 justify-center sm:justify-normal sm:col-span-2 flex items-center">
                    {2}&nbsp;<BadgeHelpIcon color='black' />&nbsp;Unknown</div>
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
          {displayMap}
        </CardContent>
      </Card>

    </>
  )
}

export default Map;