import axios from 'axios'
import { Loader2Icon } from 'lucide-react'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const colorMap = {
    AverageVoltage: "text-red-500",
    CurrentPressure: "text-[#73d25f]",
    CurrentFlow: "text-blue-700",
    TotalFlowPositive: "text-green-400",
    TotalFlowNegative: "text-indigo-600",
    DailyFlowPositive: "text-green-400",
    DailyFlowNegative: "text-indigo-600"
}


const CustomCombinedLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-slate-700/60 flex flex-col gap-0 rounded-md backdrop-blur-sm" key={label}>
                <p className="text-white text-lg">{(new Date(payload[0]?.payload?.LogTime.slice(0, -1))).toLocaleString()}</p>
                {payload.map((val, index) => (
                    <div key={index}>
                        {/* {console.log(val, colorMap[val.dataKey])} */}
                        <p className={`text-sm ${colorMap[val.dataKey]}`}>
                            {val.dataKey}:
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
            <div className="p-2 bg-slate-700/60 flex flex-col gap-0 rounded-md backdrop-blur-sm" key={label}>
                <p className="text-white text-lg">{(new Date(label)).toDateString()}</p>
                {payload.map((val, index) => (
                    <div key={index}>
                        {/* {console.log(val, colorMap[val.dataKey])} */}
                        <p className={`text-sm ${colorMap[val.dataKey]}`}>
                            {val.dataKey}:
                            <span className="ml-2">{val.value} <em>{val.unit}</em></span>
                        </p>
                    </div>
                ))}
            </div>
        )
    }
}

function LogLineChart(props) {
    const [logData, setLogData] = useState([])
    const [totalizerData, setTotalizerData] = useState([])
    const [filteredLogData, setFilteredLogData] = useState([])
    const [loading, setLoading] = useState(true)
    const [hideLine, setHideLine] = useState({
        CurrentPressure: false,
        CurrentFlow: false,
        AverageVoltage: false,
        totalizerPositive: false,
        totalizerNegative: false,
    })
    const timeRange = props.timeRange
    const loggerType = props.logger.Name.toLowerCase().includes("pressure") ? "pressure" : "flow"
    const [average, setAverage] = useState('')

    useEffect(() => {
        // console.log(logger)
        const fetchData = async () => {
            // { console.log(window.innerWidth) }
            let logResponse = null
            let totalizerResponse = null
            if (loggerType == "pressure") {
                logResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/pressure_log/${props.logger.LoggerId}`)
            } else if (loggerType == "flow") {
                logResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/flow_log/${props.logger.LoggerId}`)
                totalizerResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/totalizer/${props.logger.LoggerId}`)
            } else {
                console.log("Unknown Datalogger")
                console.log(JSON.stringify(props.logger))
            }
            if (totalizerResponse?.data.length) {
                setTotalizerData(totalizerResponse.data)
            }
            if (logResponse.data.length) {
                // Filter logs here
                setLogData(logResponse.data)
                setFilteredLogData(logResponse.data.slice(-timeRange * 6))
            } else {
                setLogData([])
                console.log("NO LOGS")
            }
            setLoading(false)
            // if (loggerType == "flow") console.log(totalizerResponse.data)
        }
        fetchData()
    }, [])

    // update filtered data when selected timerange changes
    useEffect(() => {
        if (logData) {
            const _filteredLogData = logData.slice(-timeRange * 6)
            setFilteredLogData(_filteredLogData)
            // console.log(_filteredLogData)
        }
    }, [timeRange])
    // update average value
    useEffect(() => {
        const _average = getAvg(filteredLogData, "")
        setAverage(_average)
        // console.log(_average)
    }, [filteredLogData])

    // helper function
    const getAvg = (data, datakey) => {
        if (data[0]?.CurrentPressure) {
            datakey = "CurrentPressure"
        }
        else if (data[0]?.CurrentFlow) {
            datakey = "CurrentFlow"
        }
        return (data.reduce((acc, curr) => acc + curr[datakey], 0) / data.length).toFixed(2)
    }

    return (
        <> {!loading ? <>
            {loggerType=="flow" ?
                <ResponsiveContainer width={"95%"} height={150} className={"mx-auto mb-4"}>
                    <BarChart data={totalizerData}>
                        <XAxis dataKey={'Date'} tick={{ fontSize: 12 }} tickFormatter={timeStr => moment(timeStr).format('MMM D')} />
                        <YAxis width={30} tick={{ fontSize: 10 }} domain={[-10, 'dataMax + 5']} allowDataOverflow />
                        <CartesianGrid strokeDasharray={"5 10"} />
                        <Legend />
                        <Tooltip content={<CustomTotalizerBarTooltip />} />
                        <Bar dataKey={'DailyFlowPositive'}
                            name={"Totalizer Positive"}
                            fill='#4ADE80'
                            type={'monotone'}
                            stackId={1} />
                        <Bar dataKey={'DailyFlowNegative'}
                            name={"Totalizer Negative"}
                            fill='#4F46E5'
                            type={'monotone'}
                            stackId={1} />
                    </BarChart>
                </ResponsiveContainer>
                : <></>
            }
            <ResponsiveContainer width={"95%"} height={!props.logger.CurrentFlow ? 550 : 400} className={"self-center "}>
                <LineChart height={200} data={filteredLogData}  >
                    <XAxis dataKey={'LogTime'} tick={{ fontSize: 12 }} tickFormatter={timeStr => moment(timeStr).utcOffset('+0000').format('H:mm')} />
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
                    {props.logger.CurrentPressure ?
                        <>
                            {average ? <ReferenceLine y={average} label={"Average Pressure: " + average} /> : null}
                            <Line dataKey={'CurrentPressure'}
                                name={"Pressure"}
                                stroke='#73d25f'
                                type={'monotone'}
                                unit={'psi'}
                                dot={false}
                                hide={hideLine['CurrentPressure']} />
                        </> : null
                    }
                    {props.logger.CurrentFlow ?
                        <>
                            <ReferenceLine y={average} label={"Avg Flow: " + average} />
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