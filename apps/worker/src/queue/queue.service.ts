import { Queue } from "bullmq";
import { BULL_QUEUE_NAMES } from "../../../../packages/utils/src/constants.util.ts";
import redisClient from "../../../../packages/utils/src/redisClient.util.ts";

export const queueConnectionConfig = { connection: redisClient };

// The queues
const defaultQueue = new Queue(BULL_QUEUE_NAMES.DEFAULT, queueConnectionConfig);
const faceRecognitionQueue = new Queue(
	BULL_QUEUE_NAMES.FACE_RECOGNITION,
	queueConnectionConfig,
);
const faceSearchQueue = new Queue(
	BULL_QUEUE_NAMES.FACE_SEARCH,
	queueConnectionConfig,
);
const imageOptimizationQueue = new Queue(
	BULL_QUEUE_NAMES.IMAGE_OPTIMIZATION,
	queueConnectionConfig,
);
const faceClusteringQueue = new Queue(
	BULL_QUEUE_NAMES.FACE_CLUSTERING,
	queueConnectionConfig,
);
const bulkDownloadQueue = new Queue(
	BULL_QUEUE_NAMES.BULK_DOWNLOAD,
	queueConnectionConfig,
);
const fileDeletionQueue = new Queue(
	BULL_QUEUE_NAMES.FILE_DELETION,
	queueConnectionConfig,
);
const emailQueue = new Queue(BULL_QUEUE_NAMES.EMAIL, queueConnectionConfig);
const trashCleanupQueue = new Queue(
	BULL_QUEUE_NAMES.TRASH_CLEANUP,
	queueConnectionConfig,
);

// The lib that contain adding the job and getting the queue
export class QueueLib {
	_queue;
	constructor(queue) {
		this._queue = queue;
	}

	async addJob(queueName, data, options?: any) {
		return await this._queue.add(queueName, data, options);
	}
	getQueue() {
		return this._queue;
	}
}

class QueueServices {
	defaultQueueLib;
	faceRecognitionQueueLib;
	faceSearchQueueLib;
	imageOptimizationQueueLib;
	faceClusteringQueueLib;
	bulkDownloadQueueLib;
	fileDeletionQueueLib;
	emailQueueLib;
	trashCleanupQueueLib;

	constructor() {
		this.defaultQueueLib = new QueueLib(defaultQueue);
		this.faceRecognitionQueueLib = new QueueLib(faceRecognitionQueue);
		this.faceSearchQueueLib = new QueueLib(faceSearchQueue);
		this.imageOptimizationQueueLib = new QueueLib(imageOptimizationQueue);
		this.faceClusteringQueueLib = new QueueLib(faceClusteringQueue);
		this.bulkDownloadQueueLib = new QueueLib(bulkDownloadQueue);
		this.fileDeletionQueueLib = new QueueLib(fileDeletionQueue);
		this.emailQueueLib = new QueueLib(emailQueue);
		this.trashCleanupQueueLib = new QueueLib(trashCleanupQueue);
	}
}

export const queueServices = new QueueServices();
