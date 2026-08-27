-- ============================================================
-- 水豚噜噜·宝宝照护  Supabase 建表 SQL
-- 在 Supabase Dashboard → SQL Editor → New query 中整段执行
-- 列名与前端代码 camelCase 一致（必须加双引号）
-- ============================================================

-- 宝宝档案
create table if not exists "babies" (
  "id" text primary key,
  "name" text not null default '',
  "birthday" text not null default '',
  "gender" text not null default '',
  "avatar" text not null default '',
  "note" text not null default '',
  "createdAt" bigint not null default 0,
  "updatedAt" bigint not null default 0
);

-- 喂奶记录
create table if not exists "feedings" (
  "id" text primary key,
  "babyId" text not null default '',
  "date" text not null default '',
  "time" text not null default '',
  "amount" text not null default '',
  "type" text not null default '',
  "note" text not null default '',
  "createdAt" bigint not null default 0,
  "updatedAt" bigint not null default 0
);

-- 换尿布记录
create table if not exists "diapers" (
  "id" text primary key,
  "babyId" text not null default '',
  "date" text not null default '',
  "time" text not null default '',
  "type" text not null default '',
  "note" text not null default '',
  "createdAt" bigint not null default 0,
  "updatedAt" bigint not null default 0
);

-- 睡眠记录
create table if not exists "sleeps" (
  "id" text primary key,
  "babyId" text not null default '',
  "date" text not null default '',
  "start" text not null default '',
  "end_time" text not null default '',
  "duration" bigint not null default 0,
  "note" text not null default '',
  "createdAt" bigint not null default 0,
  "updatedAt" bigint not null default 0
);

-- 体温记录
create table if not exists "temps" (
  "id" text primary key,
  "babyId" text not null default '',
  "date" text not null default '',
  "time" text not null default '',
  "value" text not null default '',
  "note" text not null default '',
  "createdAt" bigint not null default 0,
  "updatedAt" bigint not null default 0
);

-- 喂药疗程（doses 为 jsonb: { "2026-08-23": 2 }）
create table if not exists "medicines" (
  "id" text primary key,
  "babyId" text not null default '',
  "name" text not null default '',
  "startDate" text not null default '',
  "totalDays" bigint not null default 0,
  "freq" bigint not null default 0,
  "doses" jsonb not null default '{}'::jsonb,
  "note" text not null default '',
  "createdAt" bigint not null default 0,
  "updatedAt" bigint not null default 0
);

-- 医疗记录
create table if not exists "medicals" (
  "id" text primary key,
  "babyId" text not null default '',
  "type" text not null default '',
  "date" text not null default '',
  "nextDate" text not null default '',
  "cost" text not null default '',
  "note" text not null default '',
  "syncedId" text,
  "createdAt" bigint not null default 0,
  "updatedAt" bigint not null default 0
);

-- 体重记录
create table if not exists "weights" (
  "id" text primary key,
  "babyId" text not null default '',
  "date" text not null default '',
  "weight" text not null default '',
  "createdAt" bigint not null default 0,
  "updatedAt" bigint not null default 0
);

-- 智能提醒
create table if not exists "reminders" (
  "id" text primary key,
  "babyId" text not null default '',
  "title" text not null default '',
  "subTitle" text not null default '',
  "icon" text not null default '',
  "cycle" text not null default '',
  "enabled" boolean not null default true,
  "createdAt" bigint not null default 0,
  "updatedAt" bigint not null default 0
);

-- 消费记录
create table if not exists "consumptions" (
  "id" text primary key,
  "babyId" text not null default '',
  "category" text not null default '',
  "amount" text not null default '',
  "date" text not null default '',
  "note" text not null default '',
  "source" text not null default '',
  "createdAt" bigint not null default 0,
  "updatedAt" bigint not null default 0
);

-- 常用查询索引（按宝宝 + 日期过滤）
create index if not exists idx_feedings_baby ON "feedings" ("babyId", "date");
create index if not exists idx_diapers_baby ON "diapers" ("babyId", "date");
create index if not exists idx_sleeps_baby ON "sleeps" ("babyId", "date");
create index if not exists idx_temps_baby ON "temps" ("babyId", "date");
create index if not exists idx_medicines_baby ON "medicines" ("babyId");
create index if not exists idx_medicals_baby ON "medicals" ("babyId");
create index if not exists idx_weights_baby ON "weights" ("babyId", "date");
create index if not exists idx_reminders_baby ON "reminders" ("babyId");
create index if not exists idx_consumptions_baby ON "consumptions" ("babyId", "date");

-- 关闭行级安全（私有云，一个家庭使用；anon key 直接读写）
-- 如日后需要多用户隔离，再改为开启 RLS 并加策略
alter table "babies" disable row level security;
alter table "feedings" disable row level security;
alter table "diapers" disable row level security;
alter table "sleeps" disable row level security;
alter table "temps" disable row level security;
alter table "medicines" disable row level security;
alter table "medicals" disable row level security;
alter table "weights" disable row level security;
alter table "reminders" disable row level security;
alter table "consumptions" disable row level security;

-- 前端操作日志（登录/注册/忘记密码/同步等关键行为）
create table if not exists "operation_logs" (
  "id" text primary key,
  "userId" text not null default '',
  "action" text not null default '',
  "detail" text not null default '',
  "ip" text not null default '',
  "userAgent" text not null default '',
  "createdAt" bigint not null default 0
);
create index if not exists idx_operation_logs_user ON "operation_logs" ("userId", "createdAt" desc);
alter table "operation_logs" disable row level security;
