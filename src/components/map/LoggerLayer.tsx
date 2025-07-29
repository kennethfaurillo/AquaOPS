import { DivIcon, Icon } from 'leaflet';
import moment from 'moment';
import React from 'react';
import { LayerGroup, LayersControl, Marker, Tooltip } from 'react-leaflet';
import icLogger from '../../assets/meter.png';
import { LoggerLog } from '../Types';
import { Tooltip as HoverTooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Basemap, checkVoltage, pressureDisplay, voltageIconMap } from './utils';
import { parseLoggerName } from '@/lib/utils';


export const loggerIcon = new Icon({
    iconUrl: icLogger,
    iconSize: [24, 24],
})

export const LoggerLayer = React.memo(({ loggersLatestData, basemap, onMarkerClick }: { loggersLatestData: Map<string, LoggerLog>, basemap: Basemap | undefined, onMarkerClick: (logger: LoggerLog) => void }) => {
    const { Overlay } = LayersControl
    return (
        <Overlay name='Data Loggers' checked>
            <LayerGroup>
                {loggersLatestData.size ?
                    <>
                        {Array.from(loggersLatestData, ([loggerId, loggerData]) =>
                        (
                            <div key={loggerId}>
                                <Marker position={[loggerData.Latitude, loggerData.Longitude]} icon={loggerIcon} eventHandlers={{
                                    click: () => onMarkerClick(loggerData)
                                }}>
                                    {!(loggerData?.Visibility.split(',').includes('map')) ? null : <Tooltip permanent direction={'top'} interactive={true}>
                                        <div className='text-slate-600 font-light text-[.55rem] drop-shadow-xl text-right'>
                                            {loggerData.LogTime ? <>{moment(loggerData.LogTime.replace('Z', ''), true).format('MMM D h:mm a')}<br /></> : null}
                                        </div>
                                        <div className='flex justify-between space-x-2'>
                                            {loggerData.CurrentPressure == null ? null :
                                                pressureDisplay(loggerData.CurrentPressure, loggerData.PressureLimit)
                                            }
                                            <HoverTooltip delayDuration={75}>
                                                <TooltipTrigger >
                                                    {loggerData.Type.includes('pressure') ? voltageIconMap[checkVoltage(loggerData.AverageVoltage, loggerData.VoltageLimit)] : null}
                                                </TooltipTrigger>
                                                <TooltipContent side='right' className='text-red-600 text-xs'>
                                                    <>
                                                        <strong>{loggerData.AverageVoltage} <em>V</em></strong>
                                                    </>
                                                </TooltipContent>
                                            </HoverTooltip>
                                        </div>
                                        <div className='flex justify-between space-x-2'>
                                            {loggerData.CurrentFlow == null ? null :
                                                <div className='font-bold'>{loggerData.CurrentFlow}<em> lps</em> </div>
                                            }
                                            <HoverTooltip delayDuration={75}>
                                                <TooltipTrigger >
                                                    {loggerData.Type.includes('flow') && !loggerData.Type.includes('pressure') ? voltageIconMap[checkVoltage(loggerData.AverageVoltage, loggerData.VoltageLimit)] : null}
                                                </TooltipTrigger>
                                                <TooltipContent side='right' className='text-red-600 text-xs'>
                                                    <>
                                                        <strong>{loggerData.AverageVoltage} <em>V</em></strong>
                                                    </>
                                                </TooltipContent>
                                            </HoverTooltip>
                                        </div>
                                    </Tooltip>}
                                </Marker>
                                <Marker position={[loggerData.Latitude, loggerData.Longitude]} icon={new DivIcon({ iconSize: [0, 0] })}>
                                    {basemap?.name == "stdDark" ?
                                        <div><Tooltip permanent direction='bottom' className='logger-label-dark'>{parseLoggerName(loggerData.Name)}</Tooltip></div> :
                                        <Tooltip permanent direction='bottom'>{parseLoggerName(loggerData.Name)}</Tooltip>
                                    }
                                </Marker>
                            </div>
                        ))}
                    </>
                    : null
                }
            </LayerGroup>
        </Overlay>
    )
}, (prevProps, nextProps) => {
    return prevProps.basemap?.name === nextProps.basemap?.name && prevProps.loggersLatestData === nextProps.loggersLatestData &&
        prevProps.onMarkerClick === nextProps.onMarkerClick;
});