import { useState } from "react"
import { ColumnDef, SortingState, flexRender, getCoreRowModel, getSortedRowModel, getPaginationRowModel, useReactTable, } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { Skeleton } from "./skeleton"
import { Button } from "./button"

interface DataTableProps<TData, TValue, TInitState, T> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  initialState: TInitState
  loading: T
}

export function DataTable<TData, TValue, TInitState, T>({ columns, data, initialState, loading }: DataTableProps<TData, TValue, TInitState, T>) {
  const [sorting, setSorting] = useState<SortingState>([])
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
      <div className="-mx-4">
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
                <>
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
                </>
              ))
            )
              : (
                <></>
                // <TableRow>
                //   <TableCell colSpan={columns.length} className="h-24 text-center">
                //     No results.
                //   </TableCell>
                // </TableRow>
              )}
            {loading ? Array(5).fill(null).map((item, index) => (
              <TableRow>
                <TableCell className="font-medium"><Skeleton className="w-[80px] h-[20px] rounded-full" /></TableCell>
                <TableCell className="font-medium"><Skeleton className="w-[80px] h-[20px] rounded-full" /></TableCell>
                <TableCell className="font-medium"><Skeleton className="w-[80px] h-[20px] rounded-full" /></TableCell>
                <TableCell className="font-medium"><Skeleton className="w-[50px] h-[20px] rounded-full" /></TableCell>
                <TableCell className="font-medium"><Skeleton className="w-[50px] h-[20px] rounded-full" /></TableCell>
              </TableRow>)
            ) : <></>}
          </TableBody>
        </Table>
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
