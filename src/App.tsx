import { useEffect, useState, type ReactNode } from 'react';
import { playClickSound } from './audio/audio';
import { BottomNav, SubNav, SubmenuGuide } from './components/Navigation';
import { EventModal } from './components/EventModal';
import { GameMenu } from './components/GameMenu';
import { GreenlightModal } from './components/GreenlightModal';
import { Hud } from './components/Hud';
import { InboxModal } from './components/InboxModal';
import { StartMenu } from './components/StartMenu';
import { Toasts } from './components/Toasts';
import type { TabId } from './game/content';
import { store, useGame } from './game/store';
import { useLang } from './i18n';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { AwardsScreen } from './screens/AwardsScreen';
import { BroadcastersScreen } from './screens/BroadcastersScreen';
import { HiringScreen } from './screens/HiringScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { MarketsScreen } from './screens/MarketsScreen';
import { PhoneScreen } from './screens/PhoneScreen';
import { PipelineScreen } from './screens/PipelineScreen';
import { SlateScreen } from './screens/SlateScreen';
import { StreamingScreen } from './screens/StreamingScreen';
import { TalentScreen } from './screens/TalentScreen';

const SCREENS: Record<TabId, () => ReactNode> = {
  slate: () => <SlateScreen />,
  markets: () => <MarketsScreen />,
  pipeline: () => <PipelineScreen />,
  library: () => <LibraryScreen />,
  talent: () => <TalentScreen />,
  hiring: () => <HiringScreen />,
  streaming: () => <StreamingScreen />,
  awards: () => <AwardsScreen />,
  broadcasters: () => <BroadcastersScreen />,
  analytics: () => <AnalyticsScreen />,
  phone: () => <PhoneScreen />,
};

export default function App() {
  const g = useGame();
  const { lang } = useLang();
  const [tab, setTab] = useState<TabId>('slate');
  const [menuOpen, setMenuOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);

  // Todo botão faz um clique suave.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest('button')) playClickSound();
    };
    const onVisibility = () => store.handleVisibilityChange();
    document.addEventListener('click', onClick);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    document.title = lang === 'en' ? 'Studio Mogul — Film & TV Simulator' : 'Estúdio Mogul — Simulador de Cinema e TV';
  }, [lang]);

  const openTab = (next: TabId) => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    setTab(next);
  };

  if (!g.state) {
    return (
      <>
        <StartMenu onStarted={() => setTab('slate')} />
        <Toasts />
      </>
    );
  }

  return (
    <>
      <Hud onOpenMenu={() => setMenuOpen(true)} onOpenInbox={() => setInboxOpen(true)} />
      <SubNav tab={tab} onTab={openTab} />
      <SubmenuGuide tab={tab} />
      <div className="screen active" key={tab}>
        {SCREENS[tab]()}
      </div>
      <BottomNav tab={tab} onTab={openTab} />

      {g.greenlightOpen && <GreenlightModal />}
      {inboxOpen && <InboxModal onClose={() => setInboxOpen(false)} />}
      {menuOpen && <GameMenu onClose={() => setMenuOpen(false)} />}
      {g.pendingEvent && <EventModal />}
      <Toasts />
    </>
  );
}
