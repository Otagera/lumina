import type { ThemeConfig } from "~/types";

interface StyleControlsProps {
	config: ThemeConfig;
	onChange: (patch: Partial<ThemeConfig>) => void;
}

const FONTS = [
	{ value: "inter", label: "Inter (Default)" },
	{ value: "playfair", label: "Playfair Display" },
	{ value: "raleway", label: "Raleway" },
	{ value: "dm-sans", label: "DM Sans" },
] as const;

const HERO_LAYOUTS = [
	{ value: "two-col", label: "Two Column" },
	{ value: "centered", label: "Centered" },
	{ value: "banner", label: "Full Banner" },
] as const;

const ToggleGroup = ({
	label,
	options,
	value,
	onChange,
}: {
	label: string;
	options: { value: string; label: string }[];
	value: string;
	onChange: (v: string) => void;
}) => (
	<div>
		<label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
			{label}
		</label>
		<div className="flex gap-1.5 flex-wrap">
			{options.map((opt) => (
				<button
					key={opt.value}
					type="button"
					onClick={() => onChange(opt.value)}
					className={`flex-1 min-w-[60px] py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
						value === opt.value
							? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
							: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
					}`}
				>
					{opt.label}
				</button>
			))}
		</div>
	</div>
);

export const StyleControls = ({ config, onChange }: StyleControlsProps) => {
	return (
		<div className="space-y-5">
			{/* Accent Color */}
			<div>
				<label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
					Accent Color
				</label>
				<div className="flex items-center gap-2">
					<input
						type="color"
						value={config.accent ?? "#7C9A7E"}
						onChange={(e) => onChange({ accent: e.target.value })}
						className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer p-0.5 bg-transparent"
					/>
					<input
						type="text"
						value={config.accent ?? "#7C9A7E"}
						onChange={(e) => {
							const val = e.target.value;
							if (/^#[0-9A-Fa-f]{6}$/.test(val)) onChange({ accent: val });
						}}
						placeholder="#7C9A7E"
						maxLength={7}
						className="flex-1 px-3 py-1.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
					/>
				</div>
			</div>

			{/* Background */}
			<div>
				<label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
					Background
				</label>
				<div className="flex gap-2">
					{(["light", "dark", "gradient"] as const).map((bg) => (
						<button
							key={bg}
							type="button"
							onClick={() => onChange({ background: bg })}
							className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
								config.background === bg
									? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
									: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
							}`}
						>
							{bg}
						</button>
					))}
				</div>
				{config.background === "gradient" && (
					<div className="flex items-center gap-2 mt-2">
						<div className="flex-1">
							<label className="block text-[9px] text-zinc-400 mb-1">From</label>
							<input
								type="color"
								value={config.gradientFrom ?? "#E8F5E9"}
								onChange={(e) => onChange({ gradientFrom: e.target.value })}
								className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer p-0.5 bg-transparent"
							/>
						</div>
						<div className="flex-1">
							<label className="block text-[9px] text-zinc-400 mb-1">To</label>
							<input
								type="color"
								value={config.gradientTo ?? "#F0FDF4"}
								onChange={(e) => onChange({ gradientTo: e.target.value })}
								className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer p-0.5 bg-transparent"
							/>
						</div>
					</div>
				)}
			</div>

			{/* Background Texture */}
			<ToggleGroup
				label="Texture"
				options={[
					{ value: "none", label: "None" },
					{ value: "noise", label: "Noise" },
					{ value: "dots", label: "Dots" },
					{ value: "grid-lines", label: "Grid" },
				]}
				value={config.backgroundTexture ?? "none"}
				onChange={(v) => onChange({ backgroundTexture: v as ThemeConfig["backgroundTexture"] })}
			/>

			{/* Font */}
			<div>
				<label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
					Font
				</label>
				<select
					value={config.font ?? "inter"}
					onChange={(e) => onChange({ font: e.target.value as ThemeConfig["font"] })}
					className="w-full px-3 py-2 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
				>
					{FONTS.map((f) => (
						<option key={f.value} value={f.value}>
							{f.label}
						</option>
					))}
				</select>
			</div>

			{/* Corner Radius */}
			<ToggleGroup
				label="Corners"
				options={[
					{ value: "rounded", label: "Rounded" },
					{ value: "sharp", label: "Sharp" },
					{ value: "pill", label: "Pill" },
				]}
				value={config.cornerRadius ?? "rounded"}
				onChange={(v) => onChange({ cornerRadius: v as ThemeConfig["cornerRadius"] })}
			/>

			{/* Hero Layout */}
			<div>
				<label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
					Hero Layout
				</label>
				<select
					value={config.heroLayout ?? "two-col"}
					onChange={(e) =>
						onChange({ heroLayout: e.target.value as ThemeConfig["heroLayout"] })
					}
					className="w-full px-3 py-2 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
				>
					{HERO_LAYOUTS.map((l) => (
						<option key={l.value} value={l.value}>
							{l.label}
						</option>
					))}
				</select>
			</div>

			{/* Hero Background (only for banner) */}
			{config.heroLayout === "banner" && (
				<div className="space-y-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3">
					<label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
						Hero Background
					</label>
					<ToggleGroup
						label=""
						options={[
							{ value: "solid", label: "Solid" },
							{ value: "image", label: "Image" },
							{ value: "slideshow", label: "Slideshow" },
						]}
						value={config.heroMode ?? "solid"}
						onChange={(v) => onChange({ heroMode: v as ThemeConfig["heroMode"] })}
					/>
					{config.heroMode === "image" && (
						<input
							type="url"
							placeholder="https://... (image URL)"
							value={config.heroImage ?? ""}
							onChange={(e) => onChange({ heroImage: e.target.value })}
							className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
						/>
					)}
					{config.heroMode === "slideshow" && (
						<div className="space-y-1.5">
							{(config.heroSlideshow?.length ? config.heroSlideshow : [""]).map((url, i) => (
								<div key={i} className="flex gap-1.5">
									<input
										type="url"
										placeholder={`Slide ${i + 1} URL`}
										value={url}
										onChange={(e) => {
											const next = [...(config.heroSlideshow ?? [""])];
											next[i] = e.target.value;
											onChange({ heroSlideshow: next });
										}}
										className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
									/>
									{(config.heroSlideshow?.length ?? 1) > 1 && (
										<button
											type="button"
											onClick={() => {
												const next = (config.heroSlideshow ?? []).filter((_, j) => j !== i);
												onChange({ heroSlideshow: next });
											}}
											className="px-2 text-zinc-400 hover:text-rose-500 transition-colors text-xs"
										>
											✕
										</button>
									)}
								</div>
							))}
							<button
								type="button"
								onClick={() => onChange({ heroSlideshow: [...(config.heroSlideshow ?? [""]), ""] })}
								className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
							>
								+ Add slide
							</button>
						</div>
					)}
				</div>
			)}

			{/* Photo Grid */}
			<ToggleGroup
				label="Photo Grid"
				options={[
					{ value: "bento", label: "Bento" },
					{ value: "uniform", label: "Uniform" },
					{ value: "masonry", label: "Masonry" },
				]}
				value={config.gridStyle ?? "bento"}
				onChange={(v) => onChange({ gridStyle: v as ThemeConfig["gridStyle"] })}
			/>

			{/* Host Branding */}
			<div className="space-y-2">
				<label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
					Host Branding
				</label>
				<input
					type="text"
					placeholder="@studiojane or studiojane.com"
					value={config.brandingHandle ?? ""}
					onChange={(e) => onChange({ brandingHandle: e.target.value })}
					className="w-full px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
				/>
				<input
					type="url"
					placeholder="https://studiojane.com (optional)"
					value={config.brandingUrl ?? ""}
					onChange={(e) => onChange({ brandingUrl: e.target.value })}
					className="w-full px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
				/>
			</div>

			{/* Album Cover in Hero */}
			{(config.heroLayout === "two-col" || config.heroLayout === "centered" || !config.heroLayout) && (
				<label className="flex items-center gap-2.5 cursor-pointer select-none">
					<input
						type="checkbox"
						checked={config.showCoverInHero ?? false}
						onChange={(e) => onChange({ showCoverInHero: e.target.checked })}
						className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 accent-zinc-900 dark:accent-white"
					/>
					<span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
						Show album cover in hero
					</span>
				</label>
			)}
		</div>
	);
};
