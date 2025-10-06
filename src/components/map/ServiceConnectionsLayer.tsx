import serviceConn from '@/assets/geoServiceConn.json';
import { Icon, Layer, Marker } from "leaflet";
import React from 'react';
import { GeoJSON, LayersControl } from "react-leaflet";
import { toast } from "sonner";
import icConn from '../../assets/conn.png';


export const valveIcon = new Icon({
    iconUrl: icConn,
    iconSize: [9, 9],
})

type ServiceConnectionProperties = {
    id: number;
    name: string;
    tel: number;
    hh_members: number;
    male: number;
    female: number;
    address: string;
}

export const ServiceConnectionsLayer = React.memo(() => {
    const { Overlay } = LayersControl
    const onEachConn = (feature: GeoJSON.Feature<GeoJSON.Geometry, ServiceConnectionProperties>, layer: Layer) => {
        (layer as Marker).setIcon(valveIcon);
        layer.bindTooltip('Service Connection: ' + feature.properties?.name.toUpperCase() + '\n' + feature.properties?.address, { direction: 'top' })
        layer.on('click', () => {
            toast.info(`Service Connection ${feature.properties?.name} has ${feature.properties?.hh_members} members at ${feature.properties?.address}`);
        });
    }
    return (
        <Overlay name='Service Connections'>
            <GeoJSON data={serviceConn as GeoJSON.FeatureCollection} style={{ fillOpacity: 0, weight: 1, color: 'orange' }} onEachFeature={onEachConn} />
        </Overlay>
    )
});
