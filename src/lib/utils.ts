import axios from "axios"
import { type ClassValue, clsx } from "clsx"
import { addDays } from "date-fns"
import moment from "moment"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**Capitalize a string */
export function capitalize(str) {
  const strList = str.split(' ')
  return strList.map((val) => val.at(0).toUpperCase() + val.slice(1).toLowerCase()).join(' ')
}

export async function generateReport(loggerInfo, fields, dateRange, user) {
  const loggerId = loggerInfo.LoggerId
  let logTable = ''
  let data = []
  if (fields.pressure || fields.flow || fields.voltage) {
    if (fields.pressure && fields.flow) {
      const logResponse = await axios.post(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/logs/?timeStart=${dateRange?.from}&timeEnd=${addDays(dateRange?.to, 1)}&username=${user.Username}`, {
        logTypes: loggerInfo.Type.split(','),
        loggerId: loggerId,
      })
      data = logResponse.data
    } else {
      if (fields.flow) logTable = "flow_log"
      else logTable = "pressure_log"
      const response = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/${logTable}/${loggerId}?timeStart=${dateRange?.from}&timeEnd=${addDays(dateRange?.to, 1)}&username=${user.Username}`)
      data = response.data ?? []
    }
  }
  else {
    const response = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/totalizer/${loggerId}?timeStart=${dateRange?.from}&timeEnd=${addDays(dateRange?.to, 1)}&username=${user.Username}`)
    data = response.data ?? []
  }
  if (!data || data.length == 0) {
    throw "No data available for the selected time range. Please choose a different period and try again."
  }
  if (data.length) {
    if (fields.pressure || fields.flow || fields.voltage) {
      const newData = data.reduce((newData, currentLog) => {
        let newLog = {
          LogTime: moment(currentLog.LogTime.replace('Z', '')).format('MM/DD/YYYY, hh:mm A')
        }
        for (const [field, includeField] of Object.entries(fields)) {
          if (!includeField) continue
          let key = ''
          if (field == "flow") key = "CurrentFlow"
          else if (field == "pressure") key = "CurrentPressure"
          else if (field == "voltage") key = "AverageVoltage"
          // else if (field == "totalizerPositive") key = "TotalFlowPositive"
          // else if (field == "totalizerNegative") key = "TotalFlowNegative"
          newLog = {
            ...newLog,
            [key]: currentLog[key]
          }
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
export function isValueInRange (limits, value){
  const [low, high] = limits.split(',').map(Number);
  return value >= low && value <= high;
};

export function lerp(min, max, val){
  return (val-min)/(max-min)*100
}

// Compute the time difference between a given date and now
// in the specified units (default is milliseconds)
export function dateDiff(date: Date, unit: 'ms' | 's' | 'm' | 'h' | 'd' ) {
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
