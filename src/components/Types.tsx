export type Datalogger = {
    LoggerId: string,
    Name: string,
    Model: string,
    Type: string,
    Enabled: boolean,
    FwVersion: string,
    Latitude: number,
    Longitude: number,
    VoltageLimit: string,
    PressureLimit: string,
    FlowLimit: string,
    Imei: number,
    Sim: number,
    Visibility: string
}

export type FlowLog = {
    LogId: number,
    Timestamp: Date,
    LoggerModel: string,
    LoggerId: number,
    LogTime: Date,
    AverageVoltage: number,
    CurrentFlow: number,
    TotalFlowPositive: number,
    TotalFlowNegative: number,
}

export type PressureLog = {
    LogId: number,
    Timestamp: Date,
    LoggerModel: string,
    LoggerId: number,
    LogTime: Date,
    AverageVoltage: number,
    CurrentPressure: number,
}

export type DataLog = {
    LogId: number,
    Timestamp: Date,
    LoggerId: number,
    LogTime: string,
    AverageVoltage: number,
    CurrentPressure: number,
    CurrentFlow: number
}

export type Source = {
    SourceId: string,
    SourceIdNo: string,
    WaterPermitNo: string,
    Name: string,
    Capacity: number,
    HpRating: number,
    SupplyVoltage: number,
    Type: string,
    Latitude: number,
    Longitude: number,
    Location: number,
}

export type LoggerLog = {
    LoggerId: string,
    Name: string,
    Model: string,
    Type: string,
    FwVersion: string,
    Latitude: number,
    Longitude: number,
    VoltageLimit: string,
    PressureLimit: string,
    FlowLimit: string,
    Imei: number,
    Sim: number,
    Visibility: string,
    LogId: number,
    Timestamp: Date,
    LogTime: string,
    AverageVoltage: number,
    CurrentPressure: number,
    CurrentFlow: number
}

export type EventLog = {
    LogId: number,
    Username: string,
    Message: string,
    Timestamp: Date,
    IpAddress: string,
    Event: string,
    EventType: string
}

export type UserInfo = {
    UserId: number,
    Username: string,
    Type: 'admin' | 'user',
}

export type DashboardPrefs = {
    showLoggerList: boolean,
    showLoggerMap: boolean,
}

// RCMS Types
export type Sample = {
    id: string,
    clType: 'cl' | 'clo2' | 'variable',
    coordinates: {
        lat: number,
        lon: number
    },
    gpsVerified: boolean,
    value: number,
    user: string,
    samplingPoint: string,
    expand: {
        samplingPoint: SamplingPoint,
        user: User
    }
}

export type SamplingPoint = {
    id: string,
    name: string,
    clType: "cl" | "clo2" | "variable",
    coordinates: {
        lat: number,
        lon: number
    },
    samples: string[],
    expand: {
        samples: Sample[],
        samplingLocations: SamplingLocation[]
    }
}

export type SamplingLocation = {
    id: string,
    name: string,
    coordinates: {
        lat: number,
        lon: number
    },
    expand: {
        samplingPoint: SamplingPoint
    }
    radius: number,
    samplingPoint: number
}

export type User = {
    id: string,
    email: string,
    verified: boolean,
    name: string,
}

export type Notification = {
    NotificationId: string,
    Title: string,
    Message: string,
    Data: string,
    UserId: number,
    IsRead: boolean,
    Timestamp: Date,
    Type: 'info' | 'warning' | 'error' | 'sample-pass' | 'sample-resample' | 'sample-fail',
    Priority: 1 | 2 | 3,
    Source: 'aquaops' | 'crms'
}