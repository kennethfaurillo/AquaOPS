import { lerp } from '@/lib/utils';
import { BatteryFullIcon, BatteryLowIcon, BatteryMediumIcon, BatteryWarningIcon, EarthIcon, LucideIcon, MoonIcon, SunIcon } from 'lucide-react';

export type Basemap = {
    name: string,
    label: string,
    url: string,
    icon: LucideIcon
}

export const basemaps: Basemap[] = [
    {
        name: "osmLight",
        label: "Light Map",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        icon: SunIcon
    },
    {
        name: "stdDark",
        label: "Dark Map",
        url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
        icon: MoonIcon
    },
    {
        name: "arcSat",
        label: "Sat Map",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        icon: EarthIcon
    },
]

export const voltageIconMap = {
    full: <BatteryFullIcon color='green' className='size-4' />,
    high: <BatteryMediumIcon color='green' className='size-4' />,
    medium: <BatteryMediumIcon color='orange' className='size-4' />,
    low: <BatteryLowIcon color='red' className='size-4' />,
    critical: <BatteryWarningIcon color='red' className='size-4 animate-pulse' />
};

export function checkVoltage(voltage: number, voltageLimit: string): 'critical' | 'low' | 'medium' | 'high' | 'full' {
    let [min, max] = voltageLimit.split(',').map(Number)
    const perc = lerp(min, max, voltage)
    if (perc >= 83) {
        return 'full'
    } else if (perc >= 58) {
        return 'high'
    } else if (perc >= 33) {
        return 'medium'
    } else if (perc >= 16) {
        return 'low'
    } else {
        return 'critical'
    }
}

export function checkPressure(pressure: number, pressureLimit: string): 'red' | 'yellow' | 'normal' | 'invalid' {
    let [min, max] = pressureLimit.split(',').map((val) => +val)
    pressure = +pressure.toFixed(1)
    if (pressure < -10) {
        return 'invalid'
    }
    if (pressure >= max + 20) {
        return 'red'
    } else if (pressure >= max) {
        return 'yellow'
    } else if (pressure >= min) {
        return 'normal'
    } else if (pressure >= (min - 5)) {
        return 'yellow'
    } else {
        return 'red'
    }
}

export function pressureDisplay(currentPressure: number, pressureLimit: string) {
    const pressureClassMap = {
        red: '!text-red-500 font-bold animate-pulse',
        normal: '!text-piwad-blue-600 font-bold',
        yellow: '!text-yellow-600 font-bold',
        invalid: 'hidden'
    };
    if (pressureLimit == null)
        return <div className='font-bold'>{currentPressure.toFixed(1)} <em> psi</em><br /></div>
    return (
        <div className={pressureClassMap[checkPressure(currentPressure, pressureLimit)]}>
            <>{currentPressure.toFixed(1)}<em> psi</em><br /></>
        </div>)
}