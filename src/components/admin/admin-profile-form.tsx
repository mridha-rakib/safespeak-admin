import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Pencil } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";

type AdminProfileValues = {
  userName: string;
  email: string;
  contactNo: string;
};

export function AdminProfileForm() {
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [avatarLabel, setAvatarLabel] = useState("MA");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminProfileValues>({
    defaultValues: {
      userName: "userdemo",
      email: "email@gmail.com",
      contactNo: "+1 222 333 4444",
    },
  });

  const onSubmit = (values: AdminProfileValues) => {
    setStatusMessage(`Profile updated for ${values.userName}.`);
    setIsEditing(false);
  };

  return (
    <div className="rounded-xl border border-[#CAD7E3] bg-white shadow-[0_1px_6px_rgba(0,0,0,0.2)]">
      <div className="rounded-t-xl bg-[#0F67AE] px-4 py-2.5">
        <h2 className="admin-panel-title font-semibold leading-none text-white">Profile</h2>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex w-full flex-col gap-5 border-b border-[#E2EAF2] pb-5 lg:flex-row lg:items-center lg:justify-between">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => {
              const fileName = event.target.files?.[0]?.name;
              if (!fileName) {
                return;
              }

              setAvatarLabel(fileName.slice(0, 2).toUpperCase());
              setStatusMessage(`Profile image ready: ${fileName}`);
            }}
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:flex-1">
            <div className="relative w-fit">
              <div className="flex h-[98px] w-[98px] items-center justify-center rounded-full bg-gradient-to-br from-[#2D3E4F] to-[#8897A5] text-[30px] font-semibold text-white">
                {avatarLabel}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#D3D8DE] text-[#5D6975] transition hover:bg-[#C7CED6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F67AE]"
                aria-label="Update profile picture"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-[30px] font-semibold leading-none text-[#34475A] sm:text-[36px] lg:text-[44px]">Mr. Admin</h3>
              <p className="mt-2 text-[15px] text-[#607B90]">
                Manage the core account details used across the SafeSpeak admin workspace.
              </p>
              {statusMessage
                ? <p className="mt-3 text-[13px] font-medium text-[#0F67AE]">{statusMessage}</p>
                : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setStatusMessage("Editing enabled. Update the fields and save when ready.");
            }}
            className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-[#D8E3EE] bg-[#F7FAFE] px-4 py-3 text-[18px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF] hover:text-[#0A5792] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F67AE] sm:w-auto"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </button>
        </div>

        <form className="mt-6 grid gap-4 xl:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <label htmlFor="profile-user-name" className="text-[22px] font-medium text-[#1E293B]">
              User Name
            </label>
            <Input
              id="profile-user-name"
              disabled={!isEditing}
              className="h-[44px] rounded-md border border-[#AEBCC9] bg-white text-[20px] text-[#1E293B] placeholder:text-[#93A5B7] focus-visible:ring-[#0F67AE]"
              {...register("userName", { required: "User name is required" })}
            />
            {errors.userName
              ? <p className="text-[12px] font-medium text-[#E73908]">{errors.userName.message}</p>
              : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-email" className="text-[22px] font-medium text-[#1E293B]">
              Email
            </label>
            <Input
              id="profile-email"
              type="email"
              disabled={!isEditing}
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

          <div className="space-y-1.5 xl:col-span-2">
            <label htmlFor="profile-contact-no" className="text-[22px] font-medium text-[#1E293B]">
              Contact No
            </label>
            <Input
              id="profile-contact-no"
              disabled={!isEditing}
              className="h-[44px] rounded-md border border-[#AEBCC9] bg-white text-[20px] text-[#1E293B] placeholder:text-[#93A5B7] focus-visible:ring-[#0F67AE]"
              {...register("contactNo", { required: "Contact number is required" })}
            />
            {errors.contactNo
              ? <p className="text-[12px] font-medium text-[#E73908]">{errors.contactNo.message}</p>
              : null}
          </div>

          <Button
            type="submit"
            disabled={!isEditing}
            className="mt-2 h-[44px] w-full rounded-md bg-[#0F67AE] text-[22px] font-semibold text-white hover:bg-[#0A5792] xl:col-span-2"
          >
            Update Profile
          </Button>
        </form>
      </div>
    </div>
  );
}
