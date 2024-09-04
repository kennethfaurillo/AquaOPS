import { useSharedStateContext } from "@/hooks/useSharedStateContext"
import { ColumnDef } from "@tanstack/react-table"
import axios from 'axios'
import { ArrowDownIcon, ArrowUpIcon, FactoryIcon, MapPinnedIcon, MountainSnowIcon, RadiusIcon, RouterIcon } from "lucide-react"
import moment from "moment"
import { useEffect, useState } from "react"
import { Station } from "./Types"
import { Button } from "./ui/button"
import { DataTable } from "./ui/data-table"

function StationTable(props) {
  const [loggerData, setLoggerData] = useState([])
  const [loading, setLoading] = useState(true)
  const setLatestLog = props?.setLatestLog

  const { setLogger, setChartDrawerOpen, setLoggerDialogOpen, setLoggerInfo, fetchLoggerInfo } = useSharedStateContext()

  const StationColumns: ColumnDef<Station>[] = [
    {
      accessorKey: "Id",
      header: ({ column }) => {
        return (
          <Button variant="ghost" className="px-2" onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc")
          }}>
            ID
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
              <FactoryIcon className="mr-1 h-5 w-5" />
              Station
              {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
            </Button>
          </>
        )
      },
      cell: ({ row }) => {
        const nameSplit = row.getValue("Name").split('_')
        const name = nameSplit.slice(2).toString().replaceAll('-', ' ').replaceAll('=', '-')
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
      accessorKey: "SourceId",
      header: ({ column }) => {
        return (
          <Button variant="ghost" className="px-2" onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc")
          }}>
            <RouterIcon className="mr-1 h-5 w-5" />
            Source ID
            {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
          </Button>
        )
      },
      cell: ({ row }) => {
        return (<><p className="font-bold">{row.getValue("LoggerId")}</p><p>{row.getValue("type")}</p></>)
      }
    },
    {
      accessorKey: "Location",
      header: ({ column }) => {
        return (
          <div className="text-left">
            <Button variant="ghost" className="px-2" onClick={() => {
              column.toggleSorting(column.getIsSorted() === "asc")
            }}>
              <MapPinnedIcon className="mr-1 h-5 w-5" />
              Location
              {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: "Capacity",
      header: ({ column }) => {
        return (
          <div className="text-left">
            <Button variant="ghost" className="px-1" onClick={() => {
              column.toggleSorting(column.getIsSorted() === "asc")
            }}>
              <RadiusIcon className="hidden sm:block xl:hidden 2xl:block mr-1 h-5 w-5" />
              Capacity
              {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        if (row.getValue("LogTime")) return (
          <div className="text-left">
            {(moment(row.getValue("LogTime").replace('Z', ''), true).format("M/D/YY "))}
            <br />
            {(moment(row.getValue("LogTime").replace('Z', ''), true).format("H:mm A"))}
          </div>)
        return (<div className="text-gray-300 font-semibold">NA</div>)
      }
    },
    {
      accessorKey: "Elevation",
      header: ({ column }) => {
        return (
          <div className="text-left">
            <Button variant="ghost" className="px-0" onClick={() => {
              column.toggleSorting(column.getIsSorted() === "asc")
            }}>
              <MountainSnowIcon className="hidden sm:block xl:hidden 2xl:block mr-1 h-5 w-5" />
              Elevation
              {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        if (!Number.isNaN(parseFloat(row.getValue("CurrentPressure")))) return <div className="font-semibold text-right">{parseFloat(row.getValue("CurrentPressure"))} <em>psi</em></div>
        return (<div className="text-gray-300 font-semibold text-right">NA</div>)
      }
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
  }, [])

  const initialState = {
    columnVisibility: {
      Id: false, SourceId: false, Location: false
    },
    pagination: {
      pageSize: 8,
    },
  }

  return (
    <>
      <DataTable columns={StationColumns} data={loggerData} initialState={initialState} loading={loading} />
    </>
  )
}

export default StationTable;