"use client";

import { useState, useEffect, useCallback } from "react";
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

export default function SettingsPage() {
  const { t } = useLocale();
  const session = getSessionClient();

  // ─── Password Change State ─────────────────────────
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // ─── User Management State ─────────────────────────
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formUsername, setFormUsername] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "user">("user");
  const [userMsg, setUserMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadUsers = useCallback(async () => {
    const list = await fetchUsers();
    setUsers(list);
    setUsersLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ─── Password Change ──────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    if (newPw !== confirmPw) {
      setPwMsg({ type: "error", text: t("passwordMismatch") });
      return;
    }
    if (newPw.length < 4) {
      setPwMsg({ type: "error", text: "Min. 4 characters" });
      return;
    }

    setPwLoading(true);
    const result = await changePassword(session!.username, currentPw, newPw);
    setPwLoading(false);

    if (result.success) {
      setPwMsg({ type: "success", text: t("passwordChanged") });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } else {
      setPwMsg({
        type: "error",
        text: result.error === "wrong_current_password" ? t("wrongCurrentPassword") : "Error",
      });
    }
  };

  // ─── User CRUD ─────────────────────────────────────
  const resetUserForm = () => {
    setEditingId(null);
    setFormUsername("");
    setFormDisplayName("");
    setFormPassword("");
    setFormRole("user");
    setUserMsg(null);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserMsg(null);

    if (editingId) {
      const data: { displayName?: string; role?: "admin" | "user"; password?: string } = {
        displayName: formDisplayName,
        role: formRole,
      };
      if (formPassword) data.password = formPassword;
      const result = await updateUser(editingId, data);
      if (result.success) {
        resetUserForm();
        loadUsers();
      } else {
        setUserMsg({ type: "error", text: result.error || "Error" });
      }
    } else {
      if (!formUsername.trim() || !formPassword) {
        setUserMsg({ type: "error", text: "Username and password required" });
        return;
      }
      const result = await createUser(formUsername, formPassword, formDisplayName, formRole);
      if (result.success) {
        resetUserForm();
        loadUsers();
      } else {
        setUserMsg({
          type: "error",
          text: result.error === "username_exists" ? t("usernameExists") : result.error || "Error",
        });
      }
    }
  };

  const handleEditUser = (user: UserData) => {
    setEditingId(user.id);
    setFormUsername(user.username);
    setFormDisplayName(user.displayName);
    setFormPassword("");
    setFormRole(user.role);
    setUserMsg(null);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t("confirmDeleteUser"))) return;
    await deleteUser(userId);
    loadUsers();
  };

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* ── Change Password ── */}
      <Card className="mx-auto max-w-lg border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/30">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white" aria-hidden="true">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{t("changePassword")}</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-slate-300 text-sm">{t("currentPassword")}</Label>
              <Input id="current-password" type="password" required value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-slate-300 text-sm">{t("newPassword")}</Label>
              <Input id="new-password" type="password" required value={newPw} onChange={(e) => setNewPw(e.target.value)} className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-slate-300 text-sm">{t("confirmNewPassword")}</Label>
              <Input id="confirm-password" type="password" required value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20" />
            </div>
            {pwMsg && (
              <div className={`rounded-lg border px-4 py-2.5 text-sm ${pwMsg.type === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-red-500/20 bg-red-500/10 text-red-400"}`}>
                {pwMsg.text}
              </div>
            )}
            <Button type="submit" disabled={pwLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/25" id="change-password-button">
              {pwLoading ? "..." : t("changePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── User Management ── */}
      <Card className="mx-auto max-w-lg border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/30">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 shadow-lg shadow-violet-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{t("manageUsers")}</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUserSubmit} className="space-y-4">
            {!editingId && (
              <div className="space-y-2">
                <Label htmlFor="user-username" className="text-slate-300 text-sm">{t("username")}</Label>
                <Input id="user-username" type="text" required value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder={t("usernamePlaceholder")} className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="user-displayname" className="text-slate-300 text-sm">{t("displayNameLabel")}</Label>
              <Input id="user-displayname" type="text" required value={formDisplayName} onChange={(e) => setFormDisplayName(e.target.value)} placeholder={t("displayNamePlaceholder")} className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password" className="text-slate-300 text-sm">{t("password")} {editingId && "(leave empty to keep)"}</Label>
              <Input id="user-password" type="password" required={!editingId} value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder={t("passwordPlaceholder")} className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role" className="text-slate-300 text-sm">{t("roleLabel")}</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as "admin" | "user")}>
                <SelectTrigger id="user-role" className="border-white/15 bg-white/5 text-white focus:border-violet-500/50 focus:ring-violet-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800 text-white">
                  <SelectItem value="user">{t("roleUser")}</SelectItem>
                  <SelectItem value="admin">{t("roleAdmin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {userMsg && (
              <div className={`rounded-lg border px-4 py-2.5 text-sm ${userMsg.type === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-red-500/20 bg-red-500/10 text-red-400"}`}>
                {userMsg.text}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetUserForm} className="flex-1 border-white/20 bg-white/5 hover:bg-white/10 text-white hover:text-white" id="cancel-user-edit">{t("cancel")}</Button>
              )}
              <Button type="submit" className={`${editingId ? "flex-[2]" : "w-full"} bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold shadow-lg shadow-violet-500/25`} id="save-user-button">
                {editingId ? t("updateUser") : t("addUser")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── User List ── */}
      <Card className="mx-auto max-w-lg border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/30">
        <CardHeader className="pb-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{t("usersTitle")}</h3>
        </CardHeader>
        <CardContent className="pt-0">
          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="h-5 w-5 animate-spin text-violet-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
              </svg>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500">{t("noUsersFound")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 transition-all hover:bg-white/5 hover:border-white/10">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-200 truncate">{user.displayName}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${user.role === "admin" ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" : "bg-slate-500/15 text-slate-400 border border-slate-500/20"}`}>
                        {user.role === "admin" ? t("roleAdmin") : t("roleUser")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">@{user.username}</p>
                  </div>
                  <div className="flex items-center gap-1 ms-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" onClick={() => handleEditUser(user)} className="h-8 w-8 p-0 text-slate-400 hover:text-violet-400 hover:bg-violet-500/10" id={`edit-user-${user.id}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </Button>
                    {user.username !== session?.username && (
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteUser(user.id)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10" id={`delete-user-${user.id}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
