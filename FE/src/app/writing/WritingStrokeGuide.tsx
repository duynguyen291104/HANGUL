'use client';

export const WRITING_STROKE_GUIDE: Record<string, string[]> = {
  한: [
    'ㅎ — nét ngang trên (trái → phải)',
    'ㅎ — sọc trái (trên → dưới)',
    'ㅎ — cung đáy, vạch trong, chấm',
    'ㅏ — sọc dọc giữa ô',
    'ㅏ — nét ngang bên phải sọc',
    'Âm cuối ㄴ — sọc và đáy hoặc chữ L',
  ],
  글: [
    'ㄱ — ngang rồi gấp xuống',
    'ㅡ — vạch ngang giữa ô',
    'ㄹ — nét 1: ngang trên',
    'ㄹ — nét 2: sọc và ngang giữa',
    'ㄹ — nét 3: sọc và nét kết',
  ],
  가: [
    'ㄱ — vạch ngang',
    'ㄱ — sọc xuống',
    'ㅏ — sọc dọc giữa ô',
    'ㅏ — vạch ngang bên phải',
  ],
  나: [
    'ㄴ — sọc trái',
    'ㄴ — nét đáy',
    'ㅏ — sọc dọc',
    'ㅏ — vạch ngang',
  ],
  다: [
    'ㄷ — nét ngang trên',
    'ㄷ — sọc trái',
    'ㄷ — nét đáy',
    'ㅏ — sọc dọc',
    'ㅏ — vạch ngang',
  ],
  라: [
    'ㄹ — nét 1: ngang trên',
    'ㄹ — nét 2: sọc và ngang giữa',
    'ㄹ — nét 3: sọc và nét chốt',
    'ㅏ — sọc dọc',
    'ㅏ — vạch ngang',
  ],
  마: [
    'ㅁ — nét ngang trên',
    'ㅁ — cạnh dọc trái',
    'ㅁ — cạnh dọc phải',
    'ㅁ — nét đáy',
    'ㅏ — sọc dọc',
    'ㅏ — vạch ngang',
  ],
  바: [
    'ㅂ — vạch ngang trên',
    'ㅂ — vạch ngang giữa',
    'ㅂ — sọc trái',
    'ㅂ — sọc phải',
    'ㅏ — sọc dọc',
    'ㅏ — vạch ngang',
  ],
};

type WritingStrokeGuidePanelProps = {
  currentChar: string;
};

const RAIL_W = 'w-56';

export function WritingStrokeGuidePanel({ currentChar }: WritingStrokeGuidePanelProps) {
  const steps = WRITING_STROKE_GUIDE[currentChar] ?? [];

  return (
    <aside
      className={`pointer-events-auto fixed right-0 top-0 z-[15] hidden h-dvh min-h-0 ${RAIL_W} flex-col border-l border-[#e4dfd9] bg-[#fafaf5] px-3 py-4 shadow-[-10px_0_32px_rgba(43,22,15,0.06)] lg:flex`}
      aria-label="Thứ tự nét"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e6e1db] bg-white/95 shadow-[0_4px_24px_rgba(43,22,15,0.07)]">
        <div className="shrink-0 rounded-t-2xl border-b border-[#f0ebe6] bg-[#fafaf5]/80 px-4 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#72564c]/65">Thứ tự nét</p>
          <p className="mt-1.5 text-xs font-semibold text-[#504441]">
            <span className="tabular-nums text-[#72564c]">{steps.length || '—'}</span> nét
          </p>
        </div>
        <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-4 text-[11px] leading-snug">
          {steps.map((line, i) => (
            <li
              key={`${currentChar}-${i}`}
              className="flex gap-2.5 rounded-xl border border-[#ebe6e0] bg-[#fafaf5]/90 px-3 py-2.5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#72564c] text-[10px] font-bold text-white shadow-sm">
                {i + 1}
              </span>
              <p className="min-w-0 pt-0.5 font-medium text-[#504441]">{line}</p>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
