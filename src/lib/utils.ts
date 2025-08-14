import { Datalogger, ReportParameters, Sample, UserInfo } from "@/components/Types"
import axios from "axios"
import { type ClassValue, clsx } from "clsx"
import { addDays, isValid } from "date-fns"
import moment from "moment"
import { DateRange } from "react-day-picker"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**Capitalize a string */
export function capitalize(str: string) {
  if (!str) return str
  const strList = str.split(' ')
  return strList.map((val) => val.at(0).toUpperCase() + val.slice(1).toLowerCase()).join(' ')
}

export async function generateReport(loggerInfo: Datalogger, fields: ReportParameters, dateRange: DateRange, user: UserInfo| null) {
  const loggerId = loggerInfo.LoggerId
  let logTable = ''
  let data = []
  // If fields.param, report is raw pressure/flow/voltage log data
  if (fields.param) {
    logTable = fields.param == "flow" ? "flow_log" : "pressure_log"
    const response = await axios.get(`${import.meta.env.VITE_API}/api/${logTable}/${loggerId}?timeStart=${dateRange?.from}&timeEnd=${addDays(dateRange?.to, 1)}&username=${user.Username}&averaged=${fields.averaging}`, { withCredentials: true })
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
        let newLog: { Date: string; NetVolume?: number; ForwardVolume?: number; ReverseVolume?: number } = {
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
      return newData
    }
  } else {
    console.log("No Data")
  }
}

export function jsonToCSV(jsonArr, header) {
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

/**
 * Function to test if a sample is within the acceptable range
 * @param sample Sample object to test
 * 
 * @returns true if the sample is within the range, false otherwise
 */
export function testSample(sample: Sample | undefined) {
  if (!sample) return false
  const { clType } = sample
  const range = {
    clo2: [0.2, 0.4],
    cl: [0.3, 1.5]
  }
  if (clType === 'clo2' || clType === 'cl') {
    return sample.value >= range[clType][0] && sample.value <= range[clType][1]
  }
  return false
}

export function parseLoggerName(name: string) {
  return name.replaceAll('-', ' ').replaceAll('=', '-').split('_').at(2) ?? "Logger Name"
}

export function formatLoggerName(displayName: string, prevLoggerName: string) {
  const replaced = displayName.replaceAll('-', '=').replaceAll(' ', '-');
  const prefix = prevLoggerName.split('_').slice(0, 2).join('_')
  return `${prefix}_${replaced}`;
}
// VALIDATIONS
const VOLTAGE_UPPER_LIMIT = 4.5
const VOLTAGE_LOWER_LIMIT = 2.0
const LATITUDE_LOWER_LIMIT = 13.456072
const LATITUDE_UPPER_LIMIT = 13.696173
const LONGITUDE_LOWER_LIMIT = 123.111745
const LONGITUDE_UPPER_LIMIT = 123.456730

const isValidLoggerName = (name: string): boolean => {
  // Logger name should be alphanumeric, underscores, and hyphens only
  const regex = /^[a-zA-Z0-9_-]+$/
  return regex.test(name) && name.length >= 3 && name.length <= 50
}

const isValidNumber = (value: string): boolean => {
  return !isNaN(Number(value)) && value.trim() !== ''
}

export const isValidLatitude = (lat: string): boolean => {
  const num = parseFloat(lat)
  return isValidNumber(lat) && num >= LATITUDE_LOWER_LIMIT && num <= LATITUDE_UPPER_LIMIT
}

export const isValidLongitude = (lng: string): boolean => {
  const num = parseFloat(lng)
  return isValidNumber(lng) && num >= LONGITUDE_LOWER_LIMIT && num <= LONGITUDE_UPPER_LIMIT
}

export const isValidVoltageLimit = (vLow: string, vHigh: string): boolean => {
  if(!isValidNumber(vLow) || !isValidNumber(vHigh)) {
    return false
  }
  const low = parseFloat(vLow)
  const high = parseFloat(vHigh)
  if(high < low) {
    return false
  }
  if(low < VOLTAGE_LOWER_LIMIT || high > VOLTAGE_UPPER_LIMIT) {
    return false
  }
  return true
}

export const isValidFlowLimit = (fLow: string, fHigh: string): boolean => {
  if(!isValidNumber(fLow) || !isValidNumber(fHigh)) {
    return false
  }
  const low = parseFloat(fLow)
  const high = parseFloat(fHigh)
  if(high < low) {
    return false
  }
  // Assuming flow limits are not defined, we can skip the range check
  return true
}
// TODO: add absolute min/max values
export const isValidPressureLimit = (pLow: string, pHigh: string): boolean => {
  if(!isValidNumber(pLow) || !isValidNumber(pHigh)) {
    return false
  }
  const low = parseFloat(pLow)
  const high = parseFloat(pHigh)
  if(high < low) {
    return false
  }
  // Assuming pressure limits are not defined, we can skip the range check
  return true
}

export const isValidSimCardNumber = (sim: string): boolean => {
  // Sim No should be a 10-digit number starting with '9'
  if (!/^\d{10}$/.test(sim)) {
    return false
  }
  if (!sim.startsWith('9')) {
    return false
  }
  return true
}