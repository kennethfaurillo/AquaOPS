import specific_capacity from '@/assets/geoSpecificCapacity.json';
import { Layer } from "leaflet";
import React from 'react';
import { GeoJSON, LayersControl } from "react-leaflet";
import { toast } from "sonner";

type CapacityProperties = {
    id: number;
    cap: string;
}

const CapacityLayer = React.memo(() => {
    const { Overlay } = LayersControl
    const onEachCapacity = (feature: GeoJSON.Feature<GeoJSON.Geometry, CapacityProperties>, layer: Layer) => {
        layer.bindTooltip(feature.properties?.cap, { direction: 'center' })
        layer.on('dblclick', () => {
            toast.info(`Capacity: ${feature.properties?.cap}`)
        });
    }
    return (
        <Overlay name='Specific Capacity'>
            <GeoJSON data={specific_capacity as GeoJSON.FeatureCollection} style={{ fillOpacity: 0, weight: 1, color: 'violet' }} onEachFeature={onEachCapacity} />
        </Overlay>
    )
});

export default CapacityLayer;
