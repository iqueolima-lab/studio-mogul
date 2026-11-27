import { NAV_GROUPS, SUBMENU_TIPS, groupOf, type TabId } from '../game/content';
import { useLang } from '../i18n';

interface NavProps {
  tab: TabId;
  onTab: (tab: TabId) => void;
}

export function BottomNav({ tab, onTab }: NavProps) {
  const { tr, trPair } = useLang();
  const active = groupOf(tab);
  return (
    <nav id="nav" aria-label={tr('Navegação principal', 'Main navigation')}>
      {NAV_GROUPS.map((g) => (
        <button key={g.id} className={`nav-btn ${active === g.id ? 'active' : ''}`} onClick={() => onTab(g.tabs[0].id)}>
          {g.icon}
          <span>{trPair(g.label)}</span>
        </button>
      ))}
    </nav>
  );
}

export function SubNav({ tab, onTab }: NavProps) {
  const { trPair } = useLang();
  const group = NAV_GROUPS.find((g) => g.id === groupOf(tab));
  return (
    <div id="subnav" aria-label="Submenus">
      {group && group.id !== 'projects' && (
        <div className="subnav-group">
          {group.tabs.map((t) => (
            <button key={t.id} className={`subnav-btn ${t.id === tab ? 'active' : ''}`} onClick={() => onTab(t.id)}>
              {trPair(t.label)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Guia compacto abaixo do submenu (2.0.1). */
export function SubmenuGuide({ tab }: { tab: TabId }) {
  const { trPair } = useLang();
  return (
    <div className="tooltip-box" style={{ maxWidth: 960, margin: '6px auto 0', padding: '7px 12px', width: 'calc(100% - 20px)' }}>
      {trPair(SUBMENU_TIPS[tab])}
    </div>
  );
}
