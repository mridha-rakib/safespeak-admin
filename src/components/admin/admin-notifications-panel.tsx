import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  ChevronLeft,
  Clock3,
  Filter,
  Search,
  Settings2,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type NotificationCategory = "security" | "account" | "usage" | "system";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  dateLabel: string;
  category: NotificationCategory;
  unread: boolean;
  tone: "critical" | "warning" | "info";
  channel: "In-app" | "Email" | "Push";
};

type FilterKey = "all" | "unread" | NotificationCategory;

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "01",
    title: "Profile report escalated",
    body: "User activity triggered an automated escalation. Review and resolve the case.",
    timestamp: "Fri, Feb 11 - 12:30 PM",
    dateLabel: "Today - Feb 11",
    category: "security",
    unread: true,
    tone: "critical",
    channel: "In-app",
  },
  {
    id: "02",
    title: "Verification request pending",
    body: "A new business account submitted documents for manual verification.",
    timestamp: "Fri, Feb 11 - 12:18 PM",
    dateLabel: "Today - Feb 11",
    category: "account",
    unread: true,
    tone: "warning",
    channel: "Email",
  },
  {
    id: "03",
    title: "Usage spike contained",
    body: "Real-time guardrails throttled unusually high traffic from an API key.",
    timestamp: "Fri, Feb 11 - 11:45 AM",
    dateLabel: "Today - Feb 11",
    category: "usage",
    unread: false,
    tone: "info",
    channel: "Push",
  },
  {
    id: "04",
    title: "New user joined",
    body: "Maya Patel created an account and completed onboarding in 2 minutes.",
    timestamp: "Fri, Feb 11 - 10:05 AM",
    dateLabel: "Today - Feb 11",
    category: "account",
    unread: true,
    tone: "info",
    channel: "In-app",
  },
  {
    id: "05",
    title: "Profile report resolved",
    body: "Moderator closed the flagged profile after guideline review.",
    timestamp: "Thu, Feb 10 - 6:42 PM",
    dateLabel: "Yesterday - Feb 10",
    category: "security",
    unread: false,
    tone: "info",
    channel: "Email",
  },
  {
    id: "06",
    title: "System maintenance scheduled",
    body: "Planned downtime on Feb 15 from 1:00 AM-2:00 AM UTC. Alerts will be buffered.",
    timestamp: "Thu, Feb 10 - 4:15 PM",
    dateLabel: "Yesterday - Feb 10",
    category: "system",
    unread: true,
    tone: "warning",
    channel: "Email",
  },
  {
    id: "07",
    title: "Multiple login attempts blocked",
    body: "Four OTP attempts failed for admin account. MFA enforced and access locked.",
    timestamp: "Thu, Feb 10 - 9:14 AM",
    dateLabel: "Yesterday - Feb 10",
    category: "security",
    unread: false,
    tone: "critical",
    channel: "Push",
  },
  {
    id: "08",
    title: "Usage threshold alert",
    body: "Content scans consumed 78% of your weekly allocation. Consider raising limits.",
    timestamp: "Wed, Feb 09 - 3:08 PM",
    dateLabel: "Earlier this week - Feb 09",
    category: "usage",
    unread: true,
    tone: "warning",
    channel: "In-app",
  },
  {
    id: "09",
    title: "New user joined",
    body: "Jonas Lee joined your app via SSO and requested editor permissions.",
    timestamp: "Wed, Feb 09 - 10:22 AM",
    dateLabel: "Earlier this week - Feb 09",
    category: "account",
    unread: false,
    tone: "info",
    channel: "Push",
  },
];

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "security", label: "Security" },
  { key: "account", label: "Accounts" },
  { key: "usage", label: "Usage" },
  { key: "system", label: "System" },
];

const CATEGORY_STYLES: Record<
  NotificationCategory,
  { label: string; bg: string; text: string; icon: typeof ShieldCheck }
> = {
  security: { label: "Security", bg: "bg-[#FDF2F2]", text: "text-[#B91C1C]", icon: ShieldCheck },
  account: { label: "Accounts", bg: "bg-[#F1F5F9]", text: "text-[#0F172A]", icon: UserPlus },
  usage: { label: "Usage", bg: "bg-[#F0F9FF]", text: "text-[#0C4A6E]", icon: Bell },
  system: { label: "System", bg: "bg-[#FFF7ED]", text: "text-[#9A3412]", icon: Settings2 },
};

