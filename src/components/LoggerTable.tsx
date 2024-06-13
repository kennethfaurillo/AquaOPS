import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "./ui/data-table"
import { ArrowDownIcon, ArrowUpIcon, BatteryChargingIcon, CalendarClockIcon, GaugeIcon, MoreHorizontal, RouterIcon, SquareMinusIcon, SquarePlusIcon, WavesIcon } from "lucide-react"
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { useEffect, useState } from "react"
import axios from 'axios'
import { Datalogger, FlowLog } from "./Types"


const dataloggerLatestColumns: ColumnDef<Datalogger>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          ID
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
  },
  {
    accessorKey: "name",
    // header: "Name",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
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
      return (<><p className="font-bold">{row.getValue("name")}</p><p>{row.getValue("type")}</p></>)
    }
  },
  {
    accessorKey: "type",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          Type
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
  },
  {
    accessorKey: "pressure",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          <GaugeIcon className="hidden sm:block xl:hidden 2xl:block mr-1 h-5 w-5" />
          Pressure
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
    cell: ({ row }) => {
      if (parseFloat(row.getValue("pressure"))) return <Button variant="ghost">{parseFloat(row.getValue("pressure"))} psi</Button>
      return (<Button variant="ghost" className="text-gray-300 font-semibold">NA</Button>)
    }
  },
  {
    accessorKey: "flow",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          <WavesIcon className="hidden sm:block xl:hidden 2xl:block mr-1 h-5 w-5" />
          Flow
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
    cell: ({ row }) => {
      if (parseFloat(row.getValue("flow"))) return <Button variant="ghost">{parseFloat(row.getValue("flow"))} lps</Button>
      return (<Button variant="ghost" className="text-gray-300 font-semibold">NA</Button>)
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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(datalogger.id.toString())}>Copy Logger ID</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Logger Data</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
// Placeholder Data
const data: Datalogger[] = [
  {
    id: 0,
    name: 'Binanuaanan',
    type: ['Flow'],
    //@ts-ignore
    pressure: null,
    flow: 11.3,
  },
  {
    id: 1,
    name: 'Piwad Base',
    type: ['Pressure'],
    pressure: 3.1,
    //@ts-ignore
    flow: null,
  },
  {
    id: 2,
    name: 'Sagurong',
    type: ['Pressure'],
    pressure: 15.8,
    //@ts-ignore
    flow: null,
  },
  {
    id: 3,
    name: 'Caroyroyan',
    type: ['Pressure'],
    pressure: 24.44,
    //@ts-ignore
    flow: null,
  },
  {
    id: 4,
    name: 'Curry',
    type: ['Pressure'],
    pressure: 24.29,
    //@ts-ignore
    flow: null,
  },
  {
    id: 5,
    name: 'Himaao',
    type: ['Pressure'],
    pressure: 29.53,
    //@ts-ignore
    flow: null,
  },
  {
    id: 6,
    name: 'San Agustin',
    type: ['Pressure'],
    pressure: 14.24,
    //@ts-ignore
    flow: null,
  },
  {
    id: 7,
    name: 'San Jose',
    type: ['Pressure'],
    pressure: 1.84,
    //@ts-ignore
    flow: null,
  },
  {
    id: 8,
    name: 'St. Paul',
    type: ['Pressure'],
    pressure: 18.84,
    //@ts-ignore
    flow: null,
  },
  {
    id: 9,
    name: 'Mayawpayawan',
    type: ['Pressure'],
    pressure: 20.23,
    //@ts-ignore
    flow: null,
  },
  {
    id: 10,
    name: 'Tagbong',
    type: ['Pressure'],
    pressure: 5.64,
    //@ts-ignore
    flow: null,
  },
]

const dataloggerColumns: ColumnDef<FlowLog>[] = [
  {
    accessorKey: "LoggerId",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          Logger ID
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
  },
  {
    accessorKey: "Name",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          Name
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
    cell: ({ row }) => {
      // return <><p className="font-bold">{row.getValue("Name")}</p></>
      return (
        <div className="max-w-15">
          
          <p className="font-bold">{row.getValue("Name").split('_').slice(2).join(' ').replace('-',' ')}</p>
          <p className="text-sm text-muted-foreground">{row.getValue("LoggerId")}</p>
        </div>)
    }
  },
  {
    accessorKey: "Name",
    id: "Type",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          Type
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
    cell: ({ row }) => {
      // return <><p className="font-bold">{row.getValue("Name")}</p></>
      return <p >{row.getValue("Name").split('_').slice(1,2).join(' ')}</p>
    }
  },
  {
    accessorKey: "Model",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          Model
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
  },
  {
    accessorKey: "FwVersion",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          FwVersion
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
  },
  {
    accessorKey: "Latitude",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          Latitude
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
    
  },
  {
    accessorKey: "Longitude",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          Longitude
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
  },
  {
    accessorKey: "VoltageLimit",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          Voltage Limit
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
    cell: ({row}) => {return row.getValue("VoltageLimit").replaceAll(','," - ") + " V"},
  },
  {
    accessorKey: "FlowLimit",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          Flow Limit
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
    cell: ({row}) => {
      return (row.getValue("FlowLimit") ? row.getValue("FlowLimit").replaceAll(','," - ") + " lps" : <p className="text-gray-300 font-semibold">N/A</p>)
    }
  },
  {
    accessorKey: "PressureLimit",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          Pressure Limit
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
    cell: ({row}) => {
      return (row.getValue("PressureLimit") ? row.getValue("PressureLimit").replaceAll(','," - ") + " psi" :<p className="text-gray-300 font-semibold">N/A</p>)
    }
  },
  {
    accessorKey: "Imei",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          Imei
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
  },
  {
    accessorKey: "Sim",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          Sim
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
  },
]

const flowLogColumns: ColumnDef<FlowLog>[] = [
  {
    accessorKey: "LogId",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          Log ID
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
  },
  {
    accessorKey: "Timestamp",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          <CalendarClockIcon className="mr-1 h-5 w-5" />
          Timestamp
          {/* <ArrowUpDownIcon className="ml-2 h-4 w-4" /> */}
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
    cell: ({ row }) => {
      return (<><p className="font-bold">{row.getValue("Timestamp")}</p><p>{row.getValue("Timestamp")}</p></>)
    }
  },
  {
    accessorKey: "LoggerModel",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          Logger Model
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
  },
  {
    accessorKey: "LoggerId",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          Logger ID
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
    cell: ({ row }) => {
      // return (<><p className="font-bold">{row.getValue("LoggerId")}</p><p>{row.getValue("LoggerId")}</p></>)
      return <p className="font-bold">{row.getValue("LoggerId")}</p>
    }
  },
  {
    accessorKey: "LogTime",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          Log Time
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
  },
  {
    accessorKey: "AverageVoltage",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          <BatteryChargingIcon className="hidden sm:block xl:hidden 2xl:block mr-1 h-5 w-5" />
          Voltage
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
    cell: ({ row }) => {
      if (parseFloat(row.getValue("AverageVoltage"))) return <Button variant="ghost">{parseFloat(row.getValue("AverageVoltage"))} V</Button>
      return (<Button variant="ghost" className="text-gray-300 font-semibold">NA</Button>)
    }
  },
  {
    accessorKey: "CurrentFlow",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          <WavesIcon className="hidden sm:block xl:hidden 2xl:block mr-1 h-5 w-5" />
          Flow
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
    cell: ({ row }) => {
      if (parseFloat(row.getValue("CurrentFlow"))) return <Button variant="ghost">{parseFloat(row.getValue("CurrentFlow"))} lps</Button>
      return (<Button variant="ghost" className="text-gray-300 font-semibold">NA</Button>)
    }
  },
  {
    accessorKey: "TotalFlowPositive",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          <SquarePlusIcon className="hidden sm:block xl:hidden 2xl:block mr-1 h-5 w-5" />
          Totalizer +
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
    cell: ({ row }) => {
      if (parseFloat(row.getValue("TotalFlowPositive"))) return <Button variant="ghost">{parseFloat(row.getValue("TotalFlowPositive"))} lps</Button>
      return (<Button variant="ghost" className="text-gray-300 font-semibold">NA</Button>)
    }
  },
  {
    accessorKey: "TotalFlowNegative",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc")
        }}>
          <SquareMinusIcon className="hidden sm:block xl:hidden 2xl:block mr-1 h-5 w-5" />
          Totalizer -
          {column?.getIsSorted() ? ((column.getIsSorted() === "asc") ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />) : <></>}
        </Button>
      )
    },
    cell: ({ row }) => {
      if (parseFloat(row.getValue("TotalFlowNegative"))) return <Button variant="ghost">{parseFloat(row.getValue("TotalFlowNegative"))} lps</Button>
      return (<Button variant="ghost" className="text-gray-300 font-semibold">NA</Button>)
    }
  },
]

const dat: Datalogger[] = []

function LoggerTable() {
  const [sortDir, setSortDir] = useState(null)
  const [loggerData, setLoggerData] = useState([])
  const [loading, setLoading] = useState(true)

  // console.log(data)

  useEffect(() => {
    async function fetchData() {
      axios.get(`http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api/logger/`).then(response => {
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
      LoggerId: false, Type: false, Model: false, FwVersion: false, Imei: false, Sim:false,
    },
    pagination: {
      pageSize: 8,
    }
  }

  return (
    <>
      <DataTable columns={dataloggerColumns} data={loggerData} initialState={initialState} loading={loading} />
    </>
  )
}

export default LoggerTable;