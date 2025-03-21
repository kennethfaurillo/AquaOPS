import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Button } from "./button"
import { Skeleton } from "./skeleton"


interface DataTableProps<TData, TValue, TInitState, TSorting, TSetSorting, TLoading> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  initialState: TInitState,
  sorting: TSorting,
  setSorting: TSetSorting,
  loading: TLoading
}

export function DataTable<TData, TValue, TInitState, TSorting, TSetSorting, TLoading>({ columns, data, initialState, sorting, setSorting, loading }: DataTableProps<TData, TValue, TInitState, TSorting, TSetSorting, TLoading>) {
  const test = {
    pagination: {
      pageSize: 8,
    }
  }
  const table = useReactTable({
    data,
    columns,
    initialState: initialState ?? test,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting
    }
  })

  return (
    // <div className="rounded-md border">
    <>
      <div className="-mx-5 sm:-mx-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )
              : !loading ?
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
                : null
            }
          </TableBody>
        </Table>
          {1 ? 
              <div className="flex items-center justify-center h-full w-full bg-slate-50 rounded-lg  border-slate-200 p-6">
                <div className="text-center">
                  <div className="animate-spin mb-3 h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full mx-auto"></div>
                  <p className="text-slate-600 font-medium">Loading logger data...</p>
                  <p className="text-slate-400 text-sm">Please wait a moment</p>
                </div>
              </div>
             : null}
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
    </>
  )
}
