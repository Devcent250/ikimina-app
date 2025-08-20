import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoaderCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Alert from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import * as Yup from "yup";
import authService from "@/services/auth.service";
import qs from "qs";

const formSchema = yup.object().shape({
  password: yup.string().required("Enter new password").label("Password"),
  confirmPassword: yup
    .string()
    .required("Confirm new password")
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .label("Confirm Password"),
});

export default function ResetPassword() {
  const form = useForm({
    resolver: yupResolver(formSchema),
    values: {
      password: "",
      confirmPassword: "",
    },
  });

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const token = qs.parse(location.search, {
    ignoreQueryPrefix: true,
  })?.token;

  const submit = async (values: any) => {
    try {
      setSuccess("");
      setError("");
      await authService.resetPassword({
        password: values.password,
        token: token,
      });
      form.reset();
      setSuccess("Password reset success");
      setError("");
      form.reset();
    } catch (error) {
      console.log(error);
      setError(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 flex items-center justify-center p-4">
      <motion.div
        layout
        className={`h-auto`}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "tween",
          duration: 0.2,
          ease: "easeOut",
        }}
      >
        {" "}
        <Card className="w-[400px] transition-all max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg text-center">
              Reset Your Password.
            </CardTitle>
            <CardDescription className="text-center !leading-7 !text-sm">
              <span className=" !leading-7">
                Enter your new password below to change your password.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-3">
            <div>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              <form onSubmit={form.handleSubmit(submit)}>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="phone">Enter new password</Label>
                    <Input
                      placeholder="Enter your password"
                      value={form.watch("password")}
                      onChange={(e) =>
                        form.setValue("password", e.target.value)
                      }
                      type="password"
                      error={form.formState?.errors["password"]?.message}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone">Confirm new password</Label>
                    <Input
                      placeholder="Confirm your password"
                      value={form.watch("confirmPassword")}
                      onChange={(e) =>
                        form.setValue("confirmPassword", e.target.value)
                      }
                      type="password"
                      error={form.formState?.errors["confirmPassword"]?.message}
                    />
                  </div>
                </div>
                <Button
                  disabled={form.formState.isSubmitting}
                  onClick={form.handleSubmit(submit)}
                  className="w-full mt-4"
                  type="submit"
                >
                  {form.formState.isSubmitting && (
                    <LoaderCircle
                      className="-ms-1 me-2 animate-spin"
                      size={16}
                    />
                  )}
                  Reset Your password.
                </Button>
              </form>
            </div>
          </CardContent>

          <CardFooter className="flex pb-6 flex-col items-center justify-center space-y-2">
            <Link
              to={"/"}
              className="underline font-medium text-sm text-blue-500"
            >
              Back to login.
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
