"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useIsMobile, useIsVerySmall } from "@/hooks/use-mobile"
import { CampaignCard } from "@/components/bot/CampaignCard"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  sorting: SortingState
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>
  showPredictions?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  sorting,
  setSorting,
  showPredictions = false,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const isMobile = useIsMobile()
  const isVerySmall = useIsVerySmall()

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  // For very small screens, show card view
  if (isVerySmall) {
    return (
      <div>
        <div className="flex items-center py-4">
          <Input
            placeholder="Filtruj kampanie..."
            value={(table.getColumn("kampanie")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("kampanie")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        <div className="grid gap-3">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <CampaignCard
                key={row.id}
                campaign={row.original as any}
                showPredictions={showPredictions}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Brak wyników.
            </div>
          )}
        </div>
       
      </div>
    );
  }

  // Default table view for larger screens
  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filtruj kampanie..."
          value={(table.getColumn("kampanie")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("kampanie")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <ScrollArea className="w-full whitespace-nowrap">
          <Table className="min-w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="min-w-[120px]">
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
                      <TableCell key={cell.id} className="p-4 min-w-[120px]">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Brak wyników.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      
    </div>
  )
}
