import pipelines from '@/assets/geoPipeline.json';
import { capitalize } from '@/lib/utils';
import { Layer } from 'leaflet';
import React from 'react';
import { GeoJSON, LayersControl } from 'react-leaflet';
import { toast } from 'sonner';
import { Basemap } from './utils';

type PipelineProperties = {
    ogr_fid: number;
    size: string;
    location: string;
    status: string;
    lenght: string;
    "year inst.": string;
    area: string;
    layer: string;
    type_size: string;
};

function getPipeColor(size: string) {
    switch (size) {
        case '32mm':
            return '#65aff5';
        case '50mm':
            return '#f20a82';
        case '75mm':
            return '#3ff9ff';
        case '100mm':
            return '#a1e751';
        case '150mm':
            return '#8879eb';
        case '200mm':
            return '#d674ee';
        case '250mm':
            return '#def31e';
        case '300mm':
            return '#eacb50';
        default:
            return '#000000';
    }
}

export const PipelineLayer = React.memo(({ basemap, weight = 2 }: { basemap: Basemap | undefined, weight?: number }) => {
    const { Overlay } = LayersControl

    const onEachPipeline = (feature: GeoJSON.Feature<GeoJSON.Geometry, PipelineProperties>, layer: Layer) => {
        layer.bindTooltip(`Pipeline: ${feature.properties?.location.toUpperCase()}`, { direction: 'center' })
        if (feature.properties && feature.properties.ogr_fid) {
            layer.on('click', () => {
                toast.info(`Pipeline #${feature.properties?.ogr_fid} ${capitalize(feature.properties?.location)}`, {
                    description: <>
                        <span>Size: {feature?.properties.size}</span>
                        <span> | Length: {feature?.properties.lenght.replace('.', '')}</span>
                        <div>
                            {feature.properties["year inst."] ? <>Install Date: {feature.properties["year inst."].toUpperCase()}</> : <span>{null}</span>}
                        </div>
                    </>,
                })
            });
        }
    }
    return (
        <Overlay name='Pipelines' checked>
            <GeoJSON data={pipelines as GeoJSON.FeatureCollection} style={(feature) => ({
                color: basemap?.name === "stdDark" ? getPipeColor(feature?.properties.size) : "#58D68D90",
                weight: weight,
            })}
                onEachFeature={onEachPipeline}
            />
        </Overlay>
    )
}, (prevProps, nextProps) => {
    // Only re-render if the basemap changes or weight changes
    return prevProps.basemap?.name === nextProps.basemap?.name && prevProps.weight === nextProps.weight;
});