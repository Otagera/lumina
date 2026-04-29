import "../path-register.js";
import dotenv from "dotenv";
import { BULL_QUEUE_NAMES } from "../../../packages/utils/src/constants.util.ts";
import { createServiceLogger } from "../../../packages/utils/src/logger.util.ts";
import { queueServices } from "./queue/queue.service";
import QueueWorkersHandler from "./queue/queueWorkers.handler";

const logger = createServiceLogger("worker");

const now = Date.now();
dotenv.config();

// Starting the workers handlers
new QueueWorkersHandler(BULL_QUEUE_NAMES.DEFAULT);
new QueueWorkersHandler(BULL_QUEUE_NAMES.IMAGE_OPTIMIZATION);
new QueueWorkersHandler(BULL_QUEUE_NAMES.FACE_RECOGNITION);
new QueueWorkersHandler(BULL_QUEUE_NAMES.FACE_SEARCH);
new QueueWorkersHandler(BULL_QUEUE_NAMES.FACE_CLUSTERING);
new QueueWorkersHandler(BULL_QUEUE_NAMES.BULK_DOWNLOAD);
new QueueWorkersHandler(BULL_QUEUE_NAMES.FILE_DELETION);
new QueueWorkersHandler(BULL_QUEUE_NAMES.EMAIL);
new QueueWorkersHandler(BULL_QUEUE_NAMES.TRASH_CLEANUP);

logger.info("Worker Server started successfully", {
	duration_seconds: (Date.now() - now) / 1000,
});

export { queueServices };
