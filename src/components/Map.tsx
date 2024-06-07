import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import axios, {AxiosResponse} from 'axios'

function Map() {
  return (
    <>
      <MapContainer // @ts-ignore
      center={[13.58438280013, 123.2738403740]} scrollWheelZoom={false} zoom={13.5} maxZoom={17} minZoom={13} style={{ height: '70vh' }} maxBounds={[[13.649076, 123.167956], [13.494945, 123.387211]]}>
        <TileLayer 
          // url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" // @ts-ignore
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
      </MapContainer>
    </>
  )
}

export default Map;