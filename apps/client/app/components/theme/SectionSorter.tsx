import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical } from "lucide-react";
import type { ThemeConfig } from "~/types";

type SectionKey = "hero" | "stats" | "search" | "grid";

const SECTION_LABELS: Record<SectionKey, string> = {
	hero: "Hero",
	stats: "Stats Strip",
	search: "Search Bar",
	grid: "Photo Grid",
};

const ALL_SECTIONS: SectionKey[] = ["hero", "stats", "search", "grid"];

interface SortableItemProps {
	id: SectionKey;
	isVisible: boolean;
	onToggleVisibility: (id: SectionKey) => void;
}

const SortableItem = ({ id, isVisible, onToggleVisibility }: SortableItemProps) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id });

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
				isDragging
					? "bg-zinc-200 dark:bg-zinc-700 border-zinc-400 shadow-lg z-50 opacity-90"
					: "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
			} ${!isVisible ? "opacity-40" : ""}`}
		>
			<button
				type="button"
				{...attributes}
				{...listeners}
				className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing touch-none"
				aria-label="Drag to reorder"
			>
				<GripVertical size={14} />
			</button>

			<span className="flex-1 text-zinc-700 dark:text-zinc-200">
				{SECTION_LABELS[id]}
			</span>

			{id !== "hero" && id !== "grid" && (
				<button
					type="button"
					onClick={() => onToggleVisibility(id)}
					className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
					aria-label={isVisible ? "Hide section" : "Show section"}
					title={isVisible ? "Hide" : "Show"}
				>
					{isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
				</button>
			)}
		</div>
	);
};

interface SectionSorterProps {
	config: ThemeConfig;
	onChange: (patch: Partial<ThemeConfig>) => void;
}

export const SectionSorter = ({ config, onChange }: SectionSorterProps) => {
	const sections = config.sections ?? ALL_SECTIONS;

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			const oldIndex = sections.indexOf(active.id as SectionKey);
			const newIndex = sections.indexOf(over.id as SectionKey);
			onChange({ sections: arrayMove(sections, oldIndex, newIndex) });
		}
	};

	const toggleVisibility = (id: SectionKey) => {
		const current = sections;
		if (current.includes(id)) {
			onChange({ sections: current.filter((s) => s !== id) });
		} else {
			const defaultOrder = ALL_SECTIONS;
			const insertAt = defaultOrder.indexOf(id);
			const newSections = [...current];
			let placed = false;
			for (let i = insertAt; i < defaultOrder.length; i++) {
				const afterIdx = newSections.indexOf(defaultOrder[i]);
				if (afterIdx >= 0) {
					newSections.splice(afterIdx, 0, id);
					placed = true;
					break;
				}
			}
			if (!placed) newSections.push(id);
			onChange({ sections: newSections });
		}
	};

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
			<SortableContext items={sections} strategy={verticalListSortingStrategy}>
				<div className="space-y-1.5">
					{sections.map((id) => (
						<SortableItem
							key={id}
							id={id}
							isVisible={true}
							onToggleVisibility={toggleVisibility}
						/>
					))}
					{ALL_SECTIONS.filter((s) => !sections.includes(s)).map((id) => (
						<SortableItem
							key={id}
							id={id}
							isVisible={false}
							onToggleVisibility={toggleVisibility}
						/>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
};
