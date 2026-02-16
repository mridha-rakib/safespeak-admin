import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ban, ChevronDown, Eye, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  joinedDate: string;
  phone: string;
};

const USERS: AdminUser[] = [
  { id: "01", name: "Robert Fox", email: "fox@email.com", joinedDate: "02-24-2024", phone: "+123124" },
  { id: "02", name: "Robert Fox", email: "fox@email.com", joinedDate: "02-24-2024", phone: "+123124" },
  { id: "03", name: "Robert Fox", email: "fox@email.com", joinedDate: "02-24-2024", phone: "+123124" },
  { id: "04", name: "Robert Fox", email: "fox@email.com", joinedDate: "02-24-2024", phone: "+123124" },
  { id: "05", name: "Robert Fox", email: "fox@email.com", joinedDate: "02-24-2024", phone: "+123124" },
  { id: "06", name: "Robert Fox", email: "fox@email.com", joinedDate: "02-24-2024", phone: "+123124" },
  { id: "07", name: "Robert Fox", email: "fox@email.com", joinedDate: "02-24-2024", phone: "+123124" },
  { id: "08", name: "Robert Fox", email: "fox@email.com", joinedDate: "02-24-2024", phone: "+123124" },
];

type UsersTab = "all" | "blocked";

export function AdminUsersList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [blockTarget, setBlockTarget] = useState<AdminUser | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(USERS.map(user => user.id));

  const activeTab: UsersTab = searchParams.get("tab") === "blocked" ? "blocked" : "all";
  const isBlockedTab = activeTab === "blocked";

  const setActiveTab = (tab: UsersTab) => {
    const params = new URLSearchParams(searchParams);

    if (tab === "blocked") {
      params.set("tab", "blocked");
    }
    else {
      params.delete("tab");
    }

    setSearchParams(params, { replace: true });
  };

  const filteredUsers = useMemo(() => {
    const sourceUsers = activeTab === "blocked"
      ? USERS.filter(user => blockedUserIds.includes(user.id))
      : USERS;

    const query = searchTerm.toLowerCase().trim();

    if (!query) {
      return sourceUsers;
    }

    return sourceUsers.filter(user =>
      `${user.name} ${user.email}`.toLowerCase().includes(query),
    );
  }, [activeTab, blockedUserIds, searchTerm]);

  const onConfirmBlock = () => {
    if (!blockTarget) {
      return;
    }

    setBlockedUserIds(prev => (prev.includes(blockTarget.id) ? prev : [...prev, blockTarget.id]));
    setBlockTarget(null);
  };

  return (
    <>
      <div className="rounded-xl border border-[#CAD7E3] bg-white p-3 shadow-[0_1px_6px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-3 rounded-md bg-[#0F67AE] px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[20px] font-semibold text-white">
            {isBlockedTab ? "Blocked List" : "User List"}
          </h2>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-auto">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#607B90]"
                aria-hidden="true"
              />
              <Input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Search User"
                className="h-8 w-full rounded-md border border-transparent bg-white pl-8 text-xs text-[#1E293B] shadow-none focus-visible:ring-[#4BA3D9] sm:w-[190px]"
              />
            </div>
            {!isBlockedTab
              ? (
                  <Button
                    type="button"
                    onClick={() => setActiveTab("blocked")}
                    className="h-8 rounded-md bg-[#0A4F88] px-3 text-xs font-semibold text-white hover:bg-[#084777] sm:w-auto"
                  >
                    Blocked Users
                  </Button>
                )
              : (
                  <Button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className="h-8 rounded-md bg-[#0A4F88] px-3 text-xs font-semibold text-white hover:bg-[#084777] sm:w-auto"
                  >
                    User List
                  </Button>
                )}
          </div>
        </div>

        <div className="px-2 pb-1 pt-3">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1 rounded border border-[#C9D8E5] bg-white px-2 text-[11px] font-medium text-[#1E293B] transition hover:bg-[#F6FAFE]"
            >
              Date
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-y-1.5">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-[#607B90]">
                  <th className="px-2 py-1">S.ID</th>
                  <th className="px-2 py-1">Full Name</th>
                  <th className="px-2 py-1">Email</th>
                  {isBlockedTab ? <th className="px-2 py-1">Phone No</th> : null}
                  <th className="px-2 py-1">Joined Date</th>
                  <th className="px-2 py-1">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isBlocked = blockedUserIds.includes(user.id);

                  return (
                    <tr
                      key={`${user.id}-${user.email}`}
                      className={`rounded-md text-[12px] text-[#1E293B] ${!isBlockedTab && isBlocked ? "opacity-55" : ""}`}
                    >
                      <td className="rounded-l-md bg-white px-2 py-2">{user.id}</td>
                      <td className="bg-white px-2 py-2">
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#EAF1F7] text-[10px] font-semibold text-[#0F67AE]">
                            RF
                          </span>
                          {user.name}
                        </div>
                      </td>
                      <td className="bg-white px-2 py-2 text-[#607B90]">{user.email}</td>
                      {isBlockedTab ? <td className="bg-white px-2 py-2 text-[#607B90]">{user.phone}</td> : null}
                      <td className="bg-white px-2 py-2 text-[#607B90]">{user.joinedDate}</td>
                      <td className="rounded-r-md bg-white px-2 py-2">
                        <div className="flex items-center gap-2">
                          {isBlockedTab
                            ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBlockedUserIds(prev => prev.filter(id => id !== user.id));
                                    if (blockedUserIds.length === 1) {
                                      setActiveTab("all");
                                    }
                                  }}
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#0F67AE] transition hover:bg-[#EDF6FF]"
                                  aria-label={`Unblock ${user.name}`}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                              )
                            : (
                                <button
                                  type="button"
                                  onClick={() => setBlockTarget(user)}
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#E73908] transition hover:bg-[#FFF2EE]"
                                  aria-label={`Block ${user.name}`}
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </button>
                              )}
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#0F67AE] transition hover:bg-[#EDF6FF]"
                            aria-label={`View ${user.name}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0
                  ? (
                      <tr>
                        <td
                          colSpan={isBlockedTab ? 6 : 5}
                          className="rounded-md bg-white px-3 py-8 text-center text-sm text-[#607B90]"
                        >
                          {isBlockedTab
                            ? "No blocked users found."
                            : "No users found for this search."}
                        </td>
                      </tr>
                    )
                  : null}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-[#D8E3EE] pt-2 text-[10px] font-medium text-[#607B90] sm:flex-row sm:items-center sm:justify-between">
            <p>
              SHOWING 1-
              {filteredUsers.length}
              {" "}
              OF
              {" "}
              {activeTab === "blocked" ? blockedUserIds.length : 250}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
              <button type="button" className="rounded px-1.5 py-0.5 hover:bg-[#EEF5FC]">
                {"<"}
              </button>
              <button type="button" className="rounded bg-[#0F67AE] px-1.5 py-0.5 text-white">
                1
              </button>
              <button type="button" className="rounded px-1.5 py-0.5 hover:bg-[#EEF5FC]">
                2
              </button>
              <span>...</span>
              <button type="button" className="rounded px-1.5 py-0.5 hover:bg-[#EEF5FC]">
                60
              </button>
              <button type="button" className="rounded px-1.5 py-0.5 hover:bg-[#EEF5FC]">
                120
              </button>
              <button type="button" className="rounded px-1.5 py-0.5 hover:bg-[#EEF5FC]">
                {">"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedUser
        ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/15 p-4">
              <div className="w-full max-w-[360px] rounded-md border border-[#D6DFEA] bg-white p-4 shadow-xl">
                <div className="text-center">
                  <h3 className="text-[36px] font-semibold leading-none text-[#1E4B63]">User Details</h3>
                  <p className="mt-1 text-[11px] text-[#607B90]">
                    See all details about
                    {selectedUser.name}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 border-b border-[#E2EBF4] pb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF1F7] text-[11px] font-semibold text-[#0F67AE]">
                    JD
                  </span>
                  <p className="font-semibold text-[#1E293B]">{selectedUser.name}</p>
                </div>

                <dl className="mt-3 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <dt className="font-semibold text-[#1E293B]">Name</dt>
                    <dd className="text-[#607B90]">{selectedUser.name}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="font-semibold text-[#1E293B]">Email</dt>
                    <dd className="text-[#607B90]">{selectedUser.email}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="font-semibold text-[#1E293B]">Phone</dt>
                    <dd className="text-[#607B90]">{selectedUser.phone}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="font-semibold text-[#1E293B]">Joining Date</dt>
                    <dd className="text-[#607B90]">{selectedUser.joinedDate}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="font-semibold text-[#1E293B]">User insights</dt>
                    <dd className="text-[#0F67AE]">
                      <Eye className="h-3.5 w-3.5" />
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="h-7 rounded-sm border border-[#9CB4C8] text-[11px] font-semibold text-[#3D5A73] transition hover:bg-[#F4F8FC]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isBlockedTab) {
                        setBlockedUserIds(prev => prev.filter(id => id !== selectedUser.id));
                        if (blockedUserIds.length === 1) {
                          setActiveTab("all");
                        }
                      }
                      else {
                        setBlockTarget(selectedUser);
                      }
                      setSelectedUser(null);
                    }}
                    className="h-7 rounded-sm bg-[#0F67AE] text-[11px] font-semibold text-white transition hover:bg-[#0A5792]"
                  >
                    {isBlockedTab ? "Unblock" : "Block"}
                  </button>
                </div>
              </div>
            </div>
          )
        : null}

      {blockTarget
        ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
              <div className="w-full max-w-[300px] rounded-md border border-[#D6DFEA] bg-white p-4 shadow-xl">
                <h3 className="text-center text-[24px] font-semibold leading-tight text-[#1E293B]">
                  Do you want to Block this user?
                </h3>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBlockTarget(null)}
                    className="h-7 rounded-sm border border-[#9CB4C8] text-[11px] font-semibold text-[#3D5A73] transition hover:bg-[#F4F8FC]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onConfirmBlock}
                    className="h-7 rounded-sm bg-[#E73908] text-[11px] font-semibold text-white transition hover:bg-[#D53306]"
                  >
                    Yes, Confirm
                  </button>
                </div>
              </div>
            </div>
          )
        : null}
    </>
  );
}
