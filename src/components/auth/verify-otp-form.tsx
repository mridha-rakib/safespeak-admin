import { useRef } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import frameIcon from "@/assets/Frame.svg";
import { AUTH_CARD_CLASS, AUTH_CARD_CONTENT_CLASS, AUTH_CARD_HEADER_CLASS } from "@/components/auth/auth-card-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { APP_ROUTE_PATHS } from "@/routes/paths";

type VerifyOtpValues = {
  digit1: string;
  digit2: string;
  digit3: string;
  digit4: string;
};

type VerifyOtpLocationState = {
  email?: string;
};

const OTP_FIELDS = ["digit1", "digit2", "digit3", "digit4"] as const;

export function VerifyOtpForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const locationState = location.state as VerifyOtpLocationState | null;
  const contactEmail = locationState?.email || "contact@gmail.com";

  const { register, handleSubmit, setValue, getValues } = useForm<VerifyOtpValues>({
    defaultValues: {
      digit1: "8",
      digit2: "0",
      digit3: "",
      digit4: "",
    },
    mode: "onChange",
  });

  const onSubmit = (values: VerifyOtpValues) => {
    const otpCode = `${values.digit1}${values.digit2}${values.digit3}${values.digit4}`;
    console.log("Verify OTP form submitted", { otpCode, contactEmail });
    navigate(APP_ROUTE_PATHS.resetPassword, {
      state: { email: contactEmail },
    });
  };

  const onResend = () => {
    console.log("Resend OTP requested", { contactEmail });
  };

  const onGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(APP_ROUTE_PATHS.forgotPassword, { replace: true });
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
        <form className="space-y-10" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-[42px] font-bold leading-tight text-white">Verify OTP</h1>
              <p className="text-sm text-white/90">
                Please check your email. We have sent a code to
                {" "}
                {contactEmail}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {OTP_FIELDS.map((field, index) => {
                  const registration = register(field, {
                    onChange: event => {
                      const onlyDigits = event.target.value.replace(/\D/g, "").slice(-1);
                      setValue(field, onlyDigits, { shouldDirty: true, shouldTouch: true });

                      if (onlyDigits && index < OTP_FIELDS.length - 1) {
                        otpInputRefs.current[index + 1]?.focus();
                      }
                    },
                  });

                  return (
                    <Input
                      key={field}
                      maxLength={1}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="-"
                      className="h-16 w-16 rounded-lg border border-white/60 bg-transparent px-0 text-center text-5xl font-bold text-white placeholder:text-white/80 focus-visible:ring-white/60"
                      name={registration.name}
                      onBlur={registration.onBlur}
                      onChange={registration.onChange}
                      onKeyDown={event => {
                        if (event.key !== "Backspace") {
                          return;
                        }

                        if (!getValues(field) && index > 0) {
                          otpInputRefs.current[index - 1]?.focus();
                        }
                      }}
                      ref={element => {
                        registration.ref(element);
                        otpInputRefs.current[index] = element;
                      }}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-sm text-white">
                <p>Didn&apos;t receive code?</p>
                <button
                  type="button"
                  onClick={onResend}
                  className="text-[#FF8F00] underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8F00]"
                >
                  Resend
                </button>
              </div>
            </div>
          </div>

          <Button type="submit" className="h-10 w-full bg-[#FF8F00] font-semibold hover:bg-[#F57C00]">
            Verify
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
