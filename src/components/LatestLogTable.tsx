import { ColumnDef } from "@tanstack/react-table"
import axios from 'axios'
import { ArrowDownIcon, ArrowUpIcon, CircleGaugeIcon, Clock4Icon, MoreHorizontal, RouterIcon, WavesIcon } from "lucide-react"
import moment from "moment"
import { useEffect, useState } from "react"
import { Datalogger, } from "./Types"
import { Button } from "./ui/button"
import { DataTable } from "./ui/data-table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu"

const latestLogsColumns: ColumnDef<Datalogger>[] = [
  {
    accessorKey: "LogId",
    header: ({ column }) => {
      return (
        <Button variant="ghost" className="px-2" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          Log ID
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
  },
  {
    accessorKey: "Name",
    header: ({ column }) => {
      return (
        <Button variant="ghost" className="px-2" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          <RouterIcon className="mr-1 h-5 w-5" />
          Logger
          {/* <ArrowUpDownIcon className="ml-2 h-4 w-4" /> */}
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
    cell: ({ row }) => {
      //@ts-ignore
      // console.log(row)
      const nameSplit = row.getValue("Name").split('_')
      const name = nameSplit.slice(2).toString().replaceAll('-',' ')
      const type = nameSplit.slice(1,2)
      // return (<><p className="font-bold">{name}</p><p className="text-muted-foreground">{row.getValue("LoggerId")}</p></>)
      return (<Button variant={"link"} className="p-0 block text-left"><p className="font-bold">{name}</p><p className="text-muted-foreground">{row.getValue("LoggerId")}</p></Button>)
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
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
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
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
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
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
    cell: ({ row }) => {
      // if (row.getValue("LogTime")) return <>{(moment(row.getValue("LogTime"), true).format("MMM D, YYYY H:mm:ss"))}</>
      if (row.getValue("LogTime")) return <>{(moment(row.getValue("LogTime"), true).format("M/D/YYYY H:mm:ss"))}</>
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
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
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
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
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
              <span className="sr-only">Open Menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(datalogger.LoggerId.toString())}>Copy Logger ID</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Logger Data</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

const dat: Datalogger[] = []

function LoggerTable() {
  const [sortDir, setSortDir] = useState(null)
  const [loggerData, setLoggerData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/latest_log/`).then(response => {
        console.log(response.data)
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

  return (
    <>
      <DataTable columns={latestLogsColumns} data={loggerData} initialState={initialState} loading={loading} />
    </>
  )
}

export default LoggerTable;