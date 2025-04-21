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
import { Link, useNavigate } from "react-router-dom";
import authService from "@/services/auth.service";

const formSchema = yup.object().shape({
  email: yup.string().email().required("Email is required"),
});

export default function ForgotPassword() {
  const form = useForm({
    resolver: yupResolver(formSchema),
    values: {
      email: "",
    },
  });

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const submit = async (values: any) => {
    try {
      setSuccess("");
      setError("");
      await authService.forgotPassword({
        email: values.email,
      });
      form.reset();
      setSuccess("Check your inbox for reset link");
    } catch (e) {
      setError(e?.response?.data?.message || "An error occured");
      const errors = e?.response?.data?.meta?.errors || {};
      Object.keys(errors)?.forEach((field: any) => {
        form.setError(field, {
          message: errors[field],
        });
      });
    }
  };

  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex justify-between items-center">
          <a href="/">
            <img className="h-8" src="/logo.svg" alt="" />
          </a>
          <div className="flex items-center gap-3">
            <span className="text-slate-600 text-sm mr-2">
              Don't have an account?
            </span>
            <Button
              onClick={() => {
                navigate("/register");
              }}
              size="sm"
              variant="outline"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>
      <div className="bg-gradient-to-b h-full flex-1 from-blue-50 py-36 to-blue-100 flex ivtems-center justify-center p-4">
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
                Forgot Your Password.
              </CardTitle>
              <CardDescription className="text-center !leading-7 !text-sm">
                <span className=" !leading-7">
                  Please enter the email address you'd like your password reset
                  information sent to.
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
                      <Label htmlFor="phone">Enter your email</Label>
                      <Input
                        placeholder="Enter your email"
                        value={form.watch("email")}
                        onChange={(e) => form.setValue("email", e.target.value)}
                        name="email"
                        error={form.formState?.errors["email"]?.message}
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
                    Request reset link.
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
      <footer className="bg-white py-4 border-t">
        <div className="max-w-6xl flex justify-between mx-auto px-6 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>© 2025 RetailPro. All rights reserved.</p>
          <div className="flex gap-4 items-center">
            <a href="/terms" className="underline">
              Terms & Conditions
            </a>
            <a href="/privacy" className="underline">
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
