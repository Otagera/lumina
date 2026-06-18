import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { fetchPlans } from "../utils/api";
import { useAuth } from "../utils/auth";
import FeaturesSoft from "./FeaturesSoft";
import HeroCollage from "./HeroCollage";
import LivePreview from "./LivePreview";
import PricingTiles from "./PricingTiles";
import UseCaseSection from "./UseCaseSection";

const Welcome = () => {
	const { isAuthenticated, isInitialized } = useAuth();

	const { data: plansData, isLoading: isPlansLoading } = useQuery({
		queryKey: ["plans"],
		queryFn: fetchPlans,
	});

	if (isInitialized && isAuthenticated) {
		return <Navigate to="/home" replace />;
	}

	const plans = plansData?.data || [];

	return (
		<div className="relative min-h-[calc(100vh-73px)] overflow-hidden bg-zinc-50 dark:bg-zinc-950">
			<div className="relative mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 py-14 sm:px-10 lg:py-20">
				<HeroCollage />
				<FeaturesSoft />
				<UseCaseSection />
				<LivePreview />
				<PricingTiles plans={plans} isLoading={isPlansLoading} />
			</div>
		</div>
	);
};

export default Welcome;
