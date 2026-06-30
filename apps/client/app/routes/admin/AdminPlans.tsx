import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "~/components/standard/Card";
import { Heading } from "~/components/standard/Heading";
import { Button } from "~/components/standard/Button";
import {
	fetchAdminPlans,
	createAdminPlan,
	updateAdminPlan,
	deleteAdminPlan,
} from "../../utils/adminApi";

const EMPTY_FORM = {
	name: "",
	description: "",
	storage_mb: 5120,
	compute_units_per_month: 100,
	price_usd: "$0",
	price_ngn: "₦0",
	is_highlighted: false,
	order: 0,
	features: [""],
};

type PlanForm = typeof EMPTY_FORM;

function PlanDialog({
	plan,
	onClose,
	onSave,
	isLoading,
}: {
	plan: PlanForm & { id?: string };
	onClose: () => void;
	onSave: (data: PlanForm) => void;
	isLoading: boolean;
}) {
	const [form, setForm] = useState<PlanForm>({ ...EMPTY_FORM, ...plan });

	const set = (k: keyof PlanForm, v: unknown) =>
		setForm((f) => ({ ...f, [k]: v }));

	const handleFeatureChange = (i: number, v: string) => {
		const features = [...form.features];
		features[i] = v;
		set("features", features);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
			<div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
				<Heading level={2} className="text-lg font-black">
					{plan.id ? "Edit Plan" : "New Plan"}
				</Heading>
				{(
					[
						["name", "Name", "text"],
						["description", "Description", "text"],
						["price_usd", "Price (USD)", "text"],
						["price_ngn", "Price (NGN)", "text"],
						["storage_mb", "Storage (MB)", "number"],
						["compute_units_per_month", "Compute Units / mo", "number"],
						["order", "Sort Order", "number"],
					] as [keyof PlanForm, string, string][]
				).map(([k, label, type]) => (
					<label key={k} className="block">
						<span className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-1 block">
							{label}
						</span>
						<input
							type={type}
							value={form[k] as string | number}
							onChange={(e) =>
								set(k, type === "number" ? Number(e.target.value) : e.target.value)
							}
							className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage/30"
						/>
					</label>
				))}
				<label className="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={form.is_highlighted}
						onChange={(e) => set("is_highlighted", e.target.checked)}
						className="rounded"
					/>
					<span className="text-sm font-bold">Highlighted (featured)</span>
				</label>
				<div>
					<span className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-1 block">
						Features
					</span>
					{form.features.map((f, i) => (
						<input
							key={i}
							value={f}
							onChange={(e) => handleFeatureChange(i, e.target.value)}
							placeholder={`Feature ${i + 1}`}
							className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage/30 mb-2"
						/>
					))}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => set("features", [...form.features, ""])}
					>
						+ Add Feature
					</Button>
				</div>
				<div className="flex gap-2 pt-2">
					<Button variant="secondary" onClick={onClose} className="flex-1">
						Cancel
					</Button>
					<Button
						onClick={() => onSave({ ...form, features: form.features.filter(Boolean) })}
						disabled={isLoading}
						className="flex-1"
					>
						{isLoading ? "Saving…" : "Save"}
					</Button>
				</div>
			</div>
		</div>
	);
}

export default function AdminPlans() {
	const qc = useQueryClient();
	const [editing, setEditing] = useState<null | (PlanForm & { id?: string })>(null);

	const { data: plans = [], isLoading } = useQuery({
		queryKey: ["admin", "plans"],
		queryFn: fetchAdminPlans,
	});

	const createMutation = useMutation({
		mutationFn: createAdminPlan,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin", "plans"] });
			toast.success("Plan created.");
			setEditing(null);
		},
		onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: PlanForm }) =>
			updateAdminPlan(id, data as any),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin", "plans"] });
			toast.success("Plan updated.");
			setEditing(null);
		},
		onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
	});

	const deleteMutation = useMutation({
		mutationFn: deleteAdminPlan,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin", "plans"] });
			toast.success("Plan deleted.");
		},
		onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
	});

	const handleSave = (data: PlanForm) => {
		if (editing?.id) {
			updateMutation.mutate({ id: editing.id, data });
		} else {
			createAdminPlan(data as any).then(() => {
				qc.invalidateQueries({ queryKey: ["admin", "plans"] });
				toast.success("Plan created.");
				setEditing(null);
			}).catch((e: any) => toast.error(e.response?.data?.message ?? "Failed"));
		}
	};

	return (
		<div className="p-6 md:p-10 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<Heading level={1} className="text-2xl font-black">Plans</Heading>
					<p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Manage subscription plans.</p>
				</div>
				<Button onClick={() => setEditing({ ...EMPTY_FORM })}>
					<Plus size={14} className="mr-1.5" /> New Plan
				</Button>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
					{plans.map((plan: any) => (
						<Card
							key={plan.id}
							hoverable={false}
							className={`p-6 relative ${plan.is_highlighted ? "ring-2 ring-sage" : ""}`}
						>
							{plan.is_highlighted && (
								<span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider bg-sage/10 text-sage px-2 py-0.5 rounded-full">
									Featured
								</span>
							)}
							<div className="mb-4">
								<Heading level={2} className="text-lg font-black capitalize">
									{plan.name}
								</Heading>
								<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
									{plan.description}
								</p>
							</div>
							<p className="text-2xl font-black text-zinc-900 dark:text-white mb-1">
								{plan.price_usd}
							</p>
							<p className="text-sm text-zinc-400 mb-3">{plan.price_ngn}</p>
							<div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
								<Users size={12} />
								<span>{plan._count?.users ?? 0} users on this plan</span>
							</div>
							<ul className="space-y-1 mb-4">
								{(plan.features ?? []).map((f: string) => (
									<li key={f} className="text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-1">
										<span className="text-sage mt-0.5">✓</span> {f}
									</li>
								))}
							</ul>
							<div className="flex gap-2">
								<Button
									variant="secondary"
									size="sm"
									onClick={() => setEditing({ ...EMPTY_FORM, ...plan })}
									className="flex-1"
								>
									<Pencil size={12} className="mr-1" /> Edit
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="text-plum dark:text-rose-400 hover:bg-plum/10"
									onClick={() => {
										if (confirm(`Delete plan "${plan.name}"? This cannot be undone.`)) {
											deleteMutation.mutate(plan.id);
										}
									}}
								>
									<Trash2 size={12} />
								</Button>
							</div>
						</Card>
					))}
				</div>
			)}

			{editing !== null && (
				<PlanDialog
					plan={editing}
					onClose={() => setEditing(null)}
					onSave={handleSave}
					isLoading={createMutation.isPending || updateMutation.isPending}
				/>
			)}
		</div>
	);
}
