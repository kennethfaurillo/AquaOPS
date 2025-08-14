import proposed_site from '@/assets/geoProposedWellSite.json';
import { capitalize } from '@/lib/utils';
import { Icon, Layer, Marker } from "leaflet";
import React from 'react';
import { GeoJSON, LayersControl } from "react-leaflet";
import icProposedWellsite from '../../assets/button.png';

type ProposedSiteProperties = {
    id: number;
    ves: string;
    location: string;
}
export const proposedWellsiteIcon = new Icon({
    iconUrl: icProposedWellsite,
    iconSize: [10, 10]
})

const ProposedSiteLayer = React.memo(() => {
    const { Overlay } = LayersControl
    const onEachProposedWellsite = (feature: GeoJSON.Feature<GeoJSON.Geometry, ProposedSiteProperties>, layer: Layer) => {
        (layer as Marker).setIcon(proposedWellsiteIcon)
        layer.bindTooltip('Proposed Well Site: ' + capitalize(feature.properties?.location.toUpperCase()) + '\n', { direction: 'top' })
    }
    return (
        <Overlay name='Proposed Well Sites' checked>
            <GeoJSON data={proposed_site as GeoJSON.FeatureCollection} onEachFeature={onEachProposedWellsite} />
        </Overlay>
    )
});

export default ProposedSiteLayer;
