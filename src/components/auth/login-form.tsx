import frameIcon from "@/assets/Frame.svg";
import { AUTH_CARD_CLASS, AUTH_CARD_CONTENT_CLASS, AUTH_CARD_HEADER_CLASS } from "@/components/auth/auth-card-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ensureValidAdminSession, loginAdmin } from "@/lib/admin-auth";
import { APP_ROUTE_PATHS } from "@/routes/paths";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";

type LoginFormValues = {
  email: string;
  password: string;
  rememberPassword: boolean;
};

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, setValue, watch } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
      rememberPassword: true,
    },
  });

  const rememberPassword = watch("rememberPassword");

  useEffect(() => {
    let isMounted = true;

    const redirectIfSignedIn = async () => {
      try {
        const session = await ensureValidAdminSession();

        if (isMounted && session) {
          navigate(APP_ROUTE_PATHS.adminDashboard, { replace: true });
        }
      }
      catch {
        // Stay on the login page when a stored session cannot be refreshed.
      }
    };

    void redirectIfSignedIn();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      await loginAdmin(
        {
          email: values.email.trim(),
          password: values.password,
        },
        {
          persistSession: values.rememberPassword,
        },
      );
      setStatusMessage("Signed in successfully.");
      const redirectTo = typeof location.state === "object"
        && location.state !== null
        && "from" in location.state
        && typeof location.state.from === "string"
        ? location.state.from
        : APP_ROUTE_PATHS.adminDashboard;

      navigate(redirectTo, { replace: true });
    }
    catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Admin login failed.");
    }
    finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={AUTH_CARD_CLASS}>
      <CardHeader className={AUTH_CARD_HEADER_CLASS}>
        <div className="relative text-center leading-none">
          <p className="text-[42px] font-extrabold tracking-tight text-white">Safe</p>
          <p className="-mt-1 text-[42px] font-extrabold tracking-tight text-white">Speak</p>
          <img
            src={frameIcon}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-[102px] top-[2px] h-[36px] w-[36px]"
          />
        </div>
      </CardHeader>
      <CardContent className={AUTH_CARD_CONTENT_CLASS}>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
          </div>

          {submitError
            ? <p className="rounded-md bg-[#FEE2E2] px-3 py-2 text-sm font-medium text-[#991B1B]">{submitError}</p>
            : null}
          {statusMessage
            ? <p className="rounded-md bg-[#DCFCE7] px-3 py-2 text-sm font-medium text-[#166534]">{statusMessage}</p>
            : null}

          <div className="flex items-center justify-between text-xs text-white">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={rememberPassword}
                onCheckedChange={checked => setValue("rememberPassword", checked === true)}
              />
              <span>Remember password</span>
            </label>
            <Link
              to={APP_ROUTE_PATHS.forgotPassword}
              className="text-[#FF8F00] underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8F00]"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 w-full bg-[#FF8F00] font-semibold hover:bg-[#F57C00]"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
