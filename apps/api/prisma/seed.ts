import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("Seeding enhanced plans...");

	const plans = [
		{
			name: "free",
			description: "Great for personal use and small events.",
			storage_mb: 5 * 1024,
			compute_units_per_month: 300,
			price_usd: "Free",
			price_ngn: "Free",
			is_highlighted: false,
			order: 1,
			features: [
				"5 GB Storage",
				"300 AI Images / mo",
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

	console.log("Seeding system user...");

	const systemUserEmail = "system@lumina.otagera.xyz";
	const systemUser = await prisma.users.upsert({
		where: { email: systemUserEmail },
		update: {},
		create: {
			email: systemUserEmail,
			password:
				"$2a$12$placeholder_hash_for_system_user_do_not_use_this_to_login",
			plan_name: "free",
			plan_id: freePlan?.id,
		},
	});

	console.log(`System user created/updated: ${systemUser.user_id}`);

	const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
	const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

	if (adminEmail && adminPassword) {
		console.log(`Seeding admin user: ${adminEmail}`);
		const hash = await Bun.password.hash(adminPassword);
		await prisma.users.upsert({
			where: { email: adminEmail },
			update: { role: "SUPER_ADMIN" },
			create: {
				email: adminEmail,
				password: hash,
				plan_name: "free",
				plan_id: freePlan?.id,
				role: "SUPER_ADMIN",
			},
		});
		console.log(`Admin user seeded: ${adminEmail}`);
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