function getToneColor(tone: NotificationItem["tone"]) {
  if (tone === "critical")
    return "bg-[#FEE2E2] text-[#B91C1C]";

  if (tone === "warning")
    return "bg-[#FFF4E5] text-[#9A3412]";

  return "bg-[#E8F4FF] text-[#0F67AE]";
}

export function AdminNotificationsPanel() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const unreadCount = useMemo(() => items.filter(item => item.unread).length, [items]);
  const criticalCount = useMemo(() => items.filter(item => item.tone === "critical").length, [items]);

  const filterCounts = useMemo(
    () => ({
      all: items.length,
      unread: unreadCount,
      security: items.filter(item => item.category === "security").length,
      account: items.filter(item => item.category === "account").length,
      usage: items.filter(item => item.category === "usage").length,
      system: items.filter(item => item.category === "system").length,
    }),
    [items, unreadCount],
  );

  const groupedEntries = useMemo(() => {
    const filtered = items.filter((item) => {
      if (activeFilter === "all")
        return true;

      if (activeFilter === "unread")
        return item.unread;

      return item.category === activeFilter;
    });

    const groups = filtered.reduce<Record<string, NotificationItem[]>>(
      (acc, item) => {
        acc[item.dateLabel] = acc[item.dateLabel] ? [...acc[item.dateLabel], item] : [item];
        return acc;
      },
      {},
    );

    return Object.entries(groups);
  }, [activeFilter, items]);

  const markAllRead = () => {
    setItems(prev => prev.map(item => ({ ...item, unread: false })));
  };

  const markOneRead = (id: string) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, unread: false } : item)),
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#CAD7E3] bg-white shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
      <div className="flex flex-wrap items-start gap-4 bg-gradient-to-r from-[#0F67AE] to-[#0B4E84] px-6 py-5 text-white">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-md bg-white/10 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-white/80">Alerts Center</p>
            <h2 className="text-[34px] font-semibold leading-none">All Notifications</h2>
            <p className="text-sm text-white/80">
              Stay ahead of moderation, security, and account events in real time.
            </p>
            <div className="flex flex-wrap gap-2 text-[12px] font-semibold">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                <Bell className="h-3.5 w-3.5" />
                {unreadCount}
                {" "}
                unread
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {criticalCount}
                {" "}
                critical
              </span>
            </div>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-9 border border-white/30 bg-white/90 text-[#0F67AE] hover:bg-white"
            onClick={markAllRead}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-9 border border-white/30 bg-white/90 text-[#0F67AE] hover:bg-white"
          >
            <Settings2 className="h-4 w-4" />
            Preferences
          </Button>
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-[#D5E4F2] bg-[#F8FBFF] px-3 py-2 shadow-[0_1px_0_rgba(15,103,174,0.08)]">
              <Search className="h-4 w-4 text-[#4D6778]" />
              <input
                type="text"
                placeholder="Search notifications"
                className="w-full border-none bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#8AA0B3]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map(filter => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
                    activeFilter === filter.key
                      ? "border-[#0F67AE] bg-[#0F67AE] text-white shadow-[0_6px_20px_rgba(15,103,174,0.35)]"
                      : "border-[#D5E4F2] bg-white text-[#0F172A] hover:border-[#0F67AE] hover:text-[#0F67AE]",
                  )}
                  aria-pressed={activeFilter === filter.key}
                >
                  {filter.key === "unread" ? <Bell className="h-3.5 w-3.5" /> : <Filter className="h-3 w-3" />}
                  {filter.label}
                  <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[11px] font-bold">
                    {filterCounts[filter.key]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {groupedEntries.length === 0
            ? (
                <div className="rounded-xl border border-dashed border-[#D5E4F2] bg-[#F8FBFF] px-6 py-10 text-center">
                  <p className="text-[18px] font-semibold text-[#0F172A]">You're all caught up</p>
                  <p className="text-sm text-[#6B7280]">No notifications match this filter.</p>
                </div>
              )
            : (
                <div className="space-y-4">
                  {groupedEntries.map(([dateLabel, groupItems]) => (
                    <section key={dateLabel} className="space-y-2 rounded-xl border border-[#D7E3F0] bg-white/90 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#0F172A]">
                          <Clock3 className="h-4 w-4 text-[#0F67AE]" />
                          <p className="text-[15px] font-semibold">{dateLabel}</p>
                        </div>
                        <span className="text-xs font-semibold text-[#607B90]">
                          {groupItems.length}
                          {" "}
                          items
                        </span>
                      </div>

                      <div className="space-y-2">
                        {groupItems.map((item) => {
                          const category = CATEGORY_STYLES[item.category];
                          const CategoryIcon = category.icon;
                          return (
                            <article
                              key={item.id}
                              className="relative overflow-hidden rounded-lg border border-[#E1EAF2] bg-gradient-to-r from-[#F9FCFF] to-white px-4 py-3 shadow-[0_1px_0_rgba(15,103,174,0.08)] transition hover:-translate-y-0.5 hover:border-[#0F67AE] hover:shadow-[0_10px_30px_rgba(15,103,174,0.12)]"
                            >
                              <div className="flex items-start gap-3">
                                <div className="relative mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F4FF] text-[#0F67AE]">
                                  <Bell className="h-[18px] w-[18px]" />
                                  {item.unread
                                    ? (
                                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
                                      )
                                    : null}
                                </div>

                                <div className="flex-1 space-y-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-[18px] font-semibold leading-tight text-[#0F172A]">
                                        {item.title}
                                      </p>
                                      <p className="text-sm text-[#4D6778]">{item.body}</p>
                                    </div>
                                    {item.unread
                                      ? (
                                          <button
                                            type="button"
                                            onClick={() => markOneRead(item.id)}
                                            className="text-[12px] font-semibold text-[#0F67AE] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F67AE]/30"
                                          >
                                            Mark read
                                          </button>
                                        )
                                      : (
                                          <span className="text-[12px] font-semibold uppercase tracking-wide text-[#6B7280]">
                                            Seen
                                          </span>
                                        )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold", getToneColor(item.tone))}>
                                      {item.tone === "critical"
                                        ? <AlertTriangle className="h-3.5 w-3.5" />
                                        : <ShieldCheck className="h-3.5 w-3.5" />}
                                      {item.tone === "critical"
                                        ? "Critical"
                                        : item.tone === "warning"
                                          ? "Action"
                                          : "Info"}
                                    </span>
                                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold", category.bg, category.text)}>
                                      <CategoryIcon className="h-3.5 w-3.5" />
                                      {category.label}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF2F6] px-2 py-1 text-[11px] font-semibold text-[#0F172A]">
                                      <Clock3 className="h-3.5 w-3.5" />
                                      {item.timestamp}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F6FB] px-2 py-1 text-[11px] font-semibold text-[#0F172A]">
                                      {item.channel}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-[#D7E3F0] bg-[#F8FBFF] p-4 shadow-[0_1px_0_rgba(15,103,174,0.08)]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#0F172A]">Inbox health</p>
              <span className="rounded-full bg-[#0F67AE] px-2 py-1 text-[11px] font-semibold text-white">
                Live
              </span>
            </div>
            <div className="mt-3 space-y-2 text-[12px] text-[#4D6778]">
              <div className="flex items-center justify-between">
                <span>Unread</span>
                <span className="font-semibold text-[#0F172A]">{unreadCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Critical</span>
                <span className="font-semibold text-[#B91C1C]">{criticalCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Channels</span>
                <span className="font-semibold text-[#0F172A]">In-app, Email, Push</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-[#D7E3F0] bg-white p-4 shadow-[0_1px_0_rgba(15,103,174,0.08)]">
            <p className="text-sm font-semibold text-[#0F172A]">Delivery channels</p>
            <div className="space-y-2 text-[12px] text-[#4D6778]">
              <div className="flex items-center justify-between rounded-lg bg-[#F8FBFF] px-3 py-2">
                <span className="font-semibold text-[#0F172A]">In-app</span>
                <span className="text-[11px] font-semibold text-[#0F67AE]">Realtime</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#FFF7ED] px-3 py-2">
                <span className="font-semibold text-[#0F172A]">Email</span>
                <span className="text-[11px] font-semibold text-[#9A3412]">8:00 AM digest</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#F0F9FF] px-3 py-2">
                <span className="font-semibold text-[#0F172A]">Push</span>
                <span className="text-[11px] font-semibold text-[#0C4A6E]">Quiet hours 10p-7a</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#D7E3F0] bg-gradient-to-br from-[#0F67AE]/10 via-white to-white p-4 shadow-[0_1px_0_rgba(15,103,174,0.08)]">
            <p className="text-sm font-semibold text-[#0F172A]">Daily digest</p>
            <p className="mt-1 text-[12px] text-[#4D6778]">
              Send a curated summary to admins every morning.
            </p>
            <Button className="mt-3 w-full bg-[#0F67AE] text-white hover:bg-[#0B4E84]" size="sm">
              Schedule for 9:00 AM
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
