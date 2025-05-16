import { ColumnDef, SortingState } from "@tanstack/react-table"
import axios from 'axios'
import { ArrowDownIcon, ArrowUpIcon, DropletsIcon, MapPinnedIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Source } from "./Types"
import { Button } from "./ui/button"
import { DataTable } from "./ui/data-table"

function WaterSourceTable() {
  const [sourceInfo, setSourceInfo] = useState([])
  const [sorting, setSorting] = useState<SortingState>([{
    id: "SourceIdNo",
    desc: false, // Adjust the sorting order if needed
  }])
  const [loading, setLoading] = useState(false)

  const WaterSourceColumns: ColumnDef<Source>[] = [
    {
      accessorKey: "SourceIdNo",
      header: ({ column }) => {
        return (
          <Button variant="ghost" className="px-2" onClick={() => {
            // column.toggleSorting(column.getIsSorted() === "asc")
          }}>
            Source ID
            {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
          </Button>
        )
      },
      cell: ({ row }) => {
        return (<><p className="font-bold">{row.getValue("SourceIdNo")}</p><p>{row.getValue("type")}</p></>)
      }
    },
    {
      accessorKey: "Name",
      header: ({ column }) => {
        return (
          <>
            <Button variant="ghost" className="px-2" onClick={() => {
              // column.toggleSorting(column.getIsSorted() === "asc")
            }}>
              <DropletsIcon className="mr-1 h-5 w-5" />
              Source
              {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
            </Button>
          </>
        )
      },
      cell: ({ row }) => {
        return (
          <>
            <Button variant={"link"} onClick={() => {
            }} className="p-0 block text-left whitespace-pre-wrap max-w-24 h-fit">
              <p className="font-bold">{row.getValue("Name")}</p>
              <p className="text-muted-foreground">{row.original.Type == 'well' ? 'PS '+row.getValue("SourceIdNo") : null}</p>
            </Button>
          </>
        )
      },
    },
    {
      accessorKey: "WaterPermitNo",
      header: ({ column }) => {
        return (
          <Button variant="ghost" className="px-2" onClick={() => {
            // column.toggleSorting(column.getIsSorted() === "asc")
          }}>
            WaterPermitNo
            {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
          </Button>
        )
      },
    },
    {
      accessorKey: "Capacity",
      header: ({ column }) => {
        return (
          <div className="text-left">
            <Button variant="ghost" className="px-1" onClick={() => {
              // column.toggleSorting(column.getIsSorted() === "asc")
            }}>
              {/* <RadiusIcon className="hidden sm:block xl:hidden 2xl:block mr-1 h-5 w-5" /> */}
              Capacity
              {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        if (row.getValue("Capacity")) return (
          <div className="font-semibold text-center">
            {row.getValue("Capacity")} <em>lps</em>
          </div>)
        return (<div className="text-gray-300 font-semibold">NA</div>)
      }
    },
    {
      accessorKey: "HpRating",
      header: ({ column }) => {
        return (
          <div className="text-left">
            <Button variant="ghost" className="px-0" onClick={() => {
              // column.toggleSorting(column.getIsSorted() === "asc")
            }}>
              {/* <PlugZapIcon className="hidden sm:block xl:hidden 2xl:block mr-1 h-5 w-5" /> */}
              HP Rating
              {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        if (row.getValue("HpRating")) return (<div className="font-semibold text-center">
          {row.getValue("HpRating")} <em>hp</em>
        </div>)
        return (<div className="text-gray-300 font-semibold text-right">NA</div>)
      }
    },
    {
      accessorKey: "SupplyVoltage",
      header: ({ column }) => {
        return (
          <div className="text-left">
            <Button variant="ghost" className="px-0" onClick={() => {
              // column.toggleSorting(column.getIsSorted() === "asc")
            }}>
              {/* <MountainSnowIcon className="hidden sm:block xl:hidden 2xl:block mr-1 h-5 w-5" /> */}
              Supply <br/>Voltage
              {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        if (row.getValue("SupplyVoltage")) return (<div className="font-semibold text-center">
          {row.getValue("SupplyVoltage")} <em>V</em>
        </div>)
        return (<div className="text-gray-300 font-semibold text-right">NA</div>)
      }
    },
    {
      accessorKey: "Location",
      header: ({ column }) => {
        return (
          <div className="text-left">
            <Button variant="ghost" className="px-2" onClick={() => {
              // column.toggleSorting(column.getIsSorted() === "asc")
            }}>
              <MapPinnedIcon className="mr-1 h-5 w-5" />
              Location
              {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />) : <></>}
            </Button>
          </div>
        )
      },
    },
  ]

  useEffect(() => {
    async function fetchSourceInfo() {
      setLoading(true)
      try {
        const sourceInfo = await axios.get(`${import.meta.env.VITE_API}/api/source/`, { withCredentials: true })
        setSourceInfo(sourceInfo.data)
        setLoading(false)
      } catch (error) {
        console.log(error)
      }
    }
    fetchSourceInfo()
  }, [])

  const initialState = {
    columnVisibility: {
      SourceIdNo: false, WaterPermitNo: false, Location: false,
    },
    pagination: {
      pageSize: 8,
    },
  }

  return (
    <>
      <DataTable columns={WaterSourceColumns} data={sourceInfo} initialState={initialState} sorting={sorting} setSorting={setSorting} loading={loading} />
    </>
  )
}

export default WaterSourceTable;