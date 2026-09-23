import React, { useState } from "react";
import {
  Activity,
  Bell,
  ShieldCheck,
  Stethoscope,
  Wrench,
  Code2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import type { User, FCMNotification } from "../types";

interface NavbarProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  availableUsers: User[];
  notifications: FCMNotification[];
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
  onOpenDocs: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSelectUser,
  availableUsers,
  notifications,
  onMarkNotificationRead,
  onClearNotifications,
  onOpenDocs,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getRoleIcon = (cargo: string) => {
    switch (cargo) {
      case "Admin":
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case "Dentista":
        return <Stethoscope className="w-4 h-4 text-sky-600" />;
      case "Técnico":
        return <Wrench className="w-4 h-4 text-amber-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getRoleBadgeStyle = (cargo: string) => {
    switch (cargo) {
      case "Admin":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Dentista":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Técnico":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Municipal Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-700 to-teal-600 flex items-center justify-center text-white shadow-sm">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">
                  OdontoGov
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-50 text-teal-700 border border-teal-200">
                  SUS Municipal
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Gestão de Escalas & Triagem Inteligente com IA Gemini
              </p>
            </div>
          </div>

          {/* Center / Right controls */}
          <div className="flex items-center gap-3">
            {/* Architecture & Code Button (Oculto) */}
            <button
              id="btn-open-docs"
              onClick={onOpenDocs}
              className="hidden"
              title="Visualizar regras do Firestore e código das Cloud Functions"
            >
              <Code2 className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">Arquitetura & Regras</span>
            </button>

            {/* FCM Notifications Bell */}
            <div className="relative">
              <button
                id="btn-notifications-toggle"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Notificações Push FCM"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-sky-600" />
                      <span className="font-semibold text-sm text-slate-800">
                        Notificações FCM em Tempo Real
                      </span>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={onClearNotifications}
                        className="text-xs text-slate-500 hover:text-rose-600 transition-colors"
                      >
                        Limpar todas
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-slate-400">
                        Nenhuma notificação recebida ainda.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => onMarkNotificationRead(n.id)}
                          className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                            !n.read ? "bg-sky-50/50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            {n.type === "CRITICAL_TICKET" ? (
                              <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                            ) : n.type === "TRADE_APPROVED" ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                            ) : (
                              <RefreshCw className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-900 leading-snug">
                                {n.title}
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                {n.body}
                              </p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(n.timestamp).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-sky-600 mt-1.5 shrink-0"></span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Persona Switcher Dropdown */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <label htmlFor="user-role-selector" className="sr-only">
                Alternar Perfil
              </label>
              <div className="flex items-center gap-2">
                <div
                  className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${getRoleBadgeStyle(
                    currentUser.cargo
                  )}`}
                >
                  {getRoleIcon(currentUser.cargo)}
                  <span>{currentUser.cargo}</span>
                </div>

                <select
                  id="user-role-selector"
                  value={currentUser.id}
                  onChange={(e) => {
                    const selected = availableUsers.find((u) => u.id === e.target.value);
                    if (selected) onSelectUser(selected);
                  }}
                  className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 py-1.5 px-2.5 font-medium cursor-pointer max-w-[170px] truncate"
                >
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      [{u.cargo}] {u.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
