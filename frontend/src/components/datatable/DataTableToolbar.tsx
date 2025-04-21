"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { DataTableFacetedFilter } from "./DataTableFacetedFilter";
import { DataTableViewOptions } from "./DataTableViewOptions";
import { Fragment, useState } from "react";
import { useDebounce } from "react-use";

import { Download, Search, TrashIcon } from "lucide-react";
import { useMutation } from "react-query";
import { toast } from "sonner";
import useConfirmModal from "@/hooks/useConfirmModal";
import ConfirmModal from "../modal/ConfirmModal";
import { utils, write } from "xlsx";
import { saveAs } from "file-saver";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  facets;
  onSearch;
  Action?: any;
  onExport;
  isLoading;
  enableExport;
  bulkDelete?: any;
  refetch?: any;
}

export function DataTableToolbar<TData>({
  table,
  facets,
  onSearch,
  Action,
  onExport,
  enableExport,
  bulkDelete,
  refetch,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const [search, setsearch] = useState("");

  useDebounce(
    () => {
      onSearch(search);
    },
    700,
    [search]
  );

  const confirmModal = useConfirmModal();

  const selectedRows = table.getSelectedRowModel().rows.map((e) => e.original);

  const deleteAllMutation = useMutation(
    async () => {
      return await bulkDelete(selectedRows);
    },
    {
      onSuccess: () => {
        confirmModal.close();
        refetch();
        table.toggleAllRowsSelected(false);
        toast.success("Deleted successfully");
      },
    }
  );

  const handleExelExport = () => {
    var table = document.getElementById("dataTable");
    var wb = utils.table_to_book(table, { sheet: "Sheet JS" });
    var wbout = write(wb, {
      bookType: "xlsx",
      bookSST: true,
      type: "binary",
    });

    function s2ab(s) {
      var buf = new ArrayBuffer(s.length);
      var view = new Uint8Array(buf);
      for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
      return buf;
    }

    const name = `export-${new Date().toISOString()}.xlsx`;

    saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), name);
  };

  return (
    <>
      <ConfirmModal
        title={"Are you sure you want to delete?"}
        description={`Lorem ipsum dolor sit amet consectetur adipisicing elit. Excepturi, amet
        a! Nihil`}
        meta={confirmModal.meta}
        onConfirm={() => deleteAllMutation.mutate()}
        isLoading={deleteAllMutation.isLoading}
        open={confirmModal.isOpen}
        onClose={() => confirmModal.close()}
      />

      <div className="flex border-b px-3 py-2 items-start gap-3 sm:items-center sm:flex-row flex-col  justify-between">
        <div className="flex flex-1 flex-wrap gap-y-3 items-center space-x-2">
          <div className="relative">
            <Input
              placeholder="Search here..."
              value={search}
              type="search"
              onChange={(event) => setsearch(event.target.value)}
              className="h-8 !shadow-none w-[150px] !bg-white lg:w-[250px]"
            />
            <Search
              className="absolute right-3 text-slate-500 top-2"
              size={15}
            />
          </div>
          {selectedRows.length > 0 && bulkDelete && (
            <Button
              onClick={() => {
                confirmModal.open({});
              }}
              size="sm"
              variant="destructive"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete {selectedRows.length} rows
            </Button>
          )}
          {facets.map((e, i) => {
            return (
              <Fragment key={i}>
                {table.getColumn(e.name) && (
                  <DataTableFacetedFilter
                    column={table.getColumn(e.name)}
                    title={e.title}
                    options={e.options}
                    type={e.type}
                    loader={e.loader}
                    name={e.name}
                    disabled={e.disabled}
                  />
                )}
              </Fragment>
            );
          })}

          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 text-xs text-slate-500 hover:text-slate-600 dark:text-slate-200 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {Action && <Action />}

          {enableExport && (
            <Button
              onClick={() => {
                if (onExport) {
                  onExport();
                } else {
                  handleExelExport();
                }
              }}
              className="hover:bg-white h-[32px]"
              variant="outline"
              size="sm"
            >
              Export to Excel
              <Download size={16} className="ml-2" />
            </Button>
          )}
        </div>

        <DataTableViewOptions table={table} />
      </div>
    </>
  );
}
