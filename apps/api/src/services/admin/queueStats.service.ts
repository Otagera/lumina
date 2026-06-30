import Joi from "joi";
import { queueServices } from "../../../../worker/src/queue/queue.service.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const queueNameSpec = Joi.object({
	queue_name: Joi.string().required(),
});
const jobSpec = Joi.object({
	queue_name: Joi.string().required(),
	job_id: Joi.string().required(),
});
const listSpec = Joi.object({});

const aliasSpec = {
	request: { queueName: "queue_name", jobId: "job_id" },
	response: {},
};

const QUEUE_MAP: Record<string, ReturnType<typeof queueServices.defaultQueueLib.getQueue>> = {};

const initQueueMap = () => {
	if (Object.keys(QUEUE_MAP).length > 0) return;
	QUEUE_MAP["default"] = queueServices.defaultQueueLib.getQueue();
	QUEUE_MAP["image_optimization"] = queueServices.imageOptimizationQueueLib.getQueue();
	QUEUE_MAP["face_recognition"] = queueServices.faceRecognitionQueueLib.getQueue();
	QUEUE_MAP["face_search"] = queueServices.faceSearchQueueLib.getQueue();
	QUEUE_MAP["face_clustering"] = queueServices.faceClusteringQueueLib.getQueue();
	QUEUE_MAP["bulk_download"] = queueServices.bulkDownloadQueueLib.getQueue();
	QUEUE_MAP["file_deletion"] = queueServices.fileDeletionQueueLib.getQueue();
	QUEUE_MAP["email"] = queueServices.emailQueueLib.getQueue();
	QUEUE_MAP["trash_cleanup"] = queueServices.trashCleanupQueueLib.getQueue();
	QUEUE_MAP["semantic_embedding"] = queueServices.semanticEmbeddingQueueLib.getQueue();
};

export const getAllQueueStatsService = async () => {
	validateSpec(listSpec, aliaserSpec(aliasSpec.request, {}));
	initQueueMap();
	const stats = await Promise.all(
		Object.entries(QUEUE_MAP).map(async ([name, queue]) => {
			const counts = await queue.getJobCounts("active", "waiting", "completed", "failed", "delayed");
			return { name, ...counts };
		}),
	);
	return aliaserSpec(aliasSpec.response, stats);
};

export const getQueueFailedJobsService = async (queueName: string) => {
	const params = validateSpec(queueNameSpec, aliaserSpec(aliasSpec.request, { queueName }));
	initQueueMap();
	const queue = QUEUE_MAP[params.queue_name];
	if (!queue) throw new NotFoundError("Queue not found");

	const jobs = await queue.getJobs(["failed"], 0, 19);
	return aliaserSpec(aliasSpec.response, jobs.map((j) => ({
		id: j.id,
		name: j.name,
		failedReason: j.failedReason,
		attemptsMade: j.attemptsMade,
		timestamp: j.timestamp,
		processedOn: j.processedOn,
	})));
};

export const retryQueueJobService = async (queueName: string, jobId: string) => {
	const params = validateSpec(jobSpec, aliaserSpec(aliasSpec.request, { queueName, jobId }));
	initQueueMap();
	const queue = QUEUE_MAP[params.queue_name];
	if (!queue) throw new NotFoundError("Queue not found");

	const job = await queue.getJob(params.job_id);
	if (!job) throw new NotFoundError("Job not found");

	await job.retry();
	return aliaserSpec(aliasSpec.response, { retried: true });
};

export const clearQueueFailedService = async (queueName: string) => {
	const params = validateSpec(queueNameSpec, aliaserSpec(aliasSpec.request, { queueName }));
	initQueueMap();
	const queue = QUEUE_MAP[params.queue_name];
	if (!queue) throw new NotFoundError("Queue not found");

	await queue.clean(0, 0, "failed");
	return aliaserSpec(aliasSpec.response, { cleared: true });
};
