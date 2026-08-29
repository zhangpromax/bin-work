'use client';

import React, { useEffect, useState } from 'react';
import { StoreProvider, useStore } from '../lib/store';
import { initLang } from '../lib/i18n';
import { parseHashSession } from '../lib/auth';
import { LoginView } from '../components/LoginView';
import { Header, TabBar, Toast, Tab } from '../components/chrome';
import { HomeView } from '../components/HomeView';
import { ProfilesView } from '../components/ProfilesView';
import { HealthView, HealthSub, FormType } from '../components/HealthView';
import { MineView } from '../components/MineView';
import { QuickMenu, FormModal, BabyModal, MedEditModal, MrecEditModal, Modal, ProfileModal } from '../components/Modals';

function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [sub, setSub] = useState<HealthSub>('feeding');
  const [drill, setDrill] = useState<HealthSub | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const { theme, isLoggedIn, login, loginWithSession } = useStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initLang(new URLSearchParams(window.location.search).get('lang'));
      const s = parseHashSession();
      if (s) loginWithSession();
    }
  }, []);

  if (!isLoggedIn) return <LoginView onLogin={(s) => login(s)} />;

  return (
    <div className={`app theme-${theme}`}>
      <Header tab={tab} />
      {tab === 'home' && (
        <HomeView
          onEditBaby={(id) => setModal({ kind: 'baby', id })}
          onOpenBaby={() => setModal({ kind: 'baby' })}
        />
      )}
      {tab === 'profiles' && <ProfilesView onEditBaby={(id) => setModal({ kind: 'baby', id })} onForm={(f) => setModal({ kind: 'form', form: f })} />}
      {tab === 'health' && (
        <HealthView
          sub={sub}
          setSub={setSub}
          onForm={(f: FormType) => setModal({ kind: 'form', form: f })}
          onEditMed={(id) => setModal({ kind: 'medEdit', id })}
          onEditMrec={(id) => setModal({ kind: 'mrecEdit', id })}
          drill={drill}
          onDrill={(s) => setDrill(s)}
          onDrillBack={() => setDrill(null)}
        />
      )}
      {tab === 'mine' && <MineView />}
      <TabBar tab={tab} onTab={(x: Tab) => { if (x === 'health') setDrill(null); setTab(x); }} theme={theme} />
      <Toast />

      {modal?.kind === 'quick' && <QuickMenu onClose={() => setModal(null)} onPick={(f) => setModal({ kind: 'form', form: f })} />}
      {modal?.kind === 'form' && <FormModal form={modal.form} onClose={() => setModal(null)} />}
      {modal?.kind === 'baby' && <BabyModal id={modal.id} onClose={() => setModal(null)} />}
      {modal?.kind === 'medEdit' && <MedEditModal id={modal.id} onClose={() => setModal(null)} />}
      {modal?.kind === 'mrecEdit' && <MrecEditModal id={modal.id} onClose={() => setModal(null)} />}
      {modal?.kind === 'profile' && <ProfileModal onClose={() => setModal(null)} />}
    </div>
  );
}

export default function Page() {
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}
