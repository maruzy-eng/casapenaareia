"use client";

import {
  CheckCircle2,
  ChevronDown,
  Edit3,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

import type { AdminUserItem } from "@/app/admin/usuarios/page";
import {
  createAdminUser,
  deleteAdminUser,
  type UserActionState,
  updateAdminUser,
} from "@/lib/actions/admin/users";

type UsersCrudClientProps = {
  initialUsers: AdminUserItem[];
  currentUserId: string;
};

type UserModalMode = "create" | "edit" | null;

type SortOption =
  | "newest"
  | "oldest"
  | "alphabetical_asc"
  | "alphabetical_desc";

const initialActionState: UserActionState = {
  success: false,
  message: "",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getInitials(name: string | null | undefined) {
  return String(name || "Usuário")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getRoleLabel(role: string | null | undefined) {
  const labels: Record<string, string> = {
    admin: "Administrador",
    administrator: "Administrador",
    manager: "Gerente",
    editor: "Editor",
  };

  return (
    labels[String(role || "").toLowerCase()] ||
    "Usuário"
  );
}

function getRoleClasses(role: string | null | undefined) {
  const normalizedRole = String(role || "").toLowerCase();

  if (
    normalizedRole === "admin" ||
    normalizedRole === "administrator"
  ) {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300";
  }

  if (normalizedRole === "manager") {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300";
}

function normalizeSearch(value: string | null | undefined) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function FieldError({
  state,
  field,
}: {
  state: UserActionState;
  field: string;
}) {
  const error = state.fieldErrors?.[field];

  if (!error) return null;

  return (
    <p className="text-xs font-medium text-rose-600 dark:text-rose-300">
      {error}
    </p>
  );
}

function FeedbackMessage({
  state,
}: {
  state: UserActionState;
}) {
  if (!state.message) return null;

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
        state.success
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300"
      }`}
    >
      <div className="flex items-start gap-2">
        {state.success ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        )}

        <span>{state.message}</span>
      </div>
    </div>
  );
}

function SubmitButton({
  text,
  pendingText,
}: {
  text: string;
  pendingText: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#0b5963] !bg-[#0b5963] px-5 text-sm font-semibold !text-white shadow-[0_12px_28px_rgba(11,89,99,0.18)] transition hover:!border-[#084952] hover:!bg-[#084952] hover:!text-white disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        backgroundColor: "#0b5963",
        color: "#ffffff",
      }}
    >
      <CheckCircle2 className="h-4 w-4" />
      {pending ? pendingText : text}
    </button>
  );
}

function DeleteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-rose-600 bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 className="h-4 w-4" />
      {pending ? "Excluindo..." : "Excluir usuário"}
    </button>
  );
}

function UserFormModal({
  mode,
  selectedUser,
  onClose,
}: {
  mode: Exclude<UserModalMode, null>;
  selectedUser: AdminUserItem | null;
  onClose: () => void;
}) {
  const isEditing = mode === "edit";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] =
    useState(false);

  const [createState, createAction] = useActionState(
    createAdminUser,
    initialActionState
  );

  const [updateState, updateAction] = useActionState(
    updateAdminUser,
    initialActionState
  );

  const activeState = isEditing
    ? updateState
    : createState;

  useEffect(() => {
    if (!activeState.success) return;

    const timeout = window.setTimeout(() => {
      onClose();
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [activeState.success, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071e23]/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--admin-border)] p-5 md:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-primary)]">
              Administração
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-[var(--admin-text)]">
              {isEditing
                ? "Editar usuário"
                : "Novo usuário"}
            </h2>

            <p className="mt-2 text-sm text-[var(--admin-muted)]">
              {isEditing
                ? "Atualize os dados, a função e a senha do usuário."
                : "Crie um novo acesso ao painel administrativo."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--admin-border)] text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)]"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          action={
            isEditing ? updateAction : createAction
          }
          className="space-y-5 p-5 md:p-6"
        >
          {isEditing && selectedUser ? (
            <input
              type="hidden"
              name="user_id"
              value={selectedUser.id}
            />
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Nome completo"
              icon={<UserRound className="h-4 w-4" />}
              error={
                <FieldError
                  state={activeState}
                  field="name"
                />
              }
            >
              <input
                name="name"
                required
                defaultValue={selectedUser?.name || ""}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--admin-text)] outline-none"
              />
            </FormField>

            <FormField
              label="E-mail"
              icon={<Mail className="h-4 w-4" />}
              error={
                <FieldError
                  state={activeState}
                  field="email"
                />
              }
            >
              <input
                type="email"
                name="email"
                required
                defaultValue={selectedUser?.email || ""}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--admin-text)] outline-none"
              />
            </FormField>

            <FormField
              label="Telefone"
              icon={<Phone className="h-4 w-4" />}
              error={
                <FieldError
                  state={activeState}
                  field="phone"
                />
              }
            >
              <input
                type="tel"
                name="phone"
                defaultValue={selectedUser?.phone || ""}
                placeholder="+55 00 00000-0000"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted-2)]"
              />
            </FormField>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                Função
              </span>

              <div className="relative">
                <select
                  name="role"
                  required
                  defaultValue={selectedUser?.role || "editor"}
                  className="min-h-12 w-full appearance-none rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 pr-10 text-sm font-medium text-[var(--admin-text)] outline-none transition focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
                >
                  <option value="admin">
                    Administrador
                  </option>

                  <option value="manager">
                    Gerente
                  </option>

                  <option value="editor">
                    Editor
                  </option>
                </select>

                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
              </div>

              <FieldError
                state={activeState}
                field="role"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                {isEditing
                  ? "Nova senha, opcional"
                  : "Senha"}
              </span>

              <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 transition focus-within:border-[var(--app-primary)] focus-within:ring-4 focus-within:ring-[var(--app-primary)]/10">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--admin-muted-2)]" />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required={!isEditing}
                  minLength={isEditing ? undefined : 8}
                  autoComplete="new-password"
                  placeholder={
                    isEditing
                      ? "Deixe vazio para não alterar"
                      : "Digite uma senha segura"
                  }
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted-2)]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  className="text-[var(--admin-muted)] transition hover:text-[var(--admin-text)]"
                  aria-label={
                    showPassword
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <FieldError
                state={activeState}
                field="password"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                Confirmar senha
              </span>

              <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 transition focus-within:border-[var(--app-primary)] focus-within:ring-4 focus-within:ring-[var(--app-primary)]/10">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--admin-muted-2)]" />

                <input
                  type={
                    showConfirmation
                      ? "text"
                      : "password"
                  }
                  name="confirm_password"
                  required={!isEditing}
                  autoComplete="new-password"
                  placeholder={
                    isEditing
                      ? "Confirme somente se alterar"
                      : "Repita a senha"
                  }
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted-2)]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmation((value) => !value)
                  }
                  className="text-[var(--admin-muted)] transition hover:text-[var(--admin-text)]"
                  aria-label={
                    showConfirmation
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                >
                  {showConfirmation ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <FieldError
                state={activeState}
                field="confirm_password"
              />
            </label>
          </div>

          <FeedbackMessage state={activeState} />

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--admin-border)] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 text-sm font-semibold text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)]"
            >
              Cancelar
            </button>

            <SubmitButton
              text={
                isEditing
                  ? "Salvar alterações"
                  : "Criar usuário"
              }
              pendingText={
                isEditing
                  ? "Salvando..."
                  : "Criando..."
              }
            />
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  icon,
  children,
  error,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  error?: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
        {label}
      </span>

      <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 transition focus-within:border-[var(--app-primary)] focus-within:ring-4 focus-within:ring-[var(--app-primary)]/10">
        <span className="shrink-0 text-[var(--admin-muted-2)]">
          {icon}
        </span>

        {children}
      </div>

      {error}
    </label>
  );
}

function DeleteUserModal({
  user,
  onClose,
}: {
  user: AdminUserItem;
  onClose: () => void;
}) {
  const [deleteState, deleteAction] = useActionState(
    deleteAdminUser,
    initialActionState
  );

  useEffect(() => {
    if (!deleteState.success) return;

    const timeout = window.setTimeout(() => {
      onClose();
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [deleteState.success, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071e23]/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          <Trash2 className="h-6 w-6" />
        </div>

        <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-[var(--admin-text)]">
          Excluir usuário?
        </h2>

        <p className="mt-3 text-sm leading-7 text-[var(--admin-muted)]">
          O acesso de{" "}
          <strong className="text-[var(--admin-text)]">
            {user.name || user.email}
          </strong>{" "}
          será removido permanentemente.
        </p>

        <form action={deleteAction} className="mt-6">
          <input
            type="hidden"
            name="user_id"
            value={user.id}
          />

          <FeedbackMessage state={deleteState} />

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 text-sm font-semibold text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)]"
            >
              Cancelar
            </button>

            <DeleteSubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}

function UserMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(7,52,59,0.05)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
        {icon}
      </div>

      <p className="mt-4 text-sm font-medium text-[var(--admin-muted)]">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black tracking-[-0.06em] text-[var(--admin-text)]">
        {value}
      </p>
    </article>
  );
}

function SelectFilter({
  value,
  onChange,
  children,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        aria-label={ariaLabel}
        className="min-h-12 w-full appearance-none rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 pr-10 text-sm font-medium text-[var(--admin-text)] outline-none transition hover:border-[var(--app-primary)] focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
    </div>
  );
}

export function UsersCrudClient({
  initialUsers,
  currentUserId,
}: UsersCrudClientProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sort, setSort] =
    useState<SortOption>("newest");

  const [modalMode, setModalMode] =
    useState<UserModalMode>(null);

  const [selectedUser, setSelectedUser] =
    useState<AdminUserItem | null>(null);

  const [deleteUser, setDeleteUser] =
    useState<AdminUserItem | null>(null);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = normalizeSearch(search);

    const users = initialUsers.filter((user) => {
      const searchable = normalizeSearch(
        [
          user.name,
          user.email,
          user.phone,
          user.role,
        ]
          .filter(Boolean)
          .join(" ")
      );

      const matchesSearch =
        !normalizedSearch ||
        searchable.includes(normalizedSearch);

      const normalizedRole = String(
        user.role || ""
      ).toLowerCase();

      const matchesRole =
        roleFilter === "all" ||
        normalizedRole === roleFilter ||
        (roleFilter === "admin" &&
          normalizedRole === "administrator");

      return matchesSearch && matchesRole;
    });

    return [...users].sort((first, second) => {
      if (sort === "alphabetical_asc") {
        return String(first.name || "").localeCompare(
          String(second.name || ""),
          "pt-BR",
          {
            sensitivity: "base",
          }
        );
      }

      if (sort === "alphabetical_desc") {
        return String(second.name || "").localeCompare(
          String(first.name || ""),
          "pt-BR",
          {
            sensitivity: "base",
          }
        );
      }

      const firstDate = new Date(
        first.created_at || 0
      ).getTime();

      const secondDate = new Date(
        second.created_at || 0
      ).getTime();

      if (sort === "oldest") {
        return firstDate - secondDate;
      }

      return secondDate - firstDate;
    });
  }, [initialUsers, roleFilter, search, sort]);

  const adminCount = initialUsers.filter((user) =>
    ["admin", "administrator"].includes(
      String(user.role || "").toLowerCase()
    )
  ).length;

  const managerCount = initialUsers.filter(
    (user) =>
      String(user.role || "").toLowerCase() ===
      "manager"
  ).length;

  const editorCount = initialUsers.filter(
    (user) =>
      String(user.role || "").toLowerCase() ===
      "editor"
  ).length;

  const hasFilters =
    Boolean(search.trim()) ||
    roleFilter !== "all" ||
    sort !== "newest";

  function openCreateModal() {
    setSelectedUser(null);
    setModalMode("create");
  }

  function openEditModal(user: AdminUserItem) {
    setSelectedUser(user);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setSelectedUser(null);
  }

  function clearFilters() {
    setSearch("");
    setRoleFilter("all");
    setSort("newest");
  }

  return (
    <main className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UserMetric
          icon={<Users className="h-5 w-5" />}
          label="Total"
          value={initialUsers.length}
        />

        <UserMetric
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Administradores"
          value={adminCount}
        />

        <UserMetric
          icon={<UserRound className="h-5 w-5" />}
          label="Gerentes"
          value={managerCount}
        />

        <UserMetric
          icon={<Edit3 className="h-5 w-5" />}
          label="Editores"
          value={editorCount}
        />
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(7,52,59,0.06)]">
        <div className="flex flex-col gap-4 border-b border-[var(--admin-border)] p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <h2 className="text-xl font-black tracking-[-0.04em] text-[var(--admin-text)]">
              Usuários cadastrados
            </h2>

            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Consulte, edite e gerencie os acessos administrativos.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#0b5963] !bg-[#0b5963] px-5 text-sm font-semibold !text-white shadow-[0_12px_28px_rgba(11,89,99,0.18)] transition hover:!border-[#084952] hover:!bg-[#084952] hover:!text-white"
            style={{
              backgroundColor: "#0b5963",
              color: "#ffffff",
            }}
          >
            <Plus className="h-4 w-4" />
            Novo usuário
          </button>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_190px_auto]">
            <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 transition focus-within:border-[var(--app-primary)] focus-within:ring-4 focus-within:ring-[var(--app-primary)]/10">
              <Search className="h-5 w-5 shrink-0 text-[var(--admin-muted-2)]" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Buscar por nome, e-mail ou telefone..."
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted-2)]"
              />

              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface)] hover:text-[var(--admin-text)]"
                  aria-label="Limpar busca"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <SelectFilter
              value={roleFilter}
              onChange={setRoleFilter}
              ariaLabel="Filtrar por função"
            >
              <option value="all">
                Todas as funções
              </option>

              <option value="admin">
                Administradores
              </option>

              <option value="manager">
                Gerentes
              </option>

              <option value="editor">
                Editores
              </option>
            </SelectFilter>

            <SelectFilter
              value={sort}
              onChange={(value) =>
                setSort(value as SortOption)
              }
              ariaLabel="Ordenar usuários"
            >
              <option value="newest">
                Mais recentes
              </option>

              <option value="oldest">
                Mais antigos
              </option>

              <option value="alphabetical_asc">
                Nome: A–Z
              </option>

              <option value="alphabetical_desc">
                Nome: Z–A
              </option>
            </SelectFilter>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-semibold text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              Limpar
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--admin-border)] pt-4">
            <p className="text-sm text-[var(--admin-muted)]">
              <strong className="text-[var(--admin-text)]">
                {filteredUsers.length}
              </strong>{" "}
              {filteredUsers.length === 1
                ? "usuário encontrado"
                : "usuários encontrados"}
            </p>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="mt-5 rounded-[1.75rem] border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-[var(--app-primary)]" />

              <h3 className="mt-4 text-xl font-black text-[var(--admin-text)]">
                Nenhum usuário encontrado
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--admin-muted)]">
                Altere a busca ou limpe os filtros para visualizar outros usuários.
              </p>
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-[var(--admin-border)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-[var(--admin-surface-soft)] text-xs text-[var(--admin-muted)]">
                    <tr>
                      <th className="px-6 py-5 font-black">
                        Usuário
                      </th>

                      <th className="px-6 py-5 font-black">
                        Contato
                      </th>

                      <th className="px-6 py-5 font-black">
                        Função
                      </th>

                      <th className="px-6 py-5 font-black">
                        Último acesso
                      </th>

                      <th className="px-6 py-5 text-right font-black">
                        Ações
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[var(--admin-border)]">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="transition hover:bg-[var(--admin-surface-soft)]"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#0b5963] text-sm font-bold text-white">
                              {user.avatar_url ? (
                                <img
                                  src={user.avatar_url}
                                  alt={`Foto de ${user.name || "usuário"}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                getInitials(user.name)
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-black text-[var(--admin-text)]">
                                {user.name || "Sem nome"}
                              </p>

                              {user.id === currentUserId ? (
                                <p className="mt-1 text-xs font-semibold text-[var(--app-primary)]">
                                  Sua conta
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <p className="flex items-center gap-2 text-xs font-semibold text-[var(--admin-text)]">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--app-primary)]" />

                            <span className="max-w-[240px] truncate">
                              {user.email || "—"}
                            </span>
                          </p>

                          <p className="mt-2 flex items-center gap-2 text-xs text-[var(--admin-muted)]">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--app-primary)]" />

                            <span>
                              {user.phone || "—"}
                            </span>
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRoleClasses(
                              user.role
                            )}`}
                          >
                            {getRoleLabel(user.role)}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm font-medium text-[var(--admin-muted)]">
                          {formatDate(user.last_login_at)}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(user)
                              }
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-xs font-semibold text-[var(--admin-text)] transition hover:bg-[var(--admin-surface-soft)]"
                            >
                              <Edit3 className="h-4 w-4" />
                              Editar
                            </button>

                            <button
                              type="button"
                              disabled={
                                user.id === currentUserId
                              }
                              onClick={() =>
                                setDeleteUser(user)
                              }
                              className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-35 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300"
                              aria-label="Excluir usuário"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {modalMode ? (
        <UserFormModal
          key={`${modalMode}-${selectedUser?.id || "new"}`}
          mode={modalMode}
          selectedUser={selectedUser}
          onClose={closeModal}
        />
      ) : null}

      {deleteUser ? (
        <DeleteUserModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
        />
      ) : null}
    </main>
  );
}

export default UsersCrudClient;