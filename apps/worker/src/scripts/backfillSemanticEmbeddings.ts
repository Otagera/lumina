#!/usr/bin/env bun
/**
 * Re-enqueue semantic embedding jobs for images whose stored vector was produced
 * by a different model than the target SEMANTIC_MODEL.
 *
 * Safe default is dry-run. Use --enqueue to actually add BullMQ jobs.
 *
 * Examples:
 *   bun apps/worker/src/scripts/backfillSemanticEmbeddings.ts
 *   SEMANTIC_MODEL=mobileclip-s2 bun apps/worker/src/scripts/backfillSemanticEmbeddings.ts --enqueue
 *   bun apps/worker/src/scripts/backfillSemanticEmbeddings.ts --model mobileclip-s2 --limit 500 --enqueue
 */
import prisma from "../../../../packages/config/src/db.config.ts";
import { queueServices } from "../queue/queue.service.ts";

type BackfillRow = {
	image_id: string;
	album_id: string;
	embedding_model: string | null;
};

const argValue = (name: string) => {
	const arg = process.argv.find((a) => a.startsWith(`${name}=`));
	if (arg) return arg.split("=").slice(1).join("=");
	const index = process.argv.indexOf(name);
	return index >= 0 ? process.argv[index + 1] : undefined;
};

const targetModel =
	argValue("--model") || process.env.SEMANTIC_MODEL || "mobileclip-s2";
const limit = Number(argValue("--limit") || 1000);
const shouldEnqueue = process.argv.includes("--enqueue");

const rows = (await prisma.$queryRaw`
	SELECT DISTINCT ai.image_id, ai.album_id, i.embedding_model
	FROM album_images ai
	JOIN albums a ON a.album_id = ai.album_id
	JOIN album_settings s ON s.album_id = a.album_id
	JOIN images i ON i.image_id = ai.image_id
	WHERE s.semantic_search_enabled = true
	AND i.deleted_at IS NULL
	AND (
		i.embedding IS NULL
		OR COALESCE(i.embedding_model, 'clip-vit-b-32') <> ${targetModel}
	)
	ORDER BY ai.image_id
	LIMIT ${limit}
`) as BackfillRow[];

console.log(
	JSON.stringify(
		{
			targetModel,
			mode: shouldEnqueue ? "enqueue" : "dry-run",
			count: rows.length,
			limit,
		},
		null,
		2,
	),
);

if (shouldEnqueue) {
	for (const row of rows) {
		await queueServices.semanticEmbeddingQueueLib.addJob(
			"semanticEmbedding",
			{
				imageId: row.image_id,
				albumId: row.album_id,
				worker: "semanticEmbedding",
			},
			{
				jobId: `semantic-backfill:${targetModel}:${row.image_id}:${row.album_id}`,
				removeOnComplete: { count: 1000 },
				removeOnFail: { count: 1000 },
			},
		);
	}
}

await queueServices.semanticEmbeddingQueueLib.getQueue().close();
await prisma.$disconnect();
