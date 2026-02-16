import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_ROUTE_PATHS } from "@/routes/paths";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

type ChangePasswordValues = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export function AdminChangePasswordPanel() {
  const navigate = useNavigate();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    mode: "onSubmit",
  });

  const newPasswordValue = watch("newPassword");

  const onSubmit = (_values: ChangePasswordValues) => {};

  return (
    <div className="rounded-xl border border-[#CAD7E3] bg-white shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-3 rounded-t-xl bg-[#0F67AE] px-4 py-2.5">
        <button
          type="button"
          onClick={() => navigate(APP_ROUTE_PATHS.adminSettings)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/95 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Back to settings"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="admin-panel-title font-semibold leading-none text-white">Change Password</h2>
      </div>

      <form className="admin-panel-min-h px-4 pb-8 pt-6 sm:px-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="mx-auto w-full max-w-[760px] space-y-2">
          <div className="space-y-1">
            <label htmlFor="current-password" className="text-[22px] font-medium text-[#1E3A4F]">
              Current Password
            </label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="********"
                className="h-[46px] rounded-md border border-[#AEBCC9] bg-white pr-11 text-[20px] text-[#1E293B] placeholder:text-[#93A5B7] focus-visible:ring-[#0F67AE]"
                {...register("currentPassword", { required: "Current password is required" })}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(prev => !prev)}
                aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-[#5B6C7C] transition hover:bg-[#F0F5FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F67AE]"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.currentPassword
              ? <p className="text-[12px] font-medium text-[#E73908]">{errors.currentPassword.message}</p>
              : null}
          </div>

          <div className="space-y-1">
            <label htmlFor="new-password" className="text-[22px] font-medium text-[#1E3A4F]">
              New Password
            </label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                placeholder="********"
                className="h-[46px] rounded-md border border-[#AEBCC9] bg-white pr-11 text-[20px] text-[#1E293B] placeholder:text-[#93A5B7] focus-visible:ring-[#0F67AE]"
                {...register("newPassword", {
                  required: "New password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(prev => !prev)}
                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-[#5B6C7C] transition hover:bg-[#F0F5FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F67AE]"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword
              ? <p className="text-[12px] font-medium text-[#E73908]">{errors.newPassword.message}</p>
              : null}
          </div>

          <div className="space-y-1">
            <label htmlFor="confirm-new-password" className="text-[22px] font-medium text-[#1E3A4F]">
              Confirm New Password
            </label>
            <div className="relative">
              <Input
                id="confirm-new-password"
                type={showConfirmNewPassword ? "text" : "password"}
                placeholder="********"
                className="h-[46px] rounded-md border border-[#AEBCC9] bg-white pr-11 text-[20px] text-[#1E293B] placeholder:text-[#93A5B7] focus-visible:ring-[#0F67AE]"
                {...register("confirmNewPassword", {
                  required: "Confirm new password is required",
                  validate: value => value === newPasswordValue || "Passwords do not match",
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmNewPassword(prev => !prev)}
                aria-label={showConfirmNewPassword ? "Hide confirm password" : "Show confirm password"}
                className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-[#5B6C7C] transition hover:bg-[#F0F5FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F67AE]"
              >
                {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmNewPassword
              ? <p className="text-[12px] font-medium text-[#E73908]">{errors.confirmNewPassword.message}</p>
              : null}
          </div>

          <div className="flex justify-end">
            <Link
              to={APP_ROUTE_PATHS.forgotPassword}
              className="text-[14px] font-medium text-[#0A8D8D] underline underline-offset-2 transition hover:text-[#066D6D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="mt-3 h-[46px] w-full rounded-md bg-[#0F67AE] text-[22px] font-semibold text-white hover:bg-[#0A5792]"
          >
            Change Password
          </Button>
        </div>
      </form>
    </div>
  );
}
