import frameIcon from "@/assets/Frame.svg";
import { AUTH_CARD_CLASS, AUTH_CARD_CONTENT_CLASS, AUTH_CARD_HEADER_CLASS } from "@/components/auth/auth-card-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_ROUTE_PATHS } from "@/routes/paths";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

type ForgotPasswordValues = {
  email: string;
};

export function ForgotPasswordForm() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    void trigger("email");
  }, [trigger]);

  const onSubmit = (values: ForgotPasswordValues) => {
    console.warn("Forgot password form submitted", values);
    navigate(APP_ROUTE_PATHS.verifyOtp, {
      state: { email: values.email },
    });
  };

  const onGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(APP_ROUTE_PATHS.login, { replace: true });
  };

  return (
    <Card className={AUTH_CARD_CLASS}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onGoBack}
        className="absolute left-6 top-6 h-10 w-10 rounded-full p-0 text-white hover:bg-white/10 hover:text-white focus-visible:ring-[#4BA3D9]"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="sr-only">Go back</span>
      </Button>

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
          <div className="space-y-3">
            <h1 className="text-[42px] font-bold leading-tight text-white">Forget Password</h1>
            <p className="text-sm text-white/90">
              Enter your email address to get a verification code for resetting your password.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="forgot-email" className="sr-only">
              Email
            </Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              {...register("email", { required: "Email is Required" })}
            />
            <p className="min-h-4 text-xs text-[#F44336]">{errors.email?.message ?? " "}</p>
          </div>

          <Button type="submit" className="h-10 w-full bg-[#FF8F00] font-semibold hover:bg-[#F57C00]">
            Send Code
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
