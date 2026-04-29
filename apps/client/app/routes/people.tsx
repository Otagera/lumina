import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Combine, Trash2, User, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { BackButton } from "~/components/BackButton";
import { ConfirmModal } from "~/components/ConfirmModal";
import { MainContainer } from "~/components/MainContainer";
import { Button } from "~/components/standard/Button";
import { Heading } from "~/components/standard/Heading";
import type { Person } from "~/types";
import { deletePerson, fetchPeople } from "~/utils/api";
import axiosAPI from "~/utils/axios";

export default function PeoplePage() {
	const queryClient = useQueryClient();
	const [isMergeMode, setIsMergeMode] = useState(false);
	const [sourcePerson, setSourcePerson] = useState<Person | null>(null);
	const [targetPerson, setTargetPerson] = useState<Person | null>(null);

	const { data: peopleResponse, isLoading } = useQuery({
		queryKey: ["people"],
		queryFn: fetchPeople,
	});

	const people: Person[] = peopleResponse?.data || [];

	const mergeMutation = useMutation({
		mutationFn: async () => {
			if (!sourcePerson || !targetPerson) return;
			const res = await axiosAPI.post("/people/merge", {
				sourcePersonId: sourcePerson.personId,
				targetPersonId: targetPerson.personId,
			});
			return res.data;
		},
		onSuccess: () => {
			toast.success("People merged successfully");
			setSourcePerson(null);
			setTargetPerson(null);
			setIsMergeMode(false);
			queryClient.invalidateQueries({ queryKey: ["people"] });
			queryClient.invalidateQueries({ queryKey: ["images"] });
		},
		onError: (error: any) => {
			toast.error(error?.response?.data?.message || "Failed to merge people");
		},
	});

	const handlePersonClick = (person: Person) => {
		if (!isMergeMode) return;

		if (!sourcePerson) {
			setSourcePerson(person);
			toast("Now select the person to merge INTO.", { icon: "👤" });
		} else if (!targetPerson && person.personId !== sourcePerson.personId) {
			setTargetPerson(person);
		}
	};

	const cancelMerge = () => {
		setIsMergeMode(false);
		setSourcePerson(null);
		setTargetPerson(null);
	};

	return (
		<MainContainer className="space-y-12 pb-24">
			<BackButton label="Back to Dashboard" to="/home" />

			<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
				<Heading level={1} className="text-5xl md:text-6xl">
					People
				</Heading>

				<Button
					variant={isMergeMode ? "secondary" : "primary"}
					onClick={() => (isMergeMode ? cancelMerge() : setIsMergeMode(true))}
					className="rounded-2xl font-bold px-6"
				>
					{isMergeMode ? (
						<>
							<X className="w-4 h-4 mr-2" /> Cancel Merge
						</>
					) : (
						<>
							<Combine className="w-4 h-4 mr-2" /> Merge People
						</>
					)}
				</Button>
			</div>

			{isMergeMode && (
				<div className="mb-12 p-6 bg-sage/5 border border-sage/20 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
					<div>
						<h3 className="font-black text-xl text-zinc-900 dark:text-white">
							Merge Mode Active
						</h3>
						<p className="text-sm text-zinc-500 font-medium mt-1">
							{!sourcePerson
								? "Select the person you want to remove (Source)."
								: !targetPerson
									? `Merging "${sourcePerson.name}" into... (Select Target)`
									: `Ready to merge "${sourcePerson.name}" into "${targetPerson.name}"`}
						</p>
					</div>
					{sourcePerson && targetPerson && (
						<Button
							onClick={() => mergeMutation.mutate()}
							disabled={mergeMutation.isPending}
							className="bg-sage hover:bg-sage/90 text-zinc-950 font-bold rounded-2xl px-8 py-6 shadow-xl shadow-sage/20"
						>
							{mergeMutation.isPending ? "Merging..." : "Confirm Merge"}
						</Button>
					)}
				</div>
			)}

			<div className="flex-1">
				{isLoading ? (
					<div className="flex items-center justify-center h-64">
						<div className="w-8 h-8 border-4 border-sage border-t-transparent rounded-full animate-spin" />
					</div>
				) : people.length === 0 ? (
					<div className="text-center py-32 bg-zinc-50 dark:bg-zinc-900/30 rounded-[3rem] border border-zinc-100 dark:border-zinc-800">
						<p className="text-zinc-500 font-bold">
							No people identified yet. Add tags or wait for clustering to run.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
						{people.map((person) => {
							const isSource = sourcePerson?.personId === person.personId;
							const isTarget = targetPerson?.personId === person.personId;
							const isSelectable = isMergeMode && !isSource && !isTarget;

							return (
								<button
									key={person.personId}
									type="button"
									onClick={() => handlePersonClick(person)}
									disabled={isMergeMode && (isSource || isTarget)}
									className={`group relative flex flex-col items-center gap-4 transition-all duration-300 ${
										isSource
											? "opacity-50 scale-95"
											: isTarget
												? "scale-105"
												: isSelectable
													? "hover:scale-105 cursor-pointer"
													: "cursor-default"
									}`}
								>
									<div
										className={`relative aspect-square w-full rounded-[2.5rem] overflow-hidden border-4 transition-all duration-300 bg-zinc-100 dark:bg-zinc-800 shadow-sm ${
											isSource
												? "border-red-500 shadow-red-500/20"
												: isTarget
													? "border-green-500 shadow-xl shadow-green-500/20"
													: isSelectable
														? "border-transparent group-hover:border-sage group-hover:shadow-lg group-hover:shadow-sage/10"
														: "border-transparent"
										}`}
									>
										{person.faceUrl ? (
											<img
												src={person.faceUrl}
												alt={person.name}
												className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
												onError={(e) => {
													const target = e.target as HTMLImageElement;
													target.style.display = "none";
													const parent = target.parentElement;
													if (parent) {
														const fallback = document.createElement("div");
														fallback.className =
															"w-full h-full flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-800";
														fallback.innerHTML = `
															<svg class="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
															</svg>
															<span class="text-[10px] text-zinc-400 mt-1">Face unavailable</span>
														`;
														parent.appendChild(fallback);
													}
												}}
											/>
										) : null}

										{!person.faceUrl && (
											<div className="w-full h-full flex items-center justify-center">
												<User className="w-12 h-12 text-zinc-300" />
											</div>
										)}

										{isSource && (
											<div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
												<div className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
													Source
												</div>
											</div>
										)}
										{isTarget && (
											<div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
												<div className="bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
													Target
												</div>
											</div>
										)}
									</div>

									<span
										className={`font-black text-center line-clamp-1 px-2 transition-colors ${
											isSource
												? "text-red-500"
												: isTarget
													? "text-green-500"
													: "text-zinc-900 dark:text-white"
										}`}
									>
										{person.name}
									</span>
								</button>
							);
						})}
					</div>
				)}
			</div>
		</MainContainer>
	);
}
