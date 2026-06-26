 "use client";

import {
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

import {
  type ProfileActionState,
  removeAdminAvatar,
  updateAdminPassword,
  updateAdminProfile,
  uploadAdminAvatar,
} from "@/lib/actions/admin/profile";

type AdminProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string | null;
  last_login_at: string | null;
};

type AdminProfileClientProps = {
  admin: AdminProfile;
};

const initialState: ProfileActionState = {
  success: false,
  message: "",
};

function getInitials(name: string) {
  return String(name || "Admin")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function formatDateTime(value: string | null) {
  if (!value) return "Não informado";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: "Administrador",
    administrator: "Administrador",
    manager: "Gerente",
    editor: "Editor",
  };

  return (
    labels[String(role || "").toLowerCase()] ||
    role ||
    "Administrador"
  );
}

function FeedbackMessage({
  state,
}: {
  state: ProfileActionState;
}) {
  if (!state.message) return null;

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
        state.success
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
      role="status"
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

function FieldError({
  state,
  field,
}: {
  state: ProfileActionState;
  field: string;
}) {
  const message = state.fieldErrors?.[field];

  if (!message) return null;

  return (
    <p className="text-xs font-medium text-rose-600">
      {message}
    </p>
  );
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
        {icon}
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-[-0.04em] text-[var(--admin-text)]">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-[var(--admin-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}

function InputContainer({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 transition focus-within:border-[#0b5963] focus-within:ring-4 focus-within:ring-[#0b5963]/10">
      <span className="shrink-0 text-[var(--admin-muted-2)]">
        {icon}
      </span>

      {children}
    </div>
  );
}

function PrimarySubmitButton({
  children,
  pendingText,
  icon,
}: {
  children: React.ReactNode;
  pendingText: string;
  icon: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#0b5963] !bg-[#0b5963] px-5 text-sm font-semibold !text-white shadow-[0_12px_30px_rgba(11,89,99,0.22)] transition hover:!border-[#084952] hover:!bg-[#084952] hover:!text-white disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        backgroundColor: "#0b5963",
        color: "#ffffff",
      }}
    >
      {icon}
      {pending ? pendingText : children}
    </button>
  );
}

function RemovePhotoButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 className="h-4 w-4" />
      {pending ? "Removendo..." : "Remover foto"}
    </button>
  );
}

