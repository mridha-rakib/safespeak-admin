import { Card, CardContent, CardHeader } from "@/components/ui/card";

type AdminPanelPlaceholderProps = {
  title: string;
  description: string;
};

export function AdminPanelPlaceholder({ title, description }: AdminPanelPlaceholderProps) {
  return (
    <Card className="rounded-xl border border-[#D5DEE7] bg-white text-[#111827] shadow-sm">
      <CardHeader className="items-start gap-2 p-6 pb-3">
        <h2 className="text-[22px] font-semibold leading-none text-[#01579B]">{title}</h2>
        <p className="text-sm text-[#607B90]">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4 p-6 pt-0">
        <div className="h-24 rounded-lg border border-dashed border-[#C7D3DF] bg-[#F8FBFF]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="h-20 rounded-lg border border-[#D5DEE7] bg-[#FAFCFF]" />
          <div className="h-20 rounded-lg border border-[#D5DEE7] bg-[#FAFCFF]" />
          <div className="h-20 rounded-lg border border-[#D5DEE7] bg-[#FAFCFF]" />
        </div>
      </CardContent>
    </Card>
  );
}
