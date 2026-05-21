import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAdminUser, type AdminRole } from "@/lib/admin-auth";
import { CLIENT_ADMIN_ROLES } from "@/lib/admin-rbac";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

type CreateAdminFormValues = {
  email: string;
  role: AdminRole;
  password: string;
  confirmPassword: string;
};

const ROLE_LABELS: Record<(typeof CLIENT_ADMIN_ROLES)[number], string> = {
  super_admin: "Super Admin",
  content_admin: "Content Admin",
  integration_admin: "Integrations Admin",
  analytics_viewer: "Analytics Viewer",
};

export function AdminCreateAdminForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    watch,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateAdminFormValues>({
    defaultValues: {
      email: "",
      role: "content_admin",
      password: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });

  const passwordValue = watch("password");

  const onSubmit = async (values: CreateAdminFormValues) => {
    setStatusMessage(null);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const user = await createAdminUser({
        email: values.email.trim(),
        password: values.password,
        role: values.role,
      });

      setStatusMessage(`Admin account created for ${user.email}.`);
      reset();
    }
    catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not create admin account.");
    }
    finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-w-0 rounded-xl border border-[#CAD7E3] bg-white shadow-[0_1px_6px_rgba(0,0,0,0.2)]">
      <div className="rounded-t-xl bg-[#0F67AE] px-4 py-2.5">
        <h2 className="admin-panel-title font-semibold leading-none text-white">Create Admin</h2>
      </div>

      <form className="grid gap-4 p-4 sm:p-6 xl:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        {statusMessage
          ? <p className="rounded-md bg-[#EEF6FF] px-3 py-2 text-[13px] font-medium text-[#0F67AE] xl:col-span-2">{statusMessage}</p>
          : null}
        {submitError
          ? <p className="rounded-md bg-[#FEE2E2] px-3 py-2 text-[13px] font-medium text-[#991B1B] xl:col-span-2">{submitError}</p>
          : null}

        <div className="space-y-1.5">
          <label htmlFor="create-admin-email" className="text-[22px] font-medium text-[#1E293B]">
            Email
          </label>
          <Input
            id="create-admin-email"
            type="email"
            placeholder="abc@gmail.com"
            className="h-[44px] rounded-md border border-[#AEBCC9] bg-white text-[20px] text-[#1E293B] placeholder:text-[#93A5B7] focus-visible:ring-[#0F67AE]"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /\S[^\s@]*@\S+\.\S+/,
                message: "Enter a valid email address",
              },
            })}
          />
          {errors.email
            ? <p className="text-[12px] font-medium text-[#E73908]">{errors.email.message}</p>
            : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="create-admin-role" className="text-[22px] font-medium text-[#1E293B]">
            Role
          </label>
          <select
            id="create-admin-role"
            className="h-[44px] w-full rounded-md border border-[#AEBCC9] bg-white px-3 text-[18px] text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F67AE]"
            {...register("role", {
              required: "Role is required",
            })}
          >
            {CLIENT_ADMIN_ROLES.map(role => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          {errors.role
            ? <p className="text-[12px] font-medium text-[#E73908]">{errors.role.message}</p>
            : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:col-span-2">
          <div className="space-y-1.5">
            <label htmlFor="create-admin-password" className="text-[22px] font-medium text-[#1E293B]">
              New Password
            </label>
            <div className="relative">
              <Input
                id="create-admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="********"
                className="h-[44px] rounded-md border border-[#AEBCC9] bg-white pr-11 text-[20px] text-[#1E293B] placeholder:text-[#93A5B7] focus-visible:ring-[#0F67AE]"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 12,
                    message: "Password must be at least 12 characters",
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-[#5B6C7C] transition hover:bg-[#F0F5FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F67AE]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password
              ? <p className="text-[12px] font-medium text-[#E73908]">{errors.password.message}</p>
              : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-admin-confirm-password" className="text-[22px] font-medium text-[#1E293B]">
              Confirm New Password
            </label>
            <div className="relative">
              <Input
                id="create-admin-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="********"
                className="h-[44px] rounded-md border border-[#AEBCC9] bg-white pr-11 text-[20px] text-[#1E293B] placeholder:text-[#93A5B7] focus-visible:ring-[#0F67AE]"
                {...register("confirmPassword", {
                  required: "Confirm password is required",
                  validate: value => value === passwordValue || "Passwords do not match",
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(prev => !prev)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-[#5B6C7C] transition hover:bg-[#F0F5FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F67AE]"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword
              ? <p className="text-[12px] font-medium text-[#E73908]">{errors.confirmPassword.message}</p>
              : null}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex h-[44px] w-full rounded-md bg-[#0F67AE] text-[22px] font-semibold text-white hover:bg-[#0A5792] xl:col-span-2"
        >
          {isSubmitting ? "Creating..." : "Create Admin"}
        </Button>
      </form>
    </div>
  );
}
