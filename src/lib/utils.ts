import { Datalogger, ReportParameters, Sample, UserInfo } from "@/components/Types"
import axios from "axios"
import { type ClassValue, clsx } from "clsx"
import { addDays } from "date-fns"
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
  return strList.map((val) => val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()).join(' ')
}

type ReportLogRow = Record<string, string | number | null | undefined>

export async function generateReport(loggerInfo: Pick<Datalogger, 'LoggerId'>, fields: ReportParameters, dateRange: DateRange | undefined, user: UserInfo | null) {
  if (!dateRange?.from || !dateRange?.to) {
    throw new Error("A complete date range is required to generate a report.")
  }
  if (!user) {
    throw new Error("You must be signed in to generate a report.")
  }

  const loggerId = loggerInfo.LoggerId
  let logTable = ''
  let data: ReportLogRow[] = []
  // If fields.param, report is raw pressure/flow/voltage log data
  if (fields.param) {
    logTable = fields.param == "flow" ? "flow_log" : "pressure_log"
    const response = await axios.get(`${import.meta.env.VITE_API}/api/${logTable}/${loggerId}?timeStart=${dateRange.from}&timeEnd=${addDays(dateRange.to, 1)}&username=${user.Username}&averaged=${fields.averaging}`, { withCredentials: true })
    data = response.data ?? []
  }
  else {
    const response = await axios.get(`${import.meta.env.VITE_API}/api/totalizer/${loggerId}?timeStart=${dateRange.from}&timeEnd=${addDays(dateRange.to, 1)}&username=${user.Username}`, { withCredentials: true })
    data = response.data ?? []
  }
  if (!data || data.length == 0) {
    throw "No data available for the selected time range. Please choose a different period and try again."
  }
  if (data.length) {
    if (fields.param) {
      const newData = data.reduce<Array<Record<string, string | number | null | undefined>>>((newData, currentLog) => {
        let key = ''
        let timeKey = 'LogTime'
        if (fields.averaging == 'hourly') timeKey = 'LogHour'
        if (fields.param == "flow") key = (!fields || fields.averaging != 'none') ? "AverageFlow" : "CurrentFlow"
        else if (fields.param == "pressure") key = (!fields || fields.averaging != 'none') ? "AveragePressure" : "CurrentPressure"
        else if (fields.param == "voltage") key = "AverageVoltage"
        const timeValue = currentLog[timeKey]
        let newLog = {
          LogTime: timeKey == 'LogTime' && typeof timeValue === 'string'
            ? moment(timeValue.replace('Z', '')).format('YYYY-MM-DD HH:mm:ss')
            : timeValue,
          [key]: currentLog[key]
        }
        newData.push(newLog)
        return newData
      }, [])
      return newData
    } else {
      const newData = data.reduce<Array<{ Date: string; NetVolume?: number; ForwardVolume?: number; ReverseVolume?: number }>>((newData, currentLog) => {
        let newLog: { Date: string; NetVolume?: number; ForwardVolume?: number; ReverseVolume?: number } = {
          Date: String(currentLog.Date)
        }
        for (const [field, includeField] of Object.entries(fields)) {
          if (!includeField) continue
          if (field == "totalizerNet") {
            newLog = { ...newLog, NetVolume: Number(currentLog.DailyFlowPositive) - Number(currentLog.DailyFlowNegative) }
          }
          else if (field == "totalizerPositive") {
            newLog = { ...newLog, ForwardVolume: Number(currentLog.DailyFlowPositive) }
          }
          else if (field == "totalizerNegative") {
            newLog = { ...newLog, ReverseVolume: Number(currentLog.DailyFlowNegative) }
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

type PressureBaselineRow = {
  LogTime: string
  CurrentPressure?: number
  AveragePressure?: number
}

export function pressureReportToBaselinePoints(rows: PressureBaselineRow[]) {
  return rows.reduce<Array<{ day: string; hour: number; pressure: number }>>((points, row) => {
    const timestamp = moment(row.LogTime, 'YYYY-MM-DD HH:mm:ss', true)
    const pressure = Number(row.CurrentPressure ?? row.AveragePressure)

    if (!timestamp.isValid() || Number.isNaN(pressure)) {
      return points
    }

    points.push({
      day: timestamp.format('dddd'),
      hour: timestamp.hour(),
      pressure
    })

    return points
  }, [])
}

export function jsonToCSV(jsonArr: Array<Record<string, string | number | null | undefined>>, header: string) {
  let csv = header + '\n'
  let delim = ';'
  csv += Object.keys(jsonArr[0]).join(delim) + '\n'
  jsonArr.forEach((obj) => {
    csv += Object.values(obj).join(delim) + '\n'
  });
  const logTime = typeof jsonArr[0].LogTime === 'string' ? jsonArr[0].LogTime.split(',')[0] : undefined
  const filename = header.split(' ')[0] + '_' + (logTime ?? String(jsonArr[0].Date))
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
  const diffInMs = now.getTime() - new Date(date).getTime()

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
  if (!isValidNumber(vLow) || !isValidNumber(vHigh)) {
    return false
  }
  const low = parseFloat(vLow)
  const high = parseFloat(vHigh)
  if (high < low) {
    return false
  }
  if (low < VOLTAGE_LOWER_LIMIT || high > VOLTAGE_UPPER_LIMIT) {
    return false
  }
  return true
}

export const isValidFlowLimit = (fLow: string, fHigh: string): boolean => {
  if (!isValidNumber(fLow) || !isValidNumber(fHigh)) {
    return false
  }
  const low = parseFloat(fLow)
  const high = parseFloat(fHigh)
  if (high < low) {
    return false
  }
  // Assuming flow limits are not defined, we can skip the range check
  return true
}
// TODO: add absolute min/max values
export const isValidPressureLimit = (pLow: string, pHigh: string): boolean => {
  if (!isValidNumber(pLow) || !isValidNumber(pHigh)) {
    return false
  }
  const low = parseFloat(pLow)
  const high = parseFloat(pHigh)
  if (high < low) {
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

export const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }

  return undefined;
};

export const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true;
    }
    if (value.toLowerCase() === 'false') {
      return false;
    }
  }

  return undefined;
};