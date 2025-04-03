import axios from "axios"
import { type ClassValue, clsx } from "clsx"
import { addDays } from "date-fns"
import moment from "moment"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**Capitalize a string */
export function capitalize(str: string) {
  if(!str) return str
  const strList = str.split(' ')
  return strList.map((val) => val.at(0).toUpperCase() + val.slice(1).toLowerCase()).join(' ')
}

export async function generateReport(loggerInfo, fields, dateRange, user) {
  const loggerId = loggerInfo.LoggerId
  let logTable = ''
  let data = []
  if (fields.param) {
    logTable = fields.param == "flow" ? "flow_log" : "pressure_log"
    if (fields.averaging) {
      console.log("Averaging", fields.averaging)
    }
    const response = await axios.get(`${import.meta.env.VITE_API}/api/${logTable}/${loggerId}?timeStart=${dateRange?.from}&timeEnd=${addDays(dateRange?.to, 1)}&username=${user.Username}&averaged=${fields.averaging}`, { withCredentials: true })
    console.log(response.data)
    data = response.data ?? []
  }
  else {
    const response = await axios.get(`${import.meta.env.VITE_API}/api/totalizer/${loggerId}?timeStart=${dateRange?.from}&timeEnd=${addDays(dateRange?.to, 1)}&username=${user.Username}`, { withCredentials: true })
    data = response.data ?? []
  }
  if (!data || data.length == 0) {
    throw "No data available for the selected time range. Please choose a different period and try again."
  }
  if (data.length) {
    if (fields.param) {
      const newData = data.reduce((newData, currentLog) => {
        let key = ''
        let timeKey = 'LogTime'
        if (fields.averaging == 'hourly') timeKey = 'LogHour'
        else if (fields.averaging == 'daily') timeKey = 'LogDate'
        if (fields.param == "flow") key = (!fields || fields.averaging != 'none') ? "AverageFlow" : "CurrentFlow"
        else if (fields.param == "pressure") key = (!fields || fields.averaging != 'none') ? "AveragePressure" : "CurrentPressure"
        else if (fields.param == "voltage") key = "AverageVoltage"
        let newLog = {
          LogTime: timeKey == 'LogTime' ? moment(currentLog[timeKey].replace('Z', '')).format('YYYY-MM-DD HH:mm:ss') : currentLog[timeKey],
          [key]: currentLog[key]
        }
        newData.push(newLog)
        return newData
      }, [])
      return newData
    } else {
      const newData = data.reduce((newData, currentLog) => {
        let newLog: { Date: any; NetVolume?: number; ForwardVolume?: number; ReverseVolume?: number } = {
          Date: currentLog.Date
        }
        for (const [field, includeField] of Object.entries(fields)) {
          if (!includeField) continue
          if (field == "totalizerNet") {
            newLog = { ...newLog, NetVolume: currentLog.DailyFlowPositive - currentLog.DailyFlowNegative }
          }
          else if (field == "totalizerPositive") {
            newLog = { ...newLog, ForwardVolume: currentLog.DailyFlowPositive }
          }
          else if (field == "totalizerNegative") {
            newLog = { ...newLog, ReverseVolume: currentLog.DailyFlowNegative }
          }
        }
        newData.push(newLog)
        return newData
      }, [])
      console.log(newData)
      return newData
    }
  } else {
    console.log("NO DATA!")
  }
}

export function jsonToCSV(jsonArr, header) {
  console.log(jsonArr[0])
  let csv = header + '\n'
  let delim = ';'
  csv += Object.keys(jsonArr[0]).join(delim) + '\n'
  jsonArr.forEach(obj => {
    csv += Object.values(obj).join(delim) + '\n'
  });
  const filename = header.split(' ')[0] + '_' + (jsonArr[0].LogTime?.split(',')[0] ?? jsonArr[0].Date)
  const extension = "csv"
  const _blob = new Blob([csv], { type: "text/plain" })
  const url = URL.createObjectURL(_blob)
  const link = document.createElement("a");
  link.download = `${filename}.${extension}`
  link.href = url;
  return link
}

// Check a value against a given limit (csv - low,high)
// true - in range, false - outside
export function isValueInRange(limits: string, value: number) {
  const [low, high] = limits.split(',').map(Number);
  return value >= low && value <= high;
};

export function lerp(min: number, max: number, val: number) {
  return (val - min) / (max - min) * 100
}

// Compute the time difference between a given date and now
// in the specified units (default is milliseconds)
export function dateDiff(date: Date, unit: 'ms' | 's' | 'm' | 'h' | 'd') {
  const unitDividers = {
    ms: 1,
    s: 1000,
    m: 1000 * 60,
    h: 1000 * 60 * 60,
    d: 1000 * 60 * 60 * 24
  }

  const now = new Date()
  const diffInMs = now - new Date(date)

  return diffInMs / (unitDividers[unit] || 1)
}
