'use client';

import React, { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { t } from '../lib/i18n';
import { cloudUrl, cloudKey } from '../lib/cloud';

export function MineView() {
  const { cloudOn, saveCloudCfg, syncNow, testConn, closeCloud, loadSamples, clearData, exportData, importData, toast, theme, setTheme } = useStore();
  const [url, setUrl] = useState(cloudUrl());
  const [key, setKey] = useState(cloudKey());
  const [testing, setTesting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <main>
      <div className="card">
        <h3><span className="ic">⚙️</span>{t('syncset')}</h3>
        <div className="mini">{t('synctip')}</div>
        <div className="row">
          <span className="muted">{t('tabmine') === 'Mine' ? 'Status' : '状态'}</span>
          <span className={cloudOn ? 'tag' : 'tag gray'}>{cloudOn ? t('syncon') : t('syncoff')}</span>
        </div>
        <label>Supabase URL</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" />
        <label>anon key</label>
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="eyJ..." />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn" onClick={() => saveCloudCfg(url, key)}>{t('save')}</button>
          <button className="btn ghost" onClick={() => syncNow()}>🔄 {t('tabmine') === 'Mine' ? 'Sync Now' : '立即同步'}</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn ghost" disabled={testing} onClick={async () => {
            setTesting(true);
            try { toast(await testConn(url, key)); } catch (e) { toast('❌ 网络/CORS 错误：' + (e instanceof Error ? e.message : '失败')); }
            setTesting(false);
          }}>🩺 {t('tabmine') === 'Mine' ? 'Test Connection' : '测试连接'}</button>
          <button className="btn ghost" onClick={closeCloud}>{t('cancel')}</button>
        </div>
      </div>

      <div className="card">
        <h3><span className="ic">🎨</span>{t('theme')}</h3>
        <div className="mini" style={{ marginBottom: 10 }}>{t('themeTip')}</div>
        <div className="seg">
          <button className={theme === 'static' ? 'on' : ''} onClick={() => setTheme('static')}>
            🖼 {t('themeStatic')}
          </button>
          <button className={theme === 'dynamic' ? 'on' : ''} onClick={() => setTheme('dynamic')}>
            ✨ {t('themeDynamic')}
          </button>
        </div>
      </div>

      <div className="card">
        <h3><span className="ic">💾</span>{t('tabmine') === 'Mine' ? 'Data' : '数据'}</h3>
        <button className="btn ghost" style={{ marginBottom: 10 }} onClick={exportData}>⬇ {t('export')}</button>
        <button className="btn ghost" style={{ marginBottom: 10 }} onClick={() => fileRef.current?.click()}>⬆ {t('import')}</button>
        <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = ''; }} />
        <button className="btn ghost" onClick={loadSamples}>✨ {t('samples')}</button>
        <button className="btn red" style={{ marginTop: 10 }} onClick={clearData}>🗑 {t('clearData')}</button>
      </div>

      <div className="card">
        <h3><span className="ic">ℹ️</span>{t('about')}</h3>
        <div className="mini">Next.js 版 · 数据默认存本地浏览器；配置云端后自动双向同步。</div>
      </div>
    </main>
  );
}
