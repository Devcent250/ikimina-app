import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "../ui/button";
import Alert from "../ui/alert";
import { LoaderCircle } from "lucide-react";

export default function ConfirmModal({
  open,
  onClose,
  title,
  description,
  isLoading,
  onConfirm,
  meta,
  error,
}: any) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <AlertDialogContent className="gap-0">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[14px] pt-0 leading-8">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="px-3">
            <Alert variant="destructive">{error}</Alert>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            disabled={isLoading}
            size="sm"
            variant="destructive"
            onClick={() => onConfirm(meta)}
          >
            {isLoading && (
              <LoaderCircle className="mr-2 h-4 w-4 text-white animate-spin" />
            )}
            Yes, I cofirm
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
