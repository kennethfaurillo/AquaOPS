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
            {loading ? Array(5).fill(null).map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium"><Skeleton className="bg-gray-300 w-[80px] h-[20px] rounded-full" /></TableCell>
                <TableCell className="font-medium"><Skeleton className="bg-gray-300 w-[60px] h-[20px] rounded-full" /></TableCell>
                <TableCell className="font-medium"><Skeleton className="bg-gray-300 w-[70px] h-[20px] rounded-full" /></TableCell>
                <TableCell className="font-medium"><Skeleton className="bg-gray-300 w-[60px] h-[20px] rounded-full" /></TableCell>
              </TableRow>)
            ) : null}
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
