import hydrants from '@/assets/geoHdyrant.json';
import { capitalize } from '@/lib/utils';
import { Icon, Layer, Marker } from "leaflet";
import moment from 'moment';
import React from 'react';
import { GeoJSON, LayersControl } from "react-leaflet";
import icHydrant from '../../assets/Hydrant.svg';

export const hydrantIcon = new Icon({
    iconUrl: icHydrant,
    iconSize: [10, 10],
})
type HydrantProperties = {
    id: number;
    size: string;
    type: string;
    location: string;
    "year inst.": string;
    altitude: string;
}

const HydrantLayer = React.memo(() => {
    const { Overlay } = LayersControl
    const onEachHydrant = (feature: GeoJSON.Feature<GeoJSON.Geometry, HydrantProperties>, layer: Layer) => {
        (layer as Marker).setIcon(hydrantIcon)
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
    return (
        <Overlay name='Fire Hydrants' checked>
            <GeoJSON data={hydrants as GeoJSON.FeatureCollection} onEachFeature={onEachHydrant} />
        </Overlay>
    )
});

export default HydrantLayer;