export function AdminProfileClient({
  admin,
}: AdminProfileClientProps) {
  const passwordFormRef =
    useRef<HTMLFormElement | null>(null);

  const [profileState, profileAction] = useActionState(
    updateAdminProfile,
    initialState
  );

  const [passwordState, passwordAction] = useActionState(
    updateAdminPassword,
    initialState
  );

  const [avatarState, avatarAction] = useActionState(
    uploadAdminAvatar,
    initialState
  );

  const [removeAvatarState, removeAvatarAction] =
    useActionState(removeAdminAvatar, initialState);

  const [selectedAvatar, setSelectedAvatar] =
    useState<File | null>(null);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmation, setShowConfirmation] =
    useState(false);

  const [newPasswordValue, setNewPasswordValue] =
    useState("");

  const avatarPreview = useMemo(() => {
    if (!selectedAvatar) return null;

    return URL.createObjectURL(selectedAvatar);
  }, [selectedAvatar]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (avatarState.success) {
      setSelectedAvatar(null);
    }
  }, [avatarState.success]);

  useEffect(() => {
    if (passwordState.success) {
      passwordFormRef.current?.reset();
      setNewPasswordValue("");
      setShowNewPassword(false);
      setShowConfirmation(false);
    }
  }, [passwordState.success]);

  const displayedAvatar =
    avatarPreview || admin.avatar_url;

  const passwordRequirements = {
    length: newPasswordValue.length >= 8,
    lowercase: /[a-z]/.test(newPasswordValue),
    uppercase: /[A-Z]/.test(newPasswordValue),
    number: /[0-9]/.test(newPasswordValue),
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="space-y-6">
        <section className="overflow-hidden rounded-[1.8rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(7,52,59,0.06)]">
          <div className="h-28 bg-[image:var(--admin-hero-gradient)]" />

          <div className="-mt-16 px-6 pb-6">
            <div className="relative mx-auto h-28 w-28">
              <div className="h-28 w-28 overflow-hidden rounded-[2rem] border-4 border-[var(--admin-surface)] bg-[#0b5963] shadow-[0_18px_40px_rgba(7,52,59,0.18)]">
                {displayedAvatar ? (
                  <img
                    src={displayedAvatar}
                    alt={`Foto de ${admin.name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white">
                    {getInitials(admin.name)}
                  </div>
                )}
              </div>

              <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-[var(--admin-surface)] bg-[#0b5963] text-white">
                <Camera className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-5 text-center">
              <h1 className="text-2xl font-semibold tracking-[-0.05em] text-[var(--admin-text)]">
                {admin.name}
              </h1>

              <p className="mt-1 break-all text-sm text-[var(--admin-muted)]">
                {admin.email}
              </p>

              <div className="mt-4 flex justify-center">
                <span className="rounded-full bg-[var(--app-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-primary)]">
                  {getRoleLabel(admin.role)}
                </span>
              </div>
            </div>

            <form
              action={avatarAction}
              encType="multipart/form-data"
              className="mt-6 space-y-3"
            >
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 py-5 text-center transition hover:border-[#0b5963]">
                <Upload className="h-6 w-6 text-[var(--app-primary)]" />

                <span className="mt-2 text-sm font-semibold text-[var(--admin-text)]">
                  Selecionar nova foto
                </span>

                <span className="mt-1 text-xs text-[var(--admin-muted)]">
                  JPG, PNG ou WebP · máximo 3 MB
                </span>

                <input
                  type="file"
                  name="avatar"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    setSelectedAvatar(
                      event.target.files?.[0] || null
                    );
                  }}
                />
              </label>

              <FieldError
                state={avatarState}
                field="avatar"
              />

              {selectedAvatar ? (
                <div className="flex justify-center">
                  <PrimarySubmitButton
                    pendingText="Enviando..."
                    icon={<Upload className="h-4 w-4" />}
                  >
                    Salvar nova foto
                  </PrimarySubmitButton>
                </div>
              ) : null}

              <FeedbackMessage state={avatarState} />
            </form>

            {admin.avatar_url ? (
              <form
                action={removeAvatarAction}
                className="mt-3"
              >
                <RemovePhotoButton />
              </form>
            ) : null}

            <div className="mt-3">
              <FeedbackMessage state={removeAvatarState} />
            </div>
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(7,52,59,0.06)]">
          <SectionTitle
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Informações da conta"
            description="Dados administrativos do seu acesso."
          />

          <div className="mt-5 divide-y divide-[var(--admin-border)]">
            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-[var(--admin-muted)]">
                Função
              </span>

              <strong className="text-right text-sm text-[var(--admin-text)]">
                {getRoleLabel(admin.role)}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-[var(--admin-muted)]">
                Conta criada
              </span>

              <strong className="text-right text-sm text-[var(--admin-text)]">
                {formatDateTime(admin.created_at)}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-[var(--admin-muted)]">
                Último acesso
              </span>

              <strong className="text-right text-sm text-[var(--admin-text)]">
                {formatDateTime(admin.last_login_at)}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-[var(--admin-muted)]">
                Identificador
              </span>

              <strong className="font-mono text-xs text-[var(--admin-text)]">
                {admin.id.slice(0, 8)}…
              </strong>
            </div>
          </div>
        </section>
      </aside>

      <div className="space-y-6">
        <section className="rounded-[1.8rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(7,52,59,0.06)] md:p-6">
          <SectionTitle
            icon={<UserRound className="h-5 w-5" />}
            title="Dados pessoais"
            description="Atualize suas informações no painel administrativo."
          />

          <form
            action={profileAction}
            className="mt-6 space-y-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                  Nome completo
                </span>

                <InputContainer
                  icon={<UserRound className="h-4 w-4" />}
                >
                  <input
                    name="name"
                    defaultValue={admin.name}
                    required
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--admin-text)] outline-none"
                  />
                </InputContainer>

                <FieldError
                  state={profileState}
                  field="name"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                  E-mail de acesso
                </span>

                <InputContainer
                  icon={<Mail className="h-4 w-4" />}
                >
                  <input
                    type="email"
                    name="email"
                    defaultValue={admin.email}
                    required
                    autoComplete="email"
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--admin-text)] outline-none"
                  />
                </InputContainer>

                <FieldError
                  state={profileState}
                  field="email"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                  Telefone
                </span>

                <InputContainer
                  icon={<Phone className="h-4 w-4" />}
                >
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={admin.phone || ""}
                    placeholder="+55 00 00000-0000"
                    autoComplete="tel"
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted-2)]"
                  />
                </InputContainer>

                <FieldError
                  state={profileState}
                  field="phone"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                  Função
                </span>

                <InputContainer
                  icon={<ShieldCheck className="h-4 w-4" />}
                >
                  <input
                    value={getRoleLabel(admin.role)}
                    readOnly
                    className="min-w-0 flex-1 cursor-not-allowed bg-transparent text-sm font-medium text-[var(--admin-muted)] outline-none"
                  />
                </InputContainer>
              </label>
            </div>

            <FeedbackMessage state={profileState} />

            <div className="flex justify-end">
              <PrimarySubmitButton
                pendingText="Salvando..."
                icon={<Save className="h-4 w-4" />}
              >
                Salvar alterações
              </PrimarySubmitButton>
            </div>
          </form>
        </section>

        <section className="rounded-[1.8rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(7,52,59,0.06)] md:p-6">
          <SectionTitle
            icon={<KeyRound className="h-5 w-5" />}
            title="Alterar senha"
            description="Defina uma nova senha para acessar o painel administrativo."
          />

          <form
            ref={passwordFormRef}
            action={passwordAction}
            className="mt-6 space-y-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                  Nova senha
                </span>

                <InputContainer
                  icon={<KeyRound className="h-4 w-4" />}
                >
                  <input
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    name="new_password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Digite a nova senha"
                    onChange={(event) =>
                      setNewPasswordValue(event.target.value)
                    }
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted-2)]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword((value) => !value)
                    }
                    className="text-[var(--admin-muted)] transition hover:text-[var(--admin-text)]"
                    aria-label={
                      showNewPassword
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </InputContainer>

                <FieldError
                  state={passwordState}
                  field="new_password"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                  Confirmar nova senha
                </span>

                <InputContainer
                  icon={<KeyRound className="h-4 w-4" />}
                >
                  <input
                    type={
                      showConfirmation
                        ? "text"
                        : "password"
                    }
                    name="confirm_password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Repita a nova senha"
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
                </InputContainer>

                <FieldError
                  state={passwordState}
                  field="confirm_password"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
              <p className="text-sm font-semibold text-[var(--admin-text)]">
                Requisitos da nova senha
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <PasswordRequirement
                  valid={passwordRequirements.length}
                  label="Pelo menos 8 caracteres"
                />

                <PasswordRequirement
                  valid={passwordRequirements.uppercase}
                  label="Uma letra maiúscula"
                />

                <PasswordRequirement
                  valid={passwordRequirements.lowercase}
                  label="Uma letra minúscula"
                />

                <PasswordRequirement
                  valid={passwordRequirements.number}
                  label="Pelo menos um número"
                />
              </div>
            </div>

            <FeedbackMessage state={passwordState} />

            <div className="flex justify-end">
              <PrimarySubmitButton
                pendingText="Alterando..."
                icon={<KeyRound className="h-4 w-4" />}
              >
                Salvar nova senha
              </PrimarySubmitButton>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function PasswordRequirement({
  valid,
  label,
}: {
  valid: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full ${
          valid
            ? "bg-emerald-100 text-emerald-700"
            : "bg-[var(--admin-surface)] text-[var(--admin-muted-2)]"
        }`}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
      </span>

      <span
        className={`text-xs ${
          valid
            ? "font-medium text-emerald-700"
            : "text-[var(--admin-muted)]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default AdminProfileClient;