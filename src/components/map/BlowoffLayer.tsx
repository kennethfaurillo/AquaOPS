import blowoff from '@/assets/geoBlowOff.json';
import { Icon, Layer, Marker } from "leaflet";
import React from 'react';
import { GeoJSON, LayersControl } from "react-leaflet";
import icValve from '../../assets/Tube.svg';

type BlowoffProperties = {
    id: number;
    size: string;
    location: string;
    "year insta": string;
    "blow off v": string
}

export const valveIcon = new Icon({
    iconUrl: icValve,
    iconSize: [7, 7],
})

const BlowoffLayer = React.memo(() => {
    const { Overlay } = LayersControl
    const onEachBlowOff = (feature: GeoJSON.Feature<GeoJSON.Geometry, BlowoffProperties>, layer: Layer) => {
        (layer as Marker).setIcon(valveIcon);
        layer.bindTooltip('Blow-off Valve: ' + feature.properties?.location.toUpperCase() + '\n' + feature.properties?.size, { direction: 'top' })
    }
    return (
        <Overlay name='Blow-off Valves'>
            <GeoJSON data={blowoff as GeoJSON.FeatureCollection} style={{ fillOpacity: 0, weight: 1, color: 'violet' }} onEachFeature={onEachBlowOff} />
        </Overlay>
    )
});

export default BlowoffLayer;
