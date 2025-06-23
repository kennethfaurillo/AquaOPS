import axios from 'axios'
import { Loader2Icon } from 'lucide-react'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Label, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts'
import { Separator } from './ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

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
                            {val.dataKey == 'TotalFlowPositive' ? 'Totalizer Forward:' : null}
                            {val.dataKey == 'TotalFlowNegative' ? 'Totalizer Reverse:' : null}
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
                            {val.dataKey == 'DailyFlowPositive' ? "Daily Forward Flow" : "Daily Reverse Flow"}:
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
        Totalizer: true,
        TotalFlowPositive: true,
        TotalFlowNegative: true,
    })
    const timeRange = props.timeRange
    const loggerType = props.logger.Type ? props.logger.Type.split(',') : props.logger.Name.toLowerCase().includes("pressure") ? "pressure" : "flow"
    const [pressureStatistics, setPressureStatistics] = useState({})
    const [flowStatistics, setFlowStatistics] = useState({})

    useEffect(() => {
        const fetchData = async () => {
            let logResponse = null
            let totalizerResponse = null
            if (loggerType.includes('pressure') && loggerType.includes('flow')) {
                logResponse = await axios.post(`${import.meta.env.VITE_API}/api/logs/`, {
                    logTypes: loggerType,
                    loggerId: props.logger.LoggerId
                }, {withCredentials: true})
                totalizerResponse = await axios.get(`${import.meta.env.VITE_API}/api/totalizer/${props.logger.LoggerId}`, {withCredentials: true})
            } else if (loggerType.includes('pressure')) {
                logResponse = await axios.get(`${import.meta.env.VITE_API}/api/pressure_log/${props.logger.LoggerId}`, {withCredentials: true})
            } else if (loggerType.includes('flow')) {
                logResponse = await axios.get(`${import.meta.env.VITE_API}/api/flow_log/${props.logger.LoggerId}`, {withCredentials: true})
                totalizerResponse = await axios.get(`${import.meta.env.VITE_API}/api/totalizer/${props.logger.LoggerId}`, {withCredentials: true})
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
        if (loggerType.includes("pressure")) {
            const tempPressureStatistics = getStatistics(filteredLogData, 'pressure')
            setPressureStatistics(tempPressureStatistics)
        }
        if (loggerType.includes("flow")) {
            const tempFlowStatistics = getStatistics(filteredLogData, 'flow')
            setFlowStatistics(tempFlowStatistics)
        }
    }, [filteredLogData])

    const getStatistics = (datalogs, datakey) => {
        let stats = {
            avg: 0,
            min: datalogs.at(-1),
            max: datalogs.at(-1)
        }
        let lengthCounter = 0
        if (datakey == 'pressure') {
            datakey = 'CurrentPressure'
        } else if (datakey == 'flow') {
            datakey = 'CurrentFlow'
        }
        for (const datalog of datalogs) {
            if (!datalog[datakey]) {
                continue
            }
            if (datalog[datakey] > stats.max[datakey]) {
                stats.max = datalog
            }
            if (datalog[datakey] < stats.min[datakey]) {
                stats.min = datalog
            }
            stats.avg += datalog[datakey]
            lengthCounter++
            !datalog[datakey] ? console.log(datalog) : null
        }
        stats.avg = (stats.avg / lengthCounter).toFixed(2)
        return stats
    }

    function StatCard({ title, value, unit, timestamp }: { title: string, value: string, unit: string, timestamp?: string }) {
        return (
            <Card className='bg-piwad-blue-50 p-4'>
                <CardHeader className="flex flex-row items-center justify-between p-0 pb-1">
                    <CardTitle className="text-xs md:text-sm font-medium ">{title}</CardTitle>
                </CardHeader>
                <CardContent className='px-4 p-0'>
                    <div className="text-lg md:text-2xl font-bold">{value}<span className="text-sm font-medium ml-1"><em>{unit}</em></span></div>
                    <div className="text-xs text-muted-foreground mt-1">{timestamp ?? null}</div>
                </CardContent>
            </Card>
        )
    }

    return (
        <> {!loading ? <>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-4 mx-8">
                {loggerType.includes('pressure') && pressureStatistics.avg ?
                    <>
                        <StatCard title='Avg Pressure' value={pressureStatistics.avg} unit='psi' />
                        <StatCard title='Min Pressure' value={pressureStatistics.min['CurrentPressure']} unit='psi' timestamp={moment(pressureStatistics.min.LogTime.slice(0, -1)).format('YYYY-MM-DD H:mm A')} />
                        <StatCard title='Max Pressure' value={pressureStatistics.max['CurrentPressure']} unit='psi' timestamp={moment(pressureStatistics.max.LogTime.slice(0, -1)).format('YYYY-MM-DD H:mm A')} />
                    </> : null
                }
                {loggerType.includes('flow') && flowStatistics.avg ?
                    <>
                        <StatCard title='Avg Flow' value={flowStatistics.avg} unit='lps' />
                        <StatCard title='Min Flow' value={flowStatistics.min['CurrentFlow']} unit='lps' timestamp={moment(flowStatistics.min.LogTime.slice(0, -1)).format('YYYY-MM-DD H:mm A')} />
                        <StatCard title='Max Flow' value={flowStatistics.max['CurrentFlow']} unit='lps' timestamp={moment(flowStatistics.max.LogTime.slice(0, -1)).format('YYYY-MM-DD H:mm A')} />
                    </> : null
                }
            </div>
            {loggerType.includes('flow') && logData.length ?
                <ResponsiveContainer width={"95%"} height={150} className={"mx-auto"}>
                    <BarChart data={totalizerData}>
                        <XAxis dataKey={'Date'} tick={{ fontSize: 12 }} tickFormatter={timeStr => moment(timeStr).format('MMM D')} />
                        <YAxis width={30} tick={{ fontSize: 10 }} domain={[-10, 'dataMax + 5']} allowDataOverflow />
                        <CartesianGrid strokeDasharray={"5 10"} />
                        <Legend />
                        <ChartTooltip content={<CustomTotalizerBarTooltip />} />
                        <Bar dataKey={'DailyFlowPositive'}
                            name={"Daily Forward Flow"}
                            fill='#22c55e'
                            unit={'m³'}
                            type={'monotone'}
                            stackId={1} />
                        <Bar dataKey={'DailyFlowNegative'}
                            name={"Daily Reverse Flow"}
                            fill='#e70077'
                            unit={'m³'}
                            type={'monotone'}
                            stackId={1} />
                    </BarChart>
                </ResponsiveContainer>
                : <></>
            }
            <ResponsiveContainer width={"95%"} height={!props.logger.CurrentFlow ? 450 : 300} className={"self-center "}>
                <LineChart height={200} data={filteredLogData}  >
                    <XAxis dataKey={'LogTime'} tick={{ fontSize: 12 }} tickFormatter={timeStr => moment(timeStr).utcOffset('+0000').format('h:mm a')} />
                    <YAxis width={30} tick={{ fontSize: 10 }} domain={["dataMin-5", "auto"]} allowDecimals={false} allowDataOverflow={true} />
                    <ReferenceLine y={5} stroke="red" strokeDasharray={"3 3"}/>
                    <ReferenceLine y={0} stroke="gray" strokeDasharray={"3 3"}/>
                    <CartesianGrid strokeDasharray={"5 10"} />
                    <Legend onClick={(e) =>{
                        if(['TotalFlowPositive', 'TotalFlowNegative'].includes(e.dataKey)){
                            setHideLine({})
                        }
                        setHideLine({
                            ...hideLine,
                            [e.dataKey]: !hideLine[e.dataKey]
                        })}
                    } />
                    <ChartTooltip content={<CustomCombinedLineTooltip />} />
                    <div className='text-blue-500' />
                    {props.logger.Type.includes('pressure') ?
                        <>
                            <Line dataKey={'CurrentPressure'}
                                name={"Pressure"}
                                stroke='#73d25f'
                                type={'monotone'}
                                unit={'psi'}
                                dot={false}
                                hide={hideLine['CurrentPressure']} />
                        </> : null
                    }
                    {props.logger.Type.includes('flow') ?
                        <>
                            <Line dataKey={'CurrentFlow'}
                                name={"Flow"}
                                stroke='#3B82F6'
                                type={'monotone'}
                                unit={'lps'}
                                dot={false}
                                hide={hideLine['CurrentFlow']} />
                            <Line dataKey={'TotalFlowPositive'}
                                name={"Totalizer Forward"}
                                stroke='#22c55e'
                                type={'monotone'}
                                unit={'m³'}
                                dot={false}
                                hide={hideLine['TotalFlowPositive']} />
                            <Line dataKey={'TotalFlowNegative'}
                                name={"Totalizer Reverse"}
                                stroke='#4f46e5'
                                type={'monotone'}
                                unit={'m³'}
                                dot={false}
                                hide={hideLine['TotalFlowNegative']} /> 
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