import { Sample, SamplingPoint } from '@/components/Types'
import PocketBase from 'pocketbase'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

interface PocketBaseContextType {
    samplingPoints: SamplingPoint[]
}

const PocketBaseContext = createContext<PocketBaseContextType | null>(null)

export function PocketBaseProvider({ children }: { children: React.ReactNode }) {
    const pb = new PocketBase(import.meta.env.VITE_PB)
    const [samplingPoints, setSamplingPoints] = useState<SamplingPoint[]>([])
    function fetchSamplingPoints() {
        pb.collection('samplingPoints').getFullList<SamplingPoint>({ expand: 'samples,samplingLocations' }).then((samplingPoints) => {
            samplingPoints.forEach((samplingPoint) => {
                if (samplingPoint.expand?.samplingLocations?.length) {
                    samplingPoint.coordinates = {
                        lat: samplingPoint.expand.samplingLocations[0].coordinates.lat,
                        lon: samplingPoint.expand.samplingLocations[0].coordinates.lon
                    }
                }
            })
            setSamplingPoints(samplingPoints)
        })
    }
    
    useEffect(() => {
        fetchSamplingPoints()
        console.log('PocketBaseProvider mounted')
    }, [])

    useEffect(() => {
        try {
            pb.collection('samplingPoints').subscribe('*', (e) => {
                fetchSamplingPoints()
            })
        } catch (err) {
            console.error('PocketBase realtime error:', err)
        }
        return () => {
            pb.collection('samplingPoints').unsubscribe('*')
        }
    }, [])

    const value = useMemo(() => ({
        samplingPoints
    }), [samplingPoints])

    return (
        <PocketBaseContext.Provider value={value}>
            {children}
        </PocketBaseContext.Provider>
    )
}

export const usePocketBaseContext = () => {
    const context = useContext(PocketBaseContext)
    if (!context) {
        throw new Error('usePocketbaseContext must be used within a PocketbaseProvider')
    }
    return context
}
