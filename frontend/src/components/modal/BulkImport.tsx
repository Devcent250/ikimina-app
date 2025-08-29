import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader, Trash, UploadCloud } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "../ui/button";
import { utils, write } from "xlsx";
import { saveAs } from "file-saver";
import { api } from "@/lib/api";
import { ScrollArea } from "../ui/scroll-area";
import { toast } from "sonner";
import Alert from "../ui/alert";

const allowedExtensions = [".xlsx", ".xls", ".csv"];

const isFileValid = (file) => {
  // Maximum file size in bytes (5MB)
  const maxSize = 20 * 1024 * 1024;

  // Check file size
  if (file.size > maxSize) {
    return {
      code: "file-too-large",
      message: `The file  is large than 20 MB`,
    };
  }

  // Check file type by extension
  const fileExtension = file?.name?.split(".").pop().toLowerCase();
  if (!allowedExtensions.includes(`.${fileExtension}`)) {
    return {
      code: "file-not-allowed",
      message: `The file you upload is not allowed, file must me .xlsx`,
    };
  }

  return null;
};

export function BulkImport({
  open,
  setOpen,
  sample,
  name,
  onComplete,
  endPoint,
}: any) {
  const [file, setFile] = useState(undefined);

  const [fileError, setfileError] = useState("");

  const onDrop = useCallback(async (acceptedFiles: any) => {
    if (acceptedFiles[0]) {
      setfileError("");
    }
    setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    disabled: file,
    validator: isFileValid,
    onDropRejected: (e) => {
      setfileError(e.map((e) => e.errors[0].message)[0]);
    },
  });

  const reset = () => {
    setfileError(undefined);
    setFile(undefined);
    seterror(undefined);
    setsubmiting(false);
  };

  const handleSubmit = async () => {
    try {
      if (!file) return setfileError("Please upload a file.");

      setfileError(undefined);
      seterror(undefined);
      setsubmiting(true);

      const formData = new FormData();
      formData.append("file", file);

      await api.post(endPoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setsubmiting(false);
      toast.success("Data imported successfully");
      setOpen(false);
      onComplete();
      setFile(null);
    } catch (error) {
      setsubmiting(false);
      seterror(error?.response?.data);
    }
  };

  const [submiting, setsubmiting] = useState(false);

  const [error, seterror] = useState(undefined);

  const downloadTemplate = () => {
    var sheetData = sample.map((obj) => Object.values(obj));
    sheetData.unshift(Object.keys(sample[0]));
    var wb = utils.book_new();
    var ws = utils.aoa_to_sheet(sheetData);
    utils.book_append_sheet(wb, ws, "Sheet1");
    const wbout = write(wb, { bookType: "xlsx", type: "array" });
    var blob = new Blob([wbout], { type: "application/octet-stream" });

    saveAs(blob, `sample_${name}_${new Date().toLocaleString("en-US")}.xlsx`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[550px] gap-0 p-0">
        <DialogHeader className="border-b py-3">
          <DialogTitle>
            <span className="text-[15px] px-3 font-semibold block pt-1">
              Upload Bulk Data
            </span>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px]">
          <div className="px-2 pt-3 pb-2">
            <div>
              <div
                {...getRootProps()}
                className={`w-full border-dashed relative cursor-pointer py-4 ${fileError
                    ? "hover:bg-red-100 hover:bg-opacity-70 bg-red-50 border-red-200"
                    : "hover:bg-gray-100 border-gray-200 "
                  } border-2 flex-col  min-h-[100px] mb-4 rounded-md flex items-center justify-center gap-3`}
              >
                <input {...getInputProps()} />

                <>
                  {file ? (
                    <a
                      className="cursor-pointer"
                      onClick={() => {
                        setFile(null);
                      }}
                    >
                      <Trash size={20} className="text-red-800" />
                    </a>
                  ) : (
                    <UploadCloud className="text-primary" />
                  )}
                  <span className="text-sm text-center font-medium   text-gray-600">
                    {file ? (
                      <a
                        target="_blank"
                        href={file}
                        className="text-[13px] cursor-pointer underline"
                      >
                        {file?.name}
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 flex-col justify-center">
                        <span className="text-[13.5px] font-medium text-slate-800">
                          Drag and drop files or{" "}
                          <a
                            href="#"
                            className="cursor-pointer hover:underline text-primary"
                          >
                            Browse
                          </a>
                        </span>
                        <span className="text-sm font-normal text-slate-500">
                          Supported formats: {allowedExtensions.map((e) => e)}
                        </span>
                      </div>
                    )}
                    {fileError && (
                      <span className="text-red-500 capitalize mt-3 text-[13px] font-medium block text-center">
                        {fileError ? "* " + fileError : ""}
                      </span>
                    )}
                  </span>
                </>
              </div>
              {error && (
                <>
                  <Alert variant="danger">{error.error}</Alert>
                  {error?.errorLog?.length > 0 && (
                    <table className="w-full rounded-md mb-2 border-collapse mt-3">
                      <thead>
                        <tr>
                          <th className="border px-2 font-medium text-sm py-1 text-red-500 text-left border-red-500 border-r bg-red-100">
                            Row
                          </th>
                          <th className="border px-2  font-medium  text-sm  text-red-500 py-1 border-red-500 text-left bg-red-100">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {error?.errorLog?.map((error, idx) => (
                          <tr key={idx}>
                            <td className="border border-red-500 bg-red-50 px-2 text-sm py-1">
                              Row {error?.line}
                            </td>
                            <td className="border border-red-500 px-2 bg-red-50 !rounded-br-md text-sm py-1">
                              {error.error}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}

              {!error ? (
                <div className="bg-slate-50 px-2 py-1 border-slate-100 border rounded-md mb-2 mt-3">
                  <ul className="list-decimal pl-5 my-2 text-sm space-y-3 text-slate-500">
                    <li>
                      Download the template{" "}
                      <a
                        onClick={() => downloadTemplate()}
                        className="text-primary cursor-pointer underline"
                      >
                        Click to download
                      </a>
                    </li>
                    <li>Fill the spread sheet with proper data.</li>
                    <li>Upload the data file here.</li>
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="border-t px-3 py-2">
          <div className="flex justify-end mt-3- gap-2 items-end">
            <Button
              onClick={() => {
                reset();
              }}
              variant="outline"
              size="sm"
            >
              Reset
            </Button>
            <Button
              onClick={() => handleSubmit()}
              disabled={submiting}
              size="sm"
            >
              {submiting && (
                <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
              )}
              Start Importing
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BulkImport;
