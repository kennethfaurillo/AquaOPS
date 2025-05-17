import useIsFirstRender from "@/hooks/useIsFirstRender"
import { useLogData } from "@/hooks/useLogData"
import { useSharedStateContext } from "@/hooks/useSharedStateContext"
import { ColumnDef, SortingState } from "@tanstack/react-table"
import { ArrowDownIcon, ArrowUpIcon, CircleGaugeIcon, Clock4Icon, MoreHorizontal, RouterIcon, ScatterChartIcon, SettingsIcon, WavesIcon } from "lucide-react"
import moment from "moment"
import { useEffect, useState } from "react"
import { DataLog, Datalogger, } from "./Types"
import { Button } from "./ui/button"
import { DataTable } from "./ui/data-table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu"

function LoggerTable() {
  const [loggerData, setLoggerData] = useState([])
  const [loading, setLoading] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([{
    id: "Name",
    desc: false, // Adjust the sorting order if needed
  }])

  const { setLogger, setChartDrawerOpen, setLoggerDialogOpen, setLoggerInfo, fetchLoggerInfo } = useSharedStateContext()
  const { latestLogsData, loggersData } = useLogData()
  const isFirstRender = useIsFirstRender()

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
        const nameSplit = (row.getValue("Name") as string).split('_')
        const name = nameSplit.slice(2).toString().replace(/-/g, ' ').replace(/=/g, '-')
        return (
          <>
            <Button variant={"link"} onClick={() => {
              setChartDrawerOpen(true)
              setLogger(row.original)
            }} className="p-0 block text-left whitespace-pre-wrap max-w-20 h-fit"><p className="font-bold">{name}</p><p className="text-gray-500 text-xs">{row.getValue("LoggerId")}</p></Button>
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
          <div className="text-right">
            <Button variant="ghost" className="px-1" onClick={() => {
              column.toggleSorting(column.getIsSorted() === "asc")
            }}>
              <Clock4Icon className="hidden sm:block xl:hidden 2xl:block mr-1 h-5 w-5" />
              Time
              {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const logTime: string = row.getValue("LogTime")
        if (row.getValue("LogTime")) return (
          <div className="text-right">
            {(moment(logTime.replace('Z', ''), true).format("M/D/YY "))}
            <br />
            {(moment(logTime.replace('Z', ''), true).format("h:mm A"))}
          </div>)
        return (<div className="text-gray-300 font-semibold">NA</div>)
      }
    },
    {
      accessorKey: "CurrentPressure",
      header: ({ column }) => {
        return (
          <div className="text-right">
            <Button variant="ghost" className="px-0" onClick={() => {
              column.toggleSorting(column.getIsSorted() === "asc")
            }}>
              <CircleGaugeIcon className="hidden sm:block xl:hidden 2xl:block mr-1 h-5 w-5" />
              Pressure
              {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        if (!Number.isNaN(parseFloat(row.getValue("CurrentPressure")))) {
          const pressure = parseFloat(row.getValue("CurrentPressure"))
          return <div className={`font-semibold text-right ${pressure < 10 ? pressure < 5 ? 'text-red-400 animate-pulse' :'text-orange-400':''}`}>{pressure.toFixed(1)} <em>psi</em></div>
        }
        return (<div className="text-gray-300 font-semibold text-right">NA</div>)
      }
    },
    {
      accessorKey: "CurrentFlow",
      header: ({ column }) => {
        return (
          <div className="text-right">
            <Button variant="ghost" className="px-0" onClick={() => {
              column.toggleSorting(column.getIsSorted() === "asc")
            }}>
              <WavesIcon className="hidden sm:block xl:hidden 2xl:block mr-1 h-5 w-5" />
              Flow
              {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        if (!Number.isNaN(parseFloat(row.getValue("CurrentFlow")))) return <div className="font-semibold text-right">{parseFloat(row.getValue("CurrentFlow").toFixed(1))} <em>lps</em></div>
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
    if (isFirstRender) {
      return
    }
    if (loggersData.length && latestLogsData.length) {
      fetchLatestLogsInfo()
    }
  }, [loggersData, latestLogsData])

  async function fetchLatestLogsInfo() {
    setLoading(true)
    try {
      let tempLoggersLatest: {}[] = []
      loggersData.map((logger: Datalogger) => {
        latestLogsData.map((log: DataLog) => {
          if (!logger.Visibility.split(',').includes('table')) {
            return
          }
          if (logger.LoggerId == log.LoggerId) {
            tempLoggersLatest.push({ ...logger, ...log })
          }
        })
      })
      setLoggerData(tempLoggersLatest.filter((logger) => logger.Enabled))
      setLoading(false)
    }
    catch (error) {
      console.log(error)
    }
  }

  const initialState = {
    columnVisibility: {
      LogId: false, Timestamp: false, LoggerId: false, actions: false
    }
  }

  return (
    <>
      <DataTable columns={latestLogsColumns} data={loggerData} initialState={initialState} sorting={sorting} setSorting={setSorting} loading={loading} />
    </>
  )
}

export default LoggerTable;