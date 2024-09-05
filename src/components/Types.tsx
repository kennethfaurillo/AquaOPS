export type Datalogger = {
    LoggerId: number,
    Name: string,
    Model: string,
    Enabled: boolean,
    FwVersion: string,
    Latitude: number,
    Longitude: number,
    VoltageLimit: string,
    PressureLimit: string,
    FlowLimit: string,
    Imei: number,
    Sim: number
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
    LogTime: Date,
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
    Latitude: number,
    Longitude: number,
    Location: number,
}

export type LoggerLog = {
    LoggerId: number,
    Name: string,
    Model: string,
    FwVersion: string,
    Latitude: number,
    Longitude: number,
    VoltageLimit: string,
    PressureLimit: string,
    FlowLimit: string,
    Imei: number,
    Sim: number,
    LogId: number,
    Timestamp: Date,
    LogTime: Date,
    AverageVoltage: number,
    CurrentPressure: number,
    CurrentFlow: number
}