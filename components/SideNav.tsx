interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

interface Props {
  items: MenuItem[];
  active: string;
  onChange: (id: string) => void;
}

export default function SideNav({ items, active, onChange }: Props) {
  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 pt-4 pb-6">
      <nav className="px-3 space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              active === item.id
                ? 'bg-red-50 text-red-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="leading-snug">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
