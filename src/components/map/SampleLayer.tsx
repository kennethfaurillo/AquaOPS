import { usePocketBaseContext } from '@/hooks/usePocketbase'
import { testSample } from '@/lib/utils'
import React from 'react'
import { Circle, LayerGroup, LayersControl } from 'react-leaflet'
import { toast } from 'sonner'

export const SampleLayer = React.memo(() => {
    const { Overlay } = LayersControl
    const { samplingPoints } = usePocketBaseContext()

    return (
        !samplingPoints.length ? null :
            <Overlay name='Chlorine Samples'>
                <LayerGroup>
                    {samplingPoints.map((samplingPoint) => {
                        let descString = "Not yet sampled"
                        let isPass = undefined
                        if (samplingPoint.expand?.samples) {
                            isPass = true
                            descString = "Samples:\n"
                            samplingPoint.expand.samples.map((sample) => {
                                descString += `${sample.value} ppm\n`
                            })
                            if (!testSample(samplingPoint.expand.samples.at(-1))) {
                                isPass = false
                            }
                        }
                        return (
                            <div key={samplingPoint.id}>
                                <Circle center={[+samplingPoint.coordinates.lat, +samplingPoint.coordinates.lon]} radius={300} pathOptions={{ color: isPass ? 'lightGreen' : isPass === false ? 'red' : 'teal', stroke: false, fillOpacity: 0.2 }}
                                    eventHandlers={{
                                        click: () => {
                                            if (isPass) {
                                                return toast.success("Sampling Point: " + samplingPoint.name, { description: descString })
                                            } else if (isPass === false) {
                                                return toast.error("Sampling Point: " + samplingPoint.name, { description: descString })
                                            }
                                            return toast.info("Sampling Point: " + samplingPoint.name, { description: descString })
                                        },
                                    }} />
                                {samplingPoint.expand.samples?.map((sample) => {
                                    let isPass = testSample(sample) ? true : false
                                    return <Circle key={sample.id} center={[+sample.coordinates.lat, +sample.coordinates.lon]} radius={10} pathOptions={{ color: isPass ? 'lightGreen' : isPass === false ? 'red' : 'teal', stroke: false, fillOpacity: 1 }} />
                                })}
                            </div>
                        )
                    })}
                </LayerGroup>
            </Overlay>
    )
})
