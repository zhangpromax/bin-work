-- ============================================================
-- 开启行级安全（RLS）+ 家庭共享策略
-- 前提：supabase-schema.sql 已执行建表（9 张业务表已存在）
-- 用法：Supabase 后台 → SQL Editor → 粘贴本文件 → Run
-- ============================================================
--
-- 策略含义：任何「已登录用户」(auth.uid() IS NOT NULL) 可读写全部业务表。
-- 配合「关闭新用户注册」后，只有你和家人（后台建的账号）能访问，
-- 外人即使拿到 anon key 直连 /api 也会被 RLS 挡回（返回空/拒绝）。
-- 家庭多账号共享同一份宝宝数据，故不按 owner 隔离。

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'babies','feedings','diapers','sleeps','temps',
    'medicines','medicals','weights','consumptions'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "authed_all" ON %I;', t);
    EXECUTE format(
      'CREATE POLICY "authed_all" ON %I FOR ALL TO authenticated
       USING (auth.uid() IS NOT NULL)
       WITH CHECK (auth.uid() IS NOT NULL);',
      t
    );
  END LOOP;
END $$;

-- 验证：以下应列出 9 张表且 relrowsecurity = t
-- SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname IN ('babies','feedings','diapers','sleeps','temps','medicines','medicals','weights','consumptions')
--   ORDER BY relname;
