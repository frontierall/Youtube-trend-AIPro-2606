interface Props {
  hasApiKey: boolean;
  onKeyClick: () => void;
}

export default function Header({ hasApiKey, onKeyClick }: Props) {
  return (
    <header className="bg-gradient-to-r from-red-600 via-red-500 to-rose-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl flex-shrink-0">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight leading-none">YouTube 트렌드 분석</h1>
          <p className="text-red-100 text-xs mt-0.5">국가별·카테고리별 급상승 동영상 분석 도구</p>
        </div>

        {hasApiKey && (
          <button
            onClick={onKeyClick}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors rounded-lg px-3 py-1.5 text-xs font-medium flex-shrink-0"
            title="API 키 변경"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            API 키
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          </button>
        )}
      </div>
    </header>
  );
}
