import { ColumnDef } from "@tanstack/react-table"
import axios from 'axios'
import { ArrowDownIcon, ArrowUpIcon, CircleGaugeIcon, Clock4Icon, Loader2Icon, MoreHorizontal, RouterIcon, ScatterChartIcon, SettingsIcon, WavesIcon } from "lucide-react"
import moment from "moment"
import { useEffect, useState } from "react"
import LogLineChart from "./LogLineChart"
import { Datalogger, } from "./Types"
import { Button } from "./ui/button"
import { DataTable } from "./ui/data-table"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Input } from "./ui/input"
import { Label } from "./ui/label"


function LoggerTable(props) {
  const [loggerData, setLoggerData] = useState([])
  const [chartDrawerOpen, setChartDrawerOpen] = useState(false)
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [logger, setLogger] = useState(null)
  const [loggerInfo, setLoggerInfo] = useState(null)
  const [loggerInfoLoading, setLoggerInfoLoading] = useState(true)
  const [hoverOpen, setHoverOpen] = useState(false)
  const setLatestLogTime = props?.setLatestLogTime


  const latestLogsColumns: ColumnDef<Datalogger>[] = [
    {
      accessorKey: "LogId",
      header: ({ column }) => {
        return (
          <Button variant="ghost" className="px-2" onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc")
          }}>
            Log ID
            {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
          </Button>
        )
      },
    },
    {
      accessorKey: "Name",
      header: ({ column }) => {
        return (
          <>

            <Button variant="ghost" className="px-2" onClick={() => {
              column.toggleSorting(column.getIsSorted() === "asc")
            }}>
              <RouterIcon className="mr-1 h-5 w-5" />
              Logger
              {/* <ArrowUpDownIcon className="ml-2 h-4 w-4" /> */}
              {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
            </Button>
          </>
        )
      },
      cell: ({ row }) => {
        //@ts-ignore
        // console.log(row)
        const nameSplit = row.getValue("Name").split('_')
        const name = nameSplit.slice(2).toString().replaceAll('-', ' ')
        const type = nameSplit.slice(1, 2)
        // return (<><p className="font-bold">{name}</p><p className="text-muted-foreground">{row.getValue("LoggerId")}</p></>)
        return (
          <>
            <Button variant={"link"} onClick={() => {
              setChartDrawerOpen(true)
              setLogger(row.original)
            }} className="p-0 block text-left"><p className="font-bold">{name}</p><p className="text-muted-foreground">{row.getValue("LoggerId")}</p></Button>
          </>
        )
      }
    },
    {
      accessorKey: "LoggerId",
      header: ({ column }) => {
        return (
          <Button variant="ghost" className="px-2" onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc")
          }}>
            <RouterIcon className="mr-1 h-5 w-5" />
            Logger ID
            {/* <ArrowUpDownIcon className="ml-2 h-4 w-4" /> */}
            {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
          </Button>
        )
      },
      cell: ({ row }) => {
        return (<><p className="font-bold">{row.getValue("LoggerId")}</p><p>{row.getValue("type")}</p></>)
      }
    },
    {
      accessorKey: "Timestamp",
      header: ({ column }) => {
        return (
          <Button variant="ghost" className="px-2" onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc")
          }}>
            Timestamp
            {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
          </Button>
        )
      },
    },
    {
      accessorKey: "LogTime",
      header: ({ column }) => {
        return (
          <Button variant="ghost" className="px-1" onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc")
          }}>
            <Clock4Icon className="hidden sm:block xl:hidden 2xl:block mr-1 h-5 w-5" />
            Time
            {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
          </Button>
        )
      },
      cell: ({ row }) => {
        // if (row.getValue("LogTime")) return <>{(moment(row.getValue("LogTime"), true).format("MMM D, YYYY H:mm:ss"))}</>
        if (row.getValue("LogTime")) return <div className="text-center">{(moment(row.getValue("LogTime"), true).format("M/D/YY H:mm:ss"))}</div>
        return (<div className="text-gray-300 font-semibold">NA</div>)
      }
    },
    {
      accessorKey: "CurrentPressure",
      header: ({ column }) => {
        return (
          <Button variant="ghost" className="px-0" onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc")
          }}>
            <CircleGaugeIcon className="hidden sm:block xl:hidden 2xl:block mr-1 h-5 w-5" />
            Pressure
            {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
          </Button>
        )
      },
      cell: ({ row }) => {
        if (parseFloat(row.getValue("CurrentPressure"))) return <div className="font-semibold text-right">{parseFloat(row.getValue("CurrentPressure"))} <em>psi</em></div>
        return (<div className="text-gray-300 font-semibold text-right">NA</div>)
      }
    },
    {
      accessorKey: "CurrentFlow",
      header: ({ column }) => {
        return (
          <Button variant="ghost" className="px-0" onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc")
          }}>
            <WavesIcon className="hidden sm:block xl:hidden 2xl:block mr-1 h-5 w-5" />
            Flow
            {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
          </Button>
        )
      },
      cell: ({ row }) => {
        if (parseFloat(row.getValue("CurrentFlow"))) return <div className="font-semibold text-right">{parseFloat(row.getValue("CurrentFlow"))} <em>lps</em></div>
        return (<div className="text-gray-300 font-semibold text-right">NA</div>)
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const datalogger = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                {/* <span className="sr-only">Open Menu</span> */}
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {/* <DropdownMenuItem onClick={() => navigator.clipboard.writeText(datalogger.LoggerId.toString())}><SettingsIcon className="size-1/6 mr-1"/>Edit Logger Info</DropdownMenuItem> */}
              <DropdownMenuItem onClick={async () => {
                const newLogger = await (fetchLoggerInfo(row.original.LoggerId))
                setLoggerInfo(newLogger[0])
                setInfoDialogOpen(true)
                setLoggerInfoLoading(false)
              }}><SettingsIcon className="size-1/6 mr-1" />Edit Logger Info</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                setChartDrawerOpen(true)
                setLogger(row.original)
              }}><ScatterChartIcon className="size-1/6 mr-1" />View Logger Data</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  useEffect(() => {
    async function fetchData() {
      axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/latest_log/`).then(response => {
        // console.log(response.data.length,response.data)
        setLatestLogTime(response.data.at(0).LogTime)
        setLoggerData(response.data)
      }, error => {
        console.log(error.toString())
      }).finally(() => {
        setLoading(false)
      })
    }
    fetchData()
  }, [])

  const initialState = {
    columnVisibility: {
      LogId: false, Timestamp: false, LoggerId: false
    },
    pagination: {
      pageSize: 8,
    }
  }

  const fetchLoggerInfo = async (loggerId) => {
    const loggerResponse = await axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/logger/${loggerId}`)
    return loggerResponse.data
  }

  return (
    <>
      <Drawer open={chartDrawerOpen} onOpenChange={setChartDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-piwad-lightblue-500 text-3xl">{logger?.Name.replaceAll('-', ' ').split('_').slice(2) ?? "Unnamed"} LOGGER</DrawerTitle>
            <DrawerDescription >
              Logger ID: {logger?.LoggerId ?? "#########"} | Latest Log: {`${new Date(logger?.LogTime)}`}
            </DrawerDescription>
          </DrawerHeader>
          {logger ? <LogLineChart logger={logger} /> : <Loader2Icon className="animate-spin self-center size-12 my-5" />}
          <DrawerFooter className="flex-row justify-center">
            {/* <Button>Submit</Button> */}
            <Button className="bg-piwad-lightyellow-500 text-black" onClick={async () => {
              if (logger) {
                await fetchLoggerInfo(logger.LoggerId).then((response) => {
                  console.log(JSON.stringify(response))
                  setLoggerInfo(response[0])
                  setLoggerInfoLoading(false)
                  setInfoDialogOpen(true)
                })
              }
            }}>Config</Button>
            <DrawerClose asChild>
              <Button>Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-piwad-blue-500">Logger Information and Configuration</DialogTitle>
            <DialogDescription>Only Admins can modify logger configuration and information</DialogDescription>
            {/* <DialogDescription>{loggerInfo?.Name.replaceAll('-', ' ').split('_').slice(2)} | #{loggerInfo?.LoggerId} | {loggerInfo?.Latitude}°N, {loggerInfo?.Longitude}°E</DialogDescription> */}
          </DialogHeader>
          {!loggerInfoLoading ?
            <div className="text-center">
              <p className="text-lg text-left font-semibold">Logger Info</p>
              <Label htmlFor="loggerName" >Logger Name</Label>
              <Input id={"loggerName"} placeholder={loggerInfo?.Name.replaceAll('-', ' ').split('_').slice(2)} disabled/>
              <Label htmlFor="loggerName" >Logger ID</Label>
              <Input id={"loggerID"} placeholder={loggerInfo.LoggerId} disabled />
              <Label htmlFor="loggerName" >Logger Latitude</Label>
              <Input id={"loggerLat"} placeholder={loggerInfo.Latitude} disabled />
              <Label htmlFor="loggerName" >Logger Longitude</Label>
              <Input id={"loggerLong"} placeholder={loggerInfo.Longitude} disabled />
              <br />
              <p className="text-lg text-left font-semibold">Logger Alarm Limits</p>
              <Label htmlFor="loggerName" >Voltage Limit</Label>
              <Input id={"loggerName"} placeholder={loggerInfo?.VoltageLimit?.replace(',',' - ') ?? "N/A"} disabled/>
              <Label htmlFor="loggerName" >Flow Limit</Label>
              <Input id={"loggerID"} placeholder={loggerInfo?.FlowLimit?.replace(',',' - ') ?? "N/A"} disabled />
              <Label htmlFor="loggerName" >Logger Latitude</Label>
              <Input id={"loggerLat"} placeholder={loggerInfo?.PressureLimit?.replace(',',' - ') ?? "N/A"} disabled />
              {/* <p>Voltage Limit: {loggerInfo.VoltageLimit?.replaceAll(',', ' - ') ?? "N/A"}</p>
              <p>Flow Limit: {loggerInfo.FlowLimit?.replaceAll(',', ' - ') ?? "N/A"}</p>
              <p>Pressure Limit: {loggerInfo.PressureLimit?.replaceAll(',', ' - ') ?? "N/A"}</p> */}
            </div> : <Loader2Icon className="animate-spin m-auto size-16" />}
          <DialogClose asChild><Button>Close</Button></DialogClose>
          <Button className="bg-green-500" onClick={() => setInfoDialogOpen(false)}>Save</Button>
        </DialogContent>
      </Dialog>
      <DataTable columns={latestLogsColumns} data={loggerData} initialState={initialState} loading={loading} />
    </>
  )
}

export default LoggerTable;