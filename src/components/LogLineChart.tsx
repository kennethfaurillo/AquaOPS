import axios from 'axios'
import { Loader2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const colorMap = {
    AverageVoltage: "text-red-500",
    CurrentPressure: "text-[#73d25f]",
    CurrentFlow: "text-blue-700",
    TotalFlowPositive: "text-green-400",
    TotalFlowNegative: "text-indigo-600"
}


const CustomCombinedLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-slate-700/60 flex flex-col gap-0 rounded-md backdrop-blur-sm">
                <p className="text-white text-lg">{label}</p>
                {payload.map((val) => (
                    <>
                        {console.log(val, colorMap[val.dataKey])}
                        <p className={`text-sm ${colorMap[val.dataKey]}`}>
                            {val.dataKey}:
                            <span className="ml-2">{val.value} <em>{val.unit}</em></span>
                        </p>
                    </>
                ))}
            </div>
        )
    }
}

const CustomTotalizerBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-slate-700/60 flex flex-col gap-0 rounded-md backdrop-blur-sm">
                <p className="text-white text-lg">{label}</p>
                {payload.map((val) => (
                    <>
                        {console.log(val, colorMap[val.dataKey])}
                        <p className={`text-sm ${colorMap[val.dataKey]}`}>
                            {val.dataKey}:
                            <span className="ml-2">{val.value} <em>{val.unit}</em></span>
                        </p>
                    </>
                ))}
            </div>
        )
    }
}

const samplePressureData = [
    { 'CurrentPressure': 24 },
    { 'CurrentPressure': 23 },
    { 'CurrentPressure': 21 },
    { 'CurrentPressure': 22 },
    { 'CurrentPressure': 23 },
    { 'CurrentPressure': 24 },
    { 'CurrentPressure': 25 },
    { 'CurrentPressure': 21 },
    { 'CurrentPressure': 22 },
    { 'CurrentPressure': 23 },
    { 'CurrentPressure': 24 },
    { 'CurrentPressure': 23 },
    { 'CurrentPressure': 21 },
    { 'CurrentPressure': 22 },
    { 'CurrentPressure': 23 },
    { 'CurrentPressure': 24 },
    { 'CurrentPressure': 25 },
    { 'CurrentPressure': 21 },
    { 'CurrentPressure': 22 },
    { 'CurrentPressure': 23 },
    { 'CurrentPressure': 24 },
    { 'CurrentPressure': 23 },
    { 'CurrentPressure': 21 },
    { 'CurrentPressure': 22 },
    { 'CurrentPressure': 23 },
    { 'CurrentPressure': 24 },
    { 'CurrentPressure': 25 },
    { 'CurrentPressure': 21 },
    { 'CurrentPressure': 22 },
    { 'CurrentPressure': 23 },
    { 'CurrentPressure': 22 },
    { 'CurrentPressure': 23 },
    { 'CurrentPressure': 24 },
    { 'CurrentPressure': 23 },
    { 'CurrentPressure': 21 },
    { 'CurrentPressure': 22 },
    { 'CurrentPressure': 23 },
    { 'CurrentPressure': 24 },
    { 'CurrentPressure': 25 },
    { 'CurrentPressure': 21 },
    { 'CurrentPressure': 22 },
    { 'CurrentPressure': 23 },
]

const sampleFlowData = [
    { 'CurrentFlow': 8 },
    { 'CurrentFlow': 10 },
    { 'CurrentFlow': 9 },
    { 'CurrentFlow': 7 },
    { 'CurrentFlow': 10 },
    { 'CurrentFlow': 8 },
    { 'CurrentFlow': 11 },
    { 'CurrentFlow': 10 },
    { 'CurrentFlow': 12 },
    { 'CurrentFlow': 8 },
    { 'CurrentFlow': 9 },
    { 'CurrentFlow': 10 },
    { 'CurrentFlow': 8 },
    { 'CurrentFlow': 10 },
    { 'CurrentFlow': 9 },
    { 'CurrentFlow': 7 },
    { 'CurrentFlow': 10 },
    { 'CurrentFlow': 8 },
    { 'CurrentFlow': 11 },
    { 'CurrentFlow': 10 },
    { 'CurrentFlow': 12 },
    { 'CurrentFlow': 8 },
    { 'CurrentFlow': 9 },
    { 'CurrentFlow': 10 },
    { 'CurrentFlow': 8 },
    { 'CurrentFlow': 10 },
    { 'CurrentFlow': 9 },
    { 'CurrentFlow': 7 },
    { 'CurrentFlow': 10 },
    { 'CurrentFlow': 8 },
    { 'CurrentFlow': 11 },
    { 'CurrentFlow': 10 },
    { 'CurrentFlow': 12 },
    { 'CurrentFlow': 8 },
    { 'CurrentFlow': 9 },
    { 'CurrentFlow': 10 },
    { 'CurrentFlow': 11 },
    { 'CurrentFlow': 10 },
    { 'CurrentFlow': 12 },
    { 'CurrentFlow': 8 },
    { 'CurrentFlow': 9 },
    { 'CurrentFlow': 10 },
]

