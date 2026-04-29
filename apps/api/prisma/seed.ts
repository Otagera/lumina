import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("Seeding enhanced plans...");

	const plans = [
		{
			name: "free",
			description: "Great for personal use and small events.",
			storage_mb: 5 * 1024,
			compute_units_per_month: 100,
			price_usd: "Free",
			price_ngn: "Free",
			is_highlighted: false,
			order: 1,
			features: [
				"5 GB Storage",
				"100 AI Images / mo",
				"Unlimited Collaborative Albums",
				"Face Search Included",
			],
		},
		{
			name: "pro",
			description: "For professional photographers and large events.",
			storage_mb: 50 * 1024,
			compute_units_per_month: -1, // Unlimited
			price_usd: "$9.99",
			price_ngn: "₦12,500",
			is_highlighted: true,
			order: 2,
			features: [
				"50 GB Storage",
				"Unlimited AI Processing",
				"Custom Storage (R2/S3) Included",
				"Priority Support",
			],
		},
		{
			name: "byos",
			description: "Power users who want to control their own data.",
			storage_mb: -1, // Unlimited (since it's their own storage)
			compute_units_per_month: -1,
			price_usd: "$14.99",
			price_ngn: "₦19,500",
			is_highlighted: false,
			order: 3,
			features: [
				"Unlimited Local Storage",
				"Unlimited AI Processing",
				"Bring Your Own S3/R2",
				"White-labeled QR codes",
			],
		},
	];

	for (const planData of plans) {
		await prisma.plans.upsert({
			where: { name: planData.name },
			update: planData,
			create: planData,
		});
	}

	const freePlan = await prisma.plans.findUnique({ where: { name: "free" } });

	console.log("Plans seeded successfully.");

	if (freePlan) {
		console.log("Linking users with missing plan_id to free plan...");
		await prisma.users.updateMany({
			where: { plan_id: null },
			data: { plan_id: freePlan.id, plan_name: "free" },
		});
	}

	console.log("Seeding completed.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
