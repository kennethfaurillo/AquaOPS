import { ColumnDef, sortingFns } from "@tanstack/react-table"
import axios from 'axios'
import { ArrowDownIcon, ArrowUpIcon, CircleGaugeIcon, Clock4Icon, MoreHorizontal, RouterIcon, ScatterChartIcon, SettingsIcon, WavesIcon } from "lucide-react"
import moment from "moment"
import { useEffect, useState } from "react"
import { Datalogger, } from "./Types"
import { Button } from "./ui/button"
import { DataTable } from "./ui/data-table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { useDrawerDialogContext } from "../hooks/useDrawerDialogContext"

function LoggerTable(props) {
  const [loggerData, setLoggerData] = useState([])
  const [loading, setLoading] = useState(true)
  const setLatestLog = props?.setLatestLog
  const pollMs = 60000

  const {setLogger, setChartDrawerOpen, setLoggerDialogOpen, setLoggerInfo, fetchLoggerInfo} = useDrawerDialogContext()

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
        const nameSplit = row.getValue("Name").split('_')
        const name = nameSplit.slice(2).toString().replaceAll('-', ' ').replaceAll('=', '-')
        const type = nameSplit.slice(1, 2)
        return (
          <>
            <Button variant={"link"} onClick={() => {
              setChartDrawerOpen(true)
              setLogger(row.original)
            }} className="p-0 block text-left whitespace-pre-wrap max-w-20 h-fit"><p className="font-bold">{name}</p><p className="text-muted-foreground">{row.getValue("LoggerId")}</p></Button>
          </>
        )
      },
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
        if (row.getValue("LogTime")) return <div className="text-center">{(moment(row.getValue("LogTime").replace('Z',''), true).format("M/D/YY H:mm:ss"))}</div>
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
        if (!Number.isNaN(parseFloat(row.getValue("CurrentPressure")))) return <div className="font-semibold text-right">{parseFloat(row.getValue("CurrentPressure"))} <em>psi</em></div>
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
        if (!Number.isNaN(parseFloat(row.getValue("CurrentFlow"))) ) return <div className="font-semibold text-right">{parseFloat(row.getValue("CurrentFlow"))} <em>lps</em></div>
        return (<div className="text-gray-300 font-semibold text-right">NA</div>)
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={async () => {
                const newLogger = (await fetchLoggerInfo(row.original.LoggerId))[0]
                // console.log(newLogger)
                setLoggerInfo(newLogger)
                setLoggerDialogOpen(true)
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
        const latestLog = response.data.reduce((latest, current) => {
          return new Date(current.LogTime) > new Date(latest.LogTime) ? current : latest
        })
        setLatestLog(latestLog)
        setLoggerData(response.data)
      }, error => {
        console.log(error.toString())
      }).finally(() => {
        setLoading(false)
      })
    }
    fetchData()
    const poll = setInterval(() => {
      fetchData()
    }, pollMs)
    return () => clearInterval(poll)
  }, [])

  const initialState = {
    columnVisibility: {
      LogId: false, Timestamp: false, LoggerId: false, actions: false
    },
    pagination: {
      pageSize: 8,
    },
  }

  return (
    <>
      <DataTable columns={latestLogsColumns} data={loggerData} initialState={initialState} loading={loading} />
    </>
  )
}

export default LoggerTable;