import type { ThemeConfig } from "~/types";
import type { PresetMeta } from "~/utils/themePresets";

interface PresetGridProps {
	presets: PresetMeta[];
	activePreset?: string;
	onSelect: (config: ThemeConfig, key: string) => void;
}

export const PresetGrid = ({ presets, activePreset, onSelect }: PresetGridProps) => {
	return (
		<div className="grid grid-cols-2 gap-2">
			{presets.map((preset) => {
				const isActive = activePreset === preset.key;
				return (
					<button
						key={preset.key}
						type="button"
						onClick={() => onSelect(preset.config, preset.key)}
						className={`relative flex flex-col p-3 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-95 ${
							isActive
								? "border-zinc-900 dark:border-white ring-2 ring-zinc-900 dark:ring-white ring-offset-1"
								: "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
						}`}
					>
						<div className="flex gap-1 mb-2">
							{preset.swatches.map((color, i) => (
								<div
									key={i}
									className="w-4 h-4 rounded-full border border-black/10"
									style={{ backgroundColor: color }}
								/>
							))}
						</div>
						<span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
							{preset.label}
						</span>
						<span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
							{preset.description}
						</span>
						{isActive && (
							<div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center">
								<svg className="w-2.5 h-2.5 text-white dark:text-zinc-900" viewBox="0 0 10 10" fill="currentColor">
									<path d="M8.5 2.5L4 7.5 1.5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</div>
						)}
					</button>
				);
			})}
		</div>
	);
};
