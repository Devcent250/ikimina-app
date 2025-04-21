import {
  ColumnDef,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Table as TanTable } from "@tanstack/react-table";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DataTableToolbar } from "./DataTableToolbar";
import { Card } from "../ui/card";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import Pagination from "../ui/pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  facets;
  isLoading;
  defaultColumnVisibility;
  onSearch;
  columnFilters;
  setColumnFilters;
  setSorting;
  sorting;
  setPagination;
  pageIndex;
  pageSize;
  pageCount;
  title?: string;
  isFetching?: boolean;
  className?: string;
  Action?: any;
  onExport?: any;
  hidePagination?: boolean;
  enableExport?: boolean;
  bulkDelete?: any;
  refetch?: any;
}

function DataTable<TData, TValue>({
  columns,
  data,
  facets,
  defaultColumnVisibility = {},
  isLoading,
  onSearch,
  columnFilters,
  setColumnFilters,
  setSorting,
  sorting,
  setPagination,
  pageIndex,
  isFetching,
  pageSize,
  pageCount,
  className,
  onExport,
  Action,
  hidePagination,
  enableExport = true,
  bulkDelete,
  refetch,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(defaultColumnVisibility);

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  const table = useReactTable({
    data,
    columns,
    manualSorting: true,
    manualPagination: true,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    pageCount: pageCount,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="w-full">
      <Card
        className={cn(
          "shadow-none mt-3 sm:mt-0 relative rounded-md h-full",
          className
        )}
      >
        {isFetching && !isLoading && (
          <div className="progress-bar h-[3px] opacity-70 absolute top-0 rounded-t-md bg-primary/20 w-full overflow-hidden">
            <div className="progress-bar-value w-full h-full bg-primary" />
          </div>
        )}
        <DataTableToolbar
          Action={Action}
          onSearch={onSearch}
          facets={facets}
          table={table}
          onExport={onExport}
          isLoading={isLoading}
          bulkDelete={bulkDelete}
          enableExport={enableExport}
          refetch={refetch}
        />

        <ScrollArea className="w-full max-w-full overflow-x-auto">
          <Table id="dataTable" className="overflow-x-auto">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        className="last:text-right first:w-2 !bg-slate-50 border-slate-200 border-b- bg-slate-100- text-slate-700 font-medium h-9 text-[13px] last:justify-end truncate last:flex last:items-center"
                        key={header.id}
                        colSpan={header.colSpan}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.filter((e) => {
                return !e.original["meta"]?.isFooter;
              })?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <TableCell
                          className={cn(
                            "last:text-right h-full last:justify-end last:flex  last:items-center  !text-slate-600 font-normal border-slate-100",
                            row.original["meta"]?.isFooter &&
                              "font-semibold border-none- border-t bg-primary/10- truncate !py-1.5 h-8 !text-primary text-[12.5px]"
                          )}
                          key={cell.id}
                        >
                          {row.original["meta"]?.isFooter &&
                          (cell.column.id === "select" ||
                            cell.column.id === "actions") ? null : (
                            <>
                              <div className="py-0.5">
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </div>
                            </>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-36 !inline-block= text-center"
                      >
                        <div className="flex items-center justify-center">
                          <LoaderCircle className="mr-2 h-5 w-5 text-primary animate-spin" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-36 text-center"
                      >
                        No results available.
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>

          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {hidePagination ? null : (
          <div className="py-[7px] px-2 border-t bg-white">
            <DataTablePagination pageIndex={pageIndex} table={table} />
          </div>
        )}
      </Card>
    </div>
  );
}

export default DataTable;

interface DataTablePaginationProps<TData> {
  table: TanTable<TData>;
  pageIndex: number;
}

function DataTablePagination<TData>({
  table,
  pageIndex,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center  gap-4 justify-between px-2">
      <div className="flex items-center gap-3">
        {table.getFilteredSelectedRowModel().rows.length ? (
          <div className="flex-1 text-slate-500 font-medium- dark:text-slate-300 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected
          </div>
        ) : null}
        <div className="flex items-center space-x-2">
          <p className="text-[13px] text-slate-500 dark:text-slate-300 font-medium-">
            Rows per page
          </p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-[30px] rounded-md bg-white w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top" className="bg-white">
              {[
                2, 5, 10, 15, 20, 30, 40, 50, 100, 150, 200, 300, 400, 500, 700,
                1000, 2000, 5000, 7500, 10000, 100000000000000,
              ].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Pagination
        currentPage={pageIndex + 1}
        totalPages={table.getPageCount()}
        onPageChange={(e) => {
          table.setPageIndex(e - 1);
        }}
      />

      {/* <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div> */}
    </div>
  );
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}
