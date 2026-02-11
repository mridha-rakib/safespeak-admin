import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";

type CreateAdminFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  profileImage?: FileList;
};

export function AdminCreateAdminForm() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedImageName, setSelectedImageName] = useState("");

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateAdminFormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });

  const passwordValue = watch("password");
  const { ref: profileImageRef, ...profileImageField } = register("profileImage");

  const onSubmit = (_values: CreateAdminFormValues) => {};

  return (
    <div className="rounded-xl border border-[#CAD7E3] bg-white shadow-[0_1px_6px_rgba(0,0,0,0.2)]">
      <div className="rounded-t-xl bg-[#0F67AE] px-4 py-2.5">
        <h2 className="text-[44px] font-semibold leading-none text-white">Create Admin</h2>
      </div>

      <form className="space-y-3 p-4 sm:p-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label htmlFor="create-admin-name" className="text-[22px] font-medium text-[#1E293B]">
            Name
          </label>
          <Input
            id="create-admin-name"
            placeholder="john doe"
            className="h-[44px] rounded-md border border-[#AEBCC9] bg-white text-[20px] text-[#1E293B] placeholder:text-[#93A5B7] focus-visible:ring-[#0F67AE]"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name
            ? <p className="text-[12px] font-medium text-[#E73908]">{errors.name.message}</p>
            : null}
        </div>

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

        <div className="grid gap-4 sm:grid-cols-2">
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
                    value: 8,
                    message: "Password must be at least 8 characters",
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

        <div className="space-y-1.5">
          <label htmlFor="create-admin-profile-image" className="text-[22px] font-medium text-[#1E293B]">
            Profile Image
          </label>
          <input
            id="create-admin-profile-image"
            type="file"
            accept="image/*"
            className="hidden"
            {...profileImageField}
            ref={(element) => {
              profileImageRef(element);
              fileInputRef.current = element;
            }}
            onChange={(event) => {
              profileImageField.onChange(event);
              setSelectedImageName(event.target.files?.[0]?.name ?? "");
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-[118px] w-full flex-col items-center justify-center gap-1 rounded-md border border-[#D7E2ED] bg-[#F5F8FC] text-[#7B8694] transition hover:bg-[#EEF4FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F67AE]"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[20px]">
              {selectedImageName || "Upload Image"}
            </span>
          </button>
        </div>

        <Button
          type="submit"
          className="mx-auto mt-2 flex h-[44px] w-full max-w-[640px] rounded-md bg-[#0F67AE] text-[22px] font-semibold text-white hover:bg-[#0A5792]"
        >
          Create Admin
        </Button>
      </form>
    </div>
  );
}
