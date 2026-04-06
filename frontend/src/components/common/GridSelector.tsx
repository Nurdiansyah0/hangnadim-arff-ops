

interface GridSelectorProps {
  onSelect: (coordinate: string) => void;
  selected?: string;
}

export default function GridSelector({ onSelect, selected }: GridSelectorProps) {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const cols = Array.from({ length: 13 }, (_, i) => i + 1);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-2xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Grid Map — 1:20k</span>
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{selected || 'Lock Position'}</span>
         </div>
      </div>

      <div className="grid grid-cols-[15px_repeat(13,1fr)] gap-1 auto-rows-fr">
        {/* Empty corner */}
        <div />
        {/* Cols Header */}
        {cols.map(c => (
          <div key={c} className="text-[9px] font-black text-slate-700 text-center uppercase py-2">{c}</div>
        ))}

        {/* Rows */}
        {rows.map(r => (
          Array.from({ length: 14 }).map((_, i) => {
            if (i === 0) {
              return (
                <div key={`${r}-header`} className="text-[9px] font-black text-slate-700 flex items-center justify-center uppercase">{r}</div>
              );
            }
            const c = i;
            const coord = `${r}${c}`;
            const isSelected = selected === coord;
            return (
              <button
                key={coord}
                type="button"
                onClick={() => onSelect(coord)}
                className={`aspect-square w-full rounded-lg text-[9px] font-black transition-all border flex items-center justify-center
                  ${isSelected 
                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-110 z-10' 
                    : 'bg-slate-900/50 border-slate-800/80 text-slate-800 hover:border-slate-600 hover:text-slate-400 hover:bg-slate-900 group/cell'
                  }`}
              >
                <span className={isSelected ? 'opacity-100' : 'opacity-0 group-hover/cell:opacity-100 transition-opacity'}>{coord}</span>
              </button>
            );
          })
        ))}
      </div>
      
      <div className="mt-6 flex justify-between items-center text-[8px] font-bold text-slate-600 uppercase tracking-[0.3em]">
         <span>North: Nagoya</span>
         <span>East: Nongsa</span>
      </div>
    </div>
  );
}
