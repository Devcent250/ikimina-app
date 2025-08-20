import { useEffect, useState } from "react";
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
import authService from "@/services/auth.service";
import Alert from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth.context";

import { Link, useLocation} from "react-router-dom";
import qs from "qs";
import { Checkbox } from "@/components/ui/checkbox";

import { useId } from "react";

const formSchema = yup.object().shape({
  email: yup
    .string()
    .email()
    .required("Phone number is required")
    .label("Email"),
  password: yup.string().required("Password is required").label("Passcord"),
});

export default function Login() {
  const location = useLocation();

  const form = useForm({
    resolver: yupResolver(formSchema),
    values: {
      email: "",
      password: "",
    },
  });

  const redirect = qs.parse(location.search, {
    ignoreQueryPrefix: true,
  })?.redirect;

  const defaultEmail = qs.parse(location.search, {
    ignoreQueryPrefix: true,
  })?.email;

  useEffect(() => {
    if (defaultEmail) {
      form.setValue("email", defaultEmail);
    }
  }, [defaultEmail]);

  const { setCurrentUser } = useAuth();

  // const navigate = useNavigate();
  const [error, setError] = useState("");

  const submit = async (values: any) => {
    setError("");
    try {
      setError("");
      const res = await authService.signIn({
        email: values.email,
        password: values.password,
      });
      setCurrentUser(res);
      // navigate(redirect || "/dashboard");
      window.location.href=redirect || "/dashboard";
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

  const id = useId();

  return (
    <div className="min-h-screen flex flex-col">
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
                Welcome back Again.
              </CardTitle>
              <CardDescription className="text-center !text-sm">
                Login with your Email or Google account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-3">
              <div>
                {error && <Alert variant="danger">{error}</Alert>}

                <form onSubmit={form.handleSubmit(submit)}>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="phone">Email</Label>
                      <Input
                        placeholder="Enter your email"
                        value={form.watch("email")}
                        onChange={(e) => form.setValue("email", e.target.value)}
                        error={form.formState?.errors["email"]?.message}
                        name="email"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex !mb-2 items-center justify-between">
                        <Label htmlFor="phone">Password</Label>
                        <Link
                          className="text-sm underline"
                          to="/forgot-password"
                        >
                          Forgot Your password?
                        </Link>
                      </div>
                      <Input
                        placeholder="Enter your password"
                        value={form.watch("password")}
                        onChange={(e) =>
                          form.setValue("password", e.target.value)
                        }
                        type="password"
                        error={form.formState?.errors["password"]?.message}
                        name="password"
                      />
                    </div>
                  </div>
                  <div className="flex pt-4 pb-1 items-center gap-2">
                    <Checkbox id={id} />
                    <Label htmlFor={id}>
                      I agree to the{" "}
                      <a
                        className="underline text-primary"
                        href="https://originui.com"
                        target="_blank"
                      >
                        terms of service
                      </a>
                    </Label>
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
                    Login your account
                  </Button>
                </form>
              </div>
            </CardContent>

            <CardFooter className="flex pb-6 flex-col items-center justify-center space-y-2">
              <p className="text-sm text-muted-foreground">
                By continuing, you agree our?{" "}
                <a className="underline text-blue-500">Terms & conditions</a>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
