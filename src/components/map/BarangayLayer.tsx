import brgyBoundary from '@/assets/geoBoundary.json';
import { Layer } from "leaflet";
import React from 'react';
import { GeoJSON, LayersControl } from "react-leaflet";
import { toast } from "sonner";

type BrgyProperties = {
    OBJECTID: number;
    Name: string;
    Population: number;
    Brgy_SqrKm: number;
    HHPop_male: number;
    HHPop_wome: number;
    No_HH: number;
    Ecosystem_: string;
    AREA: number;
    id_1: null
}

const BarangayLayer = React.memo(() => {
    const { Overlay } = LayersControl
    const onEachBrgy = (feature: GeoJSON.Feature<GeoJSON.Geometry, BrgyProperties>, layer: Layer) => {
        if (feature.properties && feature.properties.Name) {
            layer.on('dblclick', () => {
                toast.info(`Barangay ${feature.properties?.Name}`)
            });
        }
    }
    return (
        <Overlay name='Barangay Boundaries'>
            <GeoJSON data={brgyBoundary as GeoJSON.FeatureCollection} style={{ fillOpacity: 0, weight: 1, color: 'orange' }} onEachFeature={onEachBrgy} />
        </Overlay>
    )
});

export default BarangayLayer;