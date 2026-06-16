export type TopMenu = 'trend' | 'analysis' | 'data-analysis' | 'ai' | 'dashboard' | 'compare' | 'report' | 'settings';

const ITEMS: { id: TopMenu; label: string; icon: string }[] = [
  { id: 'dashboard',    label: '대시보드',        icon: '📌' },
  { id: 'trend',        label: '트렌드',           icon: '🔥' },
  { id: 'analysis',     label: '채널 및 영상 분석', icon: '📊' },
  { id: 'data-analysis',label: '데이터 분석',      icon: '🔬' },
  { id: 'compare',      label: '국가 비교',        icon: '🌍' },
  { id: 'ai',           label: 'AI 분석',          icon: '🤖' },
  { id: 'report',       label: '리포트',           icon: '📋' },
  { id: 'settings',     label: '설정',             icon: '⚙️' },
];

interface Props {
  active: TopMenu;
  onChange: (menu: TopMenu) => void;
}

export default function TopNav({ active, onChange }: Props) {
  return (
    <nav className="bg-white border-b border-gray-200 overflow-x-auto">
      <div className="px-4 flex items-center gap-1 min-w-max">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              active === item.id
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