function LogLineChart(props) {
    const [logData, setLogData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // console.log(logger)
        const fetchData = async () => {
            { console.log(window.innerWidth) }
            let logResponse = null
            if (props.logger.Name.toLowerCase().includes("pressure")) {
                logResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/pressure_log/${props.logger.LoggerId}`)
            } else if (props.logger.Name.toLowerCase().includes("flow")) {
                logResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/flow_log/${props.logger.LoggerId}`)
            } else {
                console.log("Unknown Datalogger")
                console.log(JSON.stringify(props.logger))
            }
            if (logResponse.data.length) {
                setLogData(logResponse.data.slice(-250))
            } else {
                setLogData([])
                console.log("NO LOGS")
            }
            setLoading(false)
            // console.log(logResponse.data.length)
        }
        fetchData()
    }, [])
    return (
        <> {!loading ? <>
            {props.logger.CurrentFlow ?
                <ResponsiveContainer width={"95%"} height={150} className={"mx-auto mb-4"}>
                    <BarChart data={logData}>
                        <XAxis />
                        <YAxis width={45} />
                        <CartesianGrid strokeDasharray={"5 10"} />
                        <Legend />
                        <Tooltip content={<CustomTotalizerBarTooltip />} />
                        <Bar dataKey={'TotalFlowPositive'}
                            name={"Totalizer Positive"}
                            fill='#4ADE80'
                            type={'monotone'}
                            stackId={1} />
                        <Bar dataKey={'TotalFlowNegative'}
                            name={"Totalizer Negative"}
                            fill='#4F46E5'
                            type={'monotone'}
                            stackId={1} />
                    </BarChart>
                </ResponsiveContainer>
                : <></>
            }
            <ResponsiveContainer width={"95%"} height={!props.logger.CurrentFlow ? 550 : 400} className={"self-center "}>
                <LineChart height={200} data={logData}  >
                    <XAxis domain={[0, 'datamax']} />
                    <YAxis width={30} />
                    <CartesianGrid strokeDasharray={"5 10"} />
                    <Legend />
                    <Tooltip content={<CustomCombinedLineTooltip />} />
                    <div className='text-blue-500' />
                    {props.logger.CurrentPressure ?
                        <Line dataKey={'CurrentPressure'}
                            name={"Pressure"}
                            stroke='#73d25f'
                            type={'monotone'}
                            unit={'psi'}
                            dot={false}
                        /> :
                        <Line data={samplePressureData}
                            dataKey={'CurrentPressure'}
                            name={"Pressure"}
                            label={"test"}
                            stroke='#73d25f'
                            type={'monotone'}
                            unit={'psi'}
                            dot={false} />
                    }
                    {props.logger.CurrentFlow ?
                        <Line dataKey={'CurrentFlow'}
                            name={"Flow"}
                            stroke='#3B82F6'
                            type={'monotone'}
                            unit={'lps'}
                            dot={false}
                        /> :
                        <Line data={sampleFlowData}
                            name={"Flow"}
                            stroke='#3B82F6'
                            dataKey={'CurrentFlow'}
                            type={'monotone'}
                            unit={'lps'}
                            dot={false} />
                    }
                    <Line dataKey={'AverageVoltage'}
                        name={"Voltage"}
                        stroke='red'
                        type={'monotone'}
                        unit={'V'}
                        dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </> : <Loader2Icon className="animate-spin self-center size-12 my-5" />}
        </>
    )
}

export default LogLineChart