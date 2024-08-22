import axios from 'axios'
import { Loader2Icon } from 'lucide-react'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Label, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Separator } from './ui/separator'

const colorMap = {
    AverageVoltage: "text-red-500",
    CurrentPressure: "text-[#73d25f]",
    CurrentFlow: "text-blue-700",
    TotalFlowPositive: "text-green-400",
    TotalFlowNegative: "text-indigo-600",
    DailyFlowPositive: "text-green-500",
    DailyFlowNegative: "text-[#e70077]",
}

const CustomCombinedLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-zinc-100/90 flex flex-col gap-0 rounded-md backdrop-blur-sm drop-shadow-lg" key={label}>
                <p className="text-black text-sm font-medium">{moment(payload[0]?.payload?.LogTime.slice(0, -1), true).format('ddd, MMM D h:mm a')}</p>
                <Separator className='bg-slate-300 my-1' />
                {payload.map((val, index) => (
                    <div key={index}>
                        <p className={`${colorMap[val.dataKey]} font-semibold`}>
                            {val.dataKey == 'CurrentPressure' ? 'Pressure:' : null}
                            {val.dataKey == 'CurrentFlow' ? 'Flow:' : null}
                            {val.dataKey == 'AverageVoltage' ? 'Voltage:' : null}
                            <span className="ml-2">{val.value} <em>{val.unit}</em></span>
                        </p>
                    </div>
                ))}
            </div>
        )
    }
}

const CustomTotalizerBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-zinc-100/90 flex flex-col gap-0 rounded-md backdrop-blur-sm drop-shadow-lg" key={label}>
                <p className="text-black text-sm font-medium">{moment(label).format('ddd, MMMM D YYYY')}</p>
                <Separator className='bg-slate-300 my-1' />
                {payload.map((val, index) => (
                    <div key={index}>
                        <p className={`${colorMap[val.dataKey]} font-semibold`}>
                            {val.dataKey == 'DailyFlowPositive' ? "Total Positive Flow" : "Total Negative Flow"}:
                            <span className="ml-2">{val.value} <em>{val.unit}</em></span>
                        </p>
                    </div>
                ))}
            </div>
        )
    }
}

const LOG_COUNT = 12

