import axios from 'axios';
import { Icon } from 'leaflet';
import React, { useEffect, useState } from 'react';
import { LayerGroup, LayersControl, Marker, Popup } from 'react-leaflet';
import { toast } from 'sonner';
import icSurface from '../../assets/Filter.svg';
import icStation from '../../assets/Station.svg';
import icSpring from '../../assets/Tank.svg';
import { Source } from '../Types';

const StationIcon = new Icon({
    iconUrl: icStation,
    iconSize: [22, 22],
})

const springIcon = new Icon({
    iconUrl: icSpring,
    iconSize: [24, 24],
})

const surfaceIcon = new Icon({
    iconUrl: icSurface,
    iconSize: [24, 24],
})

function SourceMarker({ source }: { source: Source }) {
    let icon;
    let iconImg;

    switch (source.Type) {
        case 'well':
            icon = StationIcon;
            iconImg = icStation;
            break;
        case 'spring':
            icon = springIcon;
            iconImg = icSpring;
            break;
        case 'surface':
            icon = surfaceIcon;
            iconImg = icSurface;
            break;
        default:
            icon = StationIcon; // default icon
            iconImg = icStation;
    }

    return (
        <Marker position={[source.Latitude, source.Longitude]} icon={icon}>
            <Popup className='custom-popup'>
                <div className="popup-container">
                    <div className="popup-header flex space-x-2">
                        <img src={iconImg} alt="Icon" className="size-6" />
                        <div className='my-auto'>
                            {source.Type === 'well' ? `PS ${source.SourceIdNo} ` : ''}{source.Name}
                        </div>
                    </div>
                    <div className="popup-content">
                        <div><strong>Water Permit:</strong> {source.WaterPermitNo}</div>
                        <div><strong>Capacity:</strong> {source.Capacity} <em>lps</em></div>
                        {source.Type === 'well' && (
                            <>
                                <div><strong>HP Rating:</strong> {source.HpRating} <em>hp</em></div>
                                <div><strong>Supply Voltage:</strong> {source.SupplyVoltage} <em>V</em></div>
                            </>
                        )}
                    </div>
                </div>
            </Popup>
        </Marker>
    );
}

export const SourceLayer = React.memo(() => {
    const { Overlay } = LayersControl
    const [sources, setSources] = useState<Source[]>([])

    async function fetchSources() {
        try {
            const sourceInfo = await axios.get(`${import.meta.env.VITE_API}/api/source/`, { withCredentials: true })
            setSources(sourceInfo.data)
        } catch (error) {
            console.error("Failed to fetch sources:", error);
            toast.error("Failed to fetch water sources. Please try again later.");
        }
    }

    useEffect(() => {
        fetchSources()
    }, [])

    if (!sources.length) {
        return null
    }

    return (
        <Overlay name='Water Sources' checked>
            <LayerGroup>
                {sources.length ?
                    sources.map((source: Source) => (
                        <div key={source.SourceId}>
                            <SourceMarker source={source} />
                        </div>
                    )) : null}
            </LayerGroup>
        </Overlay>
    )
})