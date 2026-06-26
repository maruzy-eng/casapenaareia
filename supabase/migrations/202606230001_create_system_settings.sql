create table if not exists public.system_settings (
  id boolean primary key default true,

  property_name text not null default 'Casa Pé n''Areia',
  contact_email text,
  whatsapp text,

  currency text not null default 'USD',
  default_cleaning_fee numeric(10, 2) not null default 0,

  cancellation_policy text,

  pending_email_subject text not null default 'Recebemos sua solicitação de reserva',
  confirmed_email_subject text not null default 'Sua reserva foi confirmada',
  cancelled_email_subject text not null default 'Sua reserva foi cancelada',

  pending_email_message text,
  confirmed_email_message text,
  cancelled_email_message text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint system_settings_single_row check (id = true)
);

insert into public.system_settings (
  id,
  property_name,
  contact_email,
  whatsapp,
  currency,
  default_cleaning_fee,
  cancellation_policy,
  pending_email_subject,
  confirmed_email_subject,
  cancelled_email_subject,
  pending_email_message,
  confirmed_email_message,
  cancelled_email_message
)
values (
  true,
  'Casa Pé n''Areia',
  null,
  null,
  'USD',
  0,
  'Política de cancelamento ainda não configurada.',
  'Recebemos sua solicitação de reserva',
  'Sua reserva foi confirmada',
  'Sua reserva foi cancelada',
  'Recebemos sua solicitação de reserva. Ela foi criada como pendente e nossa equipe irá revisar as informações.',
  'Sua reserva foi confirmada com sucesso. Estamos felizes em receber você na Casa Pé n''Areia.',
  'Sua reserva foi cancelada. Caso tenha alguma dúvida, entre em contato com nossa equipe.'
)
on conflict (id) do nothing;