function LogLineChart(props) {
    const [logData, setLogData] = useState([])
    const [totalizerData, setTotalizerData] = useState([])
    const [filteredLogData, setFilteredLogData] = useState([])
    const [loading, setLoading] = useState(true)
    const [hideLine, setHideLine] = useState({
        CurrentPressure: false,
        CurrentFlow: false,
        AverageVoltage: true,
        totalizerPositive: false,
        totalizerNegative: false,
    })
    const timeRange = props.timeRange
    // TODO: fix logger table onclick
    const loggerType = props.logger.Type ? props.logger.Type.split(',') : props.logger.Name.toLowerCase().includes("pressure") ? "pressure" : "flow"
    const [average, setAverage] = useState({})

    useEffect(() => {
        const fetchData = async () => {
            // { console.log(window.innerWidth) }
            let logResponse = null
            let totalizerResponse = null
            if (loggerType.includes('pressure') && loggerType.includes('flow')) {
                logResponse = await axios.post(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/logs/`, {
                    logTypes: loggerType,
                    loggerId: props.logger.LoggerId
                })
                totalizerResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/totalizer/${props.logger.LoggerId}`)
            } else if (loggerType.includes('pressure')) {
                logResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/pressure_log/${props.logger.LoggerId}`)
            } else if (loggerType.includes('flow')) {
                logResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/flow_log/${props.logger.LoggerId}`)
                totalizerResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/totalizer/${props.logger.LoggerId}`)
            } else {
                console.log("Unknown Datalogger")
                console.log(JSON.stringify(props.logger))
            }
            if (totalizerResponse?.data.length) {
                setTotalizerData(totalizerResponse.data)
            }
            if (Object.keys(logResponse.data)) {
                // Filter logs here
                setLogData(logResponse.data)
                setFilteredLogData(logResponse.data.slice(-timeRange * LOG_COUNT))
            } else {
                setLogData([])
                console.log("NO LOGS")
            }
            setLoading(false)
        }
        fetchData()
    }, [])

    // update filtered data when selected timerange changes
    useEffect(() => {
        if (logData) {
            const _filteredLogData = logData.slice(-timeRange * LOG_COUNT)
            setFilteredLogData(_filteredLogData)
        }
    }, [timeRange])

    // update average value
    useEffect(() => {
        if (!filteredLogData.length) return
        let tempAvg = {}
        if (loggerType.includes("pressure")) {
            tempAvg = { pressure: getAvg(filteredLogData, 'pressure') }
        }
        if (loggerType.includes("flow")) {
            tempAvg = { ...tempAvg, flow: getAvg(filteredLogData, 'flow') }
        }
        setAverage(tempAvg)
    }, [filteredLogData])

    const getAvg = (data, datakey) => {
        if (datakey == 'pressure') {
            datakey = 'CurrentPressure'
        } else if (datakey == 'flow') {
            datakey = 'CurrentFlow'
        }
        return (data.reduce((acc, curr) => acc + curr[datakey], 0) / data.length).toFixed(2)
    }

    return (
        <> {!loading ? <>
            {loggerType.includes('flow') && logData.length ?
                <ResponsiveContainer width={"95%"} height={150} className={"mx-auto mb-4"}>
                    <BarChart data={totalizerData}>
                        <XAxis dataKey={'Date'} tick={{ fontSize: 12 }} tickFormatter={timeStr => moment(timeStr).format('MMM D')} />
                        <YAxis width={30} tick={{ fontSize: 10 }} domain={[-10, 'dataMax + 5']} allowDataOverflow />
                        <CartesianGrid strokeDasharray={"5 10"} />
                        <Legend />
                        <Tooltip content={<CustomTotalizerBarTooltip />} />
                        <Bar dataKey={'DailyFlowPositive'}
                            name={"Totalizer Positive"}
                            fill='#22c55e'
                            unit={'m³'}
                            type={'monotone'}
                            stackId={1} />
                        <Bar dataKey={'DailyFlowNegative'}
                            name={"Totalizer Negative"}
                            fill='#e70077'
                            unit={'m³'}
                            type={'monotone'}
                            stackId={1} />
                    </BarChart>
                </ResponsiveContainer>
                : <></>
            }
            <ResponsiveContainer width={"95%"} height={!props.logger.CurrentFlow ? 550 : 400} className={"self-center "}>
                <LineChart height={200} data={filteredLogData}  >
                    <XAxis dataKey={'LogTime'} tick={{ fontSize: 12 }} tickFormatter={timeStr => moment(timeStr).utcOffset('+0000').format('h:mm a')} />
                    <YAxis width={30} tick={{ fontSize: 10 }} domain={[-10, 'dataMax + 5']} allowDataOverflow />
                    <CartesianGrid strokeDasharray={"5 10"} />
                    <Legend onClick={(e) =>
                        setHideLine({
                            ...hideLine,
                            [e.dataKey]: !hideLine[e.dataKey]
                        })
                    } />
                    <Tooltip content={<CustomCombinedLineTooltip />} />
                    <div className='text-blue-500' />
                    {props.logger.CurrentPressure != null ?
                        <>
                            {average.pressure ? <ReferenceLine y={average.pressure} stroke='#73d25f' strokeOpacity={.3}><Label position={'insideBottomLeft'}>{`Average Pressure: ${average.pressure}`}</Label></ReferenceLine> : null}
                            <Line dataKey={'CurrentPressure'}
                                name={"Pressure"}
                                stroke='#73d25f'
                                type={'monotone'}
                                unit={'psi'}
                                dot={false}
                                hide={hideLine['CurrentPressure']} />
                        </> : null
                    }
                    {props.logger.CurrentFlow != null ?
                        <>
                            {average.flow ? <ReferenceLine y={average.flow} stroke='#3B82F6' strokeOpacity={.3}> <Label position={'insideTopRight'} className='text-red-500'>{`Average Flow: ${average.flow}`}</Label></ReferenceLine> : null}
                            <Line dataKey={'CurrentFlow'}
                                name={"Flow"}
                                stroke='#3B82F6'
                                type={'monotone'}
                                unit={'lps'}
                                dot={false}
                                hide={hideLine['CurrentFlow']} />
                        </> : null
                    }
                    <Line dataKey={'AverageVoltage'}
                        name={"Voltage"}
                        stroke='red'
                        type={'monotone'}
                        unit={'V'}
                        dot={false}
                        hide={hideLine['AverageVoltage']} />
                </LineChart>
            </ResponsiveContainer>
        </> : <Loader2Icon className="animate-spin self-center size-12 my-5" />}
        </>
    )
}

export default LogLineChart