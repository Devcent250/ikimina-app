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
import authService from "@/services/auth.service";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth.context";
import { useState } from "react";
import { Loader } from "lucide-react";

export default function LogoutModal({ open, onClose }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuth();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <AlertDialogContent className="max-w-[400px]">
        <AlertDialogHeader className="">
          <AlertDialogTitle className="font-semibold">
            Are you sure you want to logout?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-7">
            This action cannot be undone. This will permanently logout your
            account and remove your data from this device.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            disabled={isLoading}
            size="sm"
            variant="destructive"
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => {
                authService.logout();
                navigate("/");
                setIsLoading(false);
                logout();
              }, 500);
            }}
          >
            {isLoading && (
              <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
            )}
            Yes, Logout
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
