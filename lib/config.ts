/**
 * 部署级 Supabase 默认值（开发者配置，普通用户无需关心）
 *
 * 用法二选一：
 *   1）直接改本文件里的 DEFAULT_SUPABASE_URL / DEFAULT_SUPABASE_ANON_KEY（最简单）；
 *   2）或用构建期环境变量（需 NEXT_PUBLIC_ 前缀，静态导出时打进 bundle）：
 *        NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
 *        NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 *
 * 优先级：用户本机手动覆盖（localStorage babycare_cloud） > 构建期 env > 本文件默认值。
 * 普通用户打开 App 时若已有默认值，会直接进入登录/注册页，不再要求填写云端配置。
 */

const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 👇👇👇 开发者：把你的 Supabase 项目值填到下面两行即可（留空则走 env / 让用户填）
export const DEFAULT_SUPABASE_URL = ENV_URL || 'https://kltqzleqiqykvpilcckr.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  ENV_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdHF6aWVxaXF5a3ZwbGljY2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNzY3OTEsImV4cCI6MjEwMjg1Mjc5MX0.vV1Ped4vGT5fPZ1WKB1O5FUtIK1bdPZdAEyGGhcAMy8';

/** 是否已有可用的部署级默认值（至少一个 URL，便于登录页判断是否需要让用户填） */
export function hasDefaultCloud(): boolean {
  return !!DEFAULT_SUPABASE_URL.trim() && !!DEFAULT_SUPABASE_ANON_KEY.trim();
}
