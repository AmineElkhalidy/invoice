"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSessionClient,
  changePassword,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  type UserData,
} from "@/lib/auth";

// ── Eye icon ─────────────────────────────────────────────────────────────────
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="h-4 w-4" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="h-4 w-4" aria-hidden="true">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

// ── User Avatar ───────────────────────────────────────────────────────────────
function UserAvatar({ name, role }: { name: string; role: "admin" | "user" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const gradient =
    role === "admin"
      ? "from-amber-400 to-orange-500"
      : "from-violet-400 to-purple-500";
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-bold text-white shadow-lg`}
    >
      {initials || "?"}
    </div>
  );
}

// ── PasswordField ─────────────────────────────────────────────────────────────
function PasswordField({
  id,
  label,
  value,
  onChange,
  required,
  accentClass = "focus:border-amber-500/50 focus:ring-amber-500/20",
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  accentClass?: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-slate-300 text-sm">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`border-white/15 bg-white/5 text-white placeholder:text-slate-500 pr-10 ${accentClass}`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  );
}

// ── Alert Banner ─────────────────────────────────────────────────────────────
function AlertBanner({ msg }: { msg: { type: "success" | "error"; text: string } }) {
  const isSuccess = msg.type === "success";
  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
        isSuccess
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
          : "border-red-500/25 bg-red-500/10 text-red-400"
      }`}
    >
      {isSuccess ? (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      {msg.text}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { t } = useLocale();
  const session = getSessionClient();

  // ── Tab ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"password" | "users">("password");

  // ── Password Change State ─────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // ── User Management State ─────────────────────────────────────────────────
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formUsername, setFormUsername] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "user">("user");
  const [userMsg, setUserMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const loadUsers = useCallback(async () => {
    const list = await fetchUsers();
    setUsers(list);
    setUsersLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ── Password Change ───────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) { setPwMsg({ type: "error", text: t("passwordMismatch") }); return; }
    if (newPw.length < 4) { setPwMsg({ type: "error", text: "Min. 4 characters" }); return; }
    setPwLoading(true);
    const result = await changePassword(session!.username, currentPw, newPw);
    setPwLoading(false);
    if (result.success) {
      setPwMsg({ type: "success", text: t("passwordChanged") });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } else {
      setPwMsg({ type: "error", text: result.error === "wrong_current_password" ? t("wrongCurrentPassword") : "Error" });
    }
  };

  // ── User CRUD ─────────────────────────────────────────────────────────────
  const resetUserForm = () => {
    setEditingId(null); setFormUsername(""); setFormDisplayName("");
    setFormPassword(""); setFormRole("user"); setUserMsg(null);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserMsg(null);
    setUserLoading(true);
    if (editingId) {
      const data: { displayName?: string; role?: "admin" | "user"; password?: string } = {
        displayName: formDisplayName, role: formRole,
      };
      if (formPassword) data.password = formPassword;
      const result = await updateUser(editingId, data);
      setUserLoading(false);
      if (result.success) { resetUserForm(); loadUsers(); }
      else setUserMsg({ type: "error", text: result.error || "Error" });
    } else {
      if (!formUsername.trim() || !formPassword) {
        setUserMsg({ type: "error", text: "Username and password required" });
        setUserLoading(false); return;
      }
      const result = await createUser(formUsername, formPassword, formDisplayName, formRole);
      setUserLoading(false);
      if (result.success) { resetUserForm(); loadUsers(); }
      else setUserMsg({ type: "error", text: result.error === "username_exists" ? t("usernameExists") : result.error || "Error" });
    }
  };

  const handleEditUser = (user: UserData) => {
    setEditingId(user.id); setFormUsername(user.username);
    setFormDisplayName(user.displayName); setFormPassword(""); setFormRole(user.role);
    setUserMsg(null);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t("confirmDeleteUser"))) return;
    await deleteUser(userId);
    loadUsers();
  };

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="h-4.5 w-4.5 text-slate-200" aria-hidden="true">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t("settings")}</h1>
            <p className="text-sm text-slate-500">{t("adminPanel")}</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        <button
          onClick={() => setActiveTab("password")}
          id="tab-password"
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
            activeTab === "password"
              ? "bg-amber-500/15 text-amber-400 shadow-sm border border-amber-500/20"
              : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="h-4 w-4" aria-hidden="true">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {t("changePassword")}
        </button>
        <button
          onClick={() => setActiveTab("users")}
          id="tab-users"
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
            activeTab === "users"
              ? "bg-violet-500/15 text-violet-400 shadow-sm border border-violet-500/20"
              : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="h-4 w-4" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          {t("manageUsers")}
        </button>
      </div>

      {/* ── Password Tab ─────────────────────────────────────────────────── */}
      {activeTab === "password" && (
        <div className="animate-in fade-in duration-200">
          <Card className="mx-auto max-w-md border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/30">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="h-5 w-5 text-white" aria-hidden="true">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">{t("changePassword")}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{t("loggedInAs")} <span className="font-mono text-slate-400">@{session?.username}</span></p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <PasswordField
                  id="current-password"
                  label={t("currentPassword")}
                  value={currentPw}
                  onChange={setCurrentPw}
                  required
                />
                <PasswordField
                  id="new-password"
                  label={t("newPassword")}
                  value={newPw}
                  onChange={setNewPw}
                  required
                />
                <PasswordField
                  id="confirm-password"
                  label={t("confirmNewPassword")}
                  value={confirmPw}
                  onChange={setConfirmPw}
                  required
                />

                {/* Strength hint */}
                {newPw.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            i < Math.min(Math.floor(newPw.length / 3), 4)
                              ? newPw.length < 6 ? "bg-red-500" : newPw.length < 10 ? "bg-amber-500" : "bg-emerald-500"
                              : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {newPw.length < 4 ? "Too short" : newPw.length < 6 ? "Weak" : newPw.length < 10 ? "Medium" : "Strong"}
                    </p>
                  </div>
                )}

                {pwMsg && <AlertBanner msg={pwMsg} />}

                <Button
                  type="submit"
                  disabled={pwLoading}
                  id="change-password-button"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold shadow-lg shadow-amber-500/25 transition-all duration-200 active:scale-[0.98]"
                >
                  {pwLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                      </svg>
                      Updating…
                    </span>
                  ) : t("changePassword")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Users Tab ────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div className="animate-in fade-in duration-200 grid gap-6 lg:grid-cols-[1fr_1fr]">

          {/* ── Left: Form ─────────────────────────────────────────────── */}
          <div ref={formRef}>
            <Card className="border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/30 sticky top-6">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-lg shrink-0 ${editingId ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20" : "bg-gradient-to-br from-violet-400 to-purple-500 shadow-violet-500/20"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="h-5 w-5 text-white" aria-hidden="true">
                      {editingId ? (
                        <><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></>
                      ) : (
                        <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></>
                      )}
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      {editingId ? t("updateUser") : t("addUser")}
                    </h2>
                    {editingId && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Editing <span className="font-mono text-slate-400">@{formUsername}</span>
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  {!editingId && (
                    <div className="space-y-2">
                      <Label htmlFor="user-username" className="text-slate-300 text-sm">{t("username")}</Label>
                      <Input
                        id="user-username" type="text" required
                        value={formUsername} onChange={(e) => setFormUsername(e.target.value)}
                        placeholder={t("usernamePlaceholder")}
                        className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="user-displayname" className="text-slate-300 text-sm">{t("displayNameLabel")}</Label>
                    <Input
                      id="user-displayname" type="text" required
                      value={formDisplayName} onChange={(e) => setFormDisplayName(e.target.value)}
                      placeholder={t("displayNamePlaceholder")}
                      className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20"
                    />
                  </div>
                  <PasswordField
                    id="user-password"
                    label={`${t("password")}${editingId ? " (leave empty to keep)" : ""}`}
                    value={formPassword}
                    onChange={setFormPassword}
                    required={!editingId}
                    accentClass="focus:border-violet-500/50 focus:ring-violet-500/20"
                    placeholder={t("passwordPlaceholder")}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="user-role" className="text-slate-300 text-sm">{t("roleLabel")}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["user", "admin"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFormRole(r)}
                          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                            formRole === r
                              ? r === "admin"
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                                : "border-violet-500/40 bg-violet-500/10 text-violet-400"
                              : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/5 hover:border-white/15"
                          }`}
                        >
                          {r === "admin" ? (
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path d="m12 2-3.5 3.5 3.5 3.5 3.5-3.5Z" /><path d="M2 12l3.5 3.5L9 12l-3.5-3.5Z" /><path d="M12 22l3.5-3.5L12 15l-3.5 3.5Z" /><path d="m22 12-3.5-3.5L15 12l3.5 3.5Z" />
                            </svg>
                          ) : (
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                          )}
                          {r === "admin" ? t("roleAdmin") : t("roleUser")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {userMsg && <AlertBanner msg={userMsg} />}

                  <div className="flex gap-3 pt-1">
                    {editingId && (
                      <Button type="button" variant="outline" onClick={resetUserForm}
                        id="cancel-user-edit"
                        className="flex-1 border-white/20 bg-white/5 hover:bg-white/10 text-white hover:text-white">
                        {t("cancel")}
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={userLoading}
                      id="save-user-button"
                      className={`${editingId ? "flex-[2]" : "w-full"} bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all duration-200 active:scale-[0.98]`}
                    >
                      {userLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                          </svg>
                          Saving…
                        </span>
                      ) : (editingId ? t("updateUser") : t("addUser"))}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* ── Right: User List ────────────────────────────────────────── */}
          <div className="space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("usersTitle")}</h3>
              {!usersLoading && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
                  {users.length}
                </span>
              )}
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-16">
                <svg className="h-6 w-6 animate-spin text-violet-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-16 text-center">
                <svg className="mb-3 h-10 w-10 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <p className="text-sm text-slate-600">{t("noUsersFound")}</p>
              </div>
            ) : (
              users.map((user) => {
                const isEditing = editingId === user.id;
                const isSelf = user.username === session?.username;
                return (
                  <div
                    key={user.id}
                    className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${
                      isEditing
                        ? "border-violet-500/30 bg-violet-500/10"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                    }`}
                  >
                    <UserAvatar name={user.displayName} role={user.role} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-200 truncate">{user.displayName}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          user.role === "admin"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
                            : "bg-slate-500/15 text-slate-400 border-slate-500/25"
                        }`}>
                          {user.role === "admin" ? t("roleAdmin") : t("roleUser")}
                        </span>
                        {isSelf && (
                          <span className="shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            You
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs font-mono text-slate-500">@{user.username}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => handleEditUser(user)}
                        id={`edit-user-${user.id}`}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          className="h-3.5 w-3.5" aria-hidden="true">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </Button>
                      {!isSelf && (
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => handleDeleteUser(user.id)}
                          id={`delete-user-${user.id}`}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className="h-3.5 w-3.5" aria-hidden="true">
                            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
}
