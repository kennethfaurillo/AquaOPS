import { SamplingPoint } from '@/components/Types'
import axios from 'axios'
import PocketBase from 'pocketbase'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from './useAuth'

interface PocketBaseContextType {
    samplingPoints: SamplingPoint[]
}
let isInit = false

const PocketBaseContext = createContext<PocketBaseContextType | null>(null)

export function PocketBaseProvider({ children }: { children: React.ReactNode }) {
    const pb = useMemo(() => new PocketBase(import.meta.env.VITE_PB), [])
    const { isAuthenticated } = useAuth()
    const [samplingPoints, setSamplingPoints] = useState<SamplingPoint[]>([])

    // fetches auth record and token from PocketBase
    async function authPocketBase() {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API}/auth/login-crms`, { withCredentials: true })
            // console.log('PocketBase authenticated')
            const { record, token } = res.data
            pb.authStore.save(token, record)
            return true
        } catch (err) {
            toast.error('Error authenticating with CRMS')
            console.error('PocketBase auth error:', err)
            return false
        }
    }

    // fetches all sampling points from PocketBase
    async function fetchSamplingPoints() {
        try {
            const samplingPoints = await pb.collection('samplingPoints').getFullList<SamplingPoint>({ expand: 'samples,samplingLocations' })
            // console.log('Fetched sampling points from PocketBase')
            if (samplingPoints.length === 0) {
                throw new Error('No sampling points found in PocketBase')
            }
            samplingPoints.forEach((samplingPoint) => {
                if (samplingPoint.expand?.samplingLocations?.length) {
                    samplingPoint.coordinates = {
                        lat: samplingPoint.expand.samplingLocations[0].coordinates.lat,
                        lon: samplingPoint.expand.samplingLocations[0].coordinates.lon
                    }
                }
            })
            setSamplingPoints(samplingPoints)
        } catch (err) {
            toast.error('Error fetching Sampling Points from CRMS')
            console.error('Error fetching sampling points:', err)
        }
    }

    useEffect(() => {
        if (isInit) return // PocketBase already initialized, skip reconnection
        isInit = true
        
        if (!isAuthenticated) {
            // console.warn('User is not authenticated, skipping PocketBase auth and data fetch')
            return
        }

        async function init() {
            const authSuccess = await authPocketBase()
            if (authSuccess) {
                await fetchSamplingPoints()
            }
        }

        init()
    }, [])

    // set subscriptions to PocketBase realtime updates
    useEffect(() => {
        if (!isAuthenticated) {
            // console.warn('User is not authenticated, skipping PocketBase realtime subscription')
            return
        }
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