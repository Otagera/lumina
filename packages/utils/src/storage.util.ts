import fs from "node:fs/promises";
import path from "node:path";
import {
	AbortMultipartUploadCommand,
	CompleteMultipartUploadCommand,
	CreateMultipartUploadCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
	UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import config from "../../config/src/index.config.ts";
import { decrypt } from "./encryption.util.ts";

export interface StorageConfig {
	provider: "local" | "r2" | "byos" | "s3";
	credentials?: {
		accessKeyId: string;
		secretAccessKey: string;
		endpoint: string;
		bucket: string;
		region?: string;
	};
	skip_tls_verify?: boolean;
}

export interface UploadOptions {
	key: string;
	contentType?: string;
}

export interface StoragePart {
	ETag: string;
	PartNumber: number;
}

export interface StorageProvider {
	upload(file: Buffer | Uint8Array, options: UploadOptions): Promise<string>;
	delete(key: string): Promise<void>;
	getSignedUrl(key: string, expires?: number): Promise<string>;
	getUploadPresignedUrl(
		key: string,
		contentType: string,
		expires?: number,
		shareToken?: string,
	): Promise<string>;
	// Multipart methods
	createMultipartUpload(key: string, contentType: string): Promise<string>;
	getUploadPartPresignedUrl(
		key: string,
		uploadId: string,
		partNumber: number,
		expires?: number,
	): Promise<string>;
	completeMultipartUpload(
		key: string,
		uploadId: string,
		parts: StoragePart[],
	): Promise<void>;
	abortMultipartUpload(key: string, uploadId: string): Promise<void>;

	getDownloadUrl(key: string): string;
	getObject(key: string): Promise<Buffer>;
	getProviderName(): string;
}

/**
 * Local File System Provider (Development)
 */
export class LocalProvider implements StorageProvider {
	private baseDir: string;
	private baseUrl: string;

	constructor() {
		this.baseDir = path.resolve(process.cwd(), "apps/api/src/uploads");
		this.baseUrl = `http://localhost:${config[config.env || "development"].elysia_port}/api/uploads`;
	}

	getProviderName(): string {
		return "local";
	}

	async upload(
		file: Buffer | Uint8Array,
		options: UploadOptions,
	): Promise<string> {
		const filePath = path.join(this.baseDir, options.key);
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(filePath, file);
		return options.key;
	}

	async delete(key: string): Promise<void> {
		const filePath = path.join(this.baseDir, key);
		try {
			await fs.unlink(filePath);
		} catch (error: any) {
			if (error.code !== "ENOENT") throw error;
		}
	}

	async getSignedUrl(key: string, _expires?: number): Promise<string> {
		return `${this.baseUrl}/${key}`;
	}

	async getUploadPresignedUrl(
		key: string,
		_contentType: string,
		_expires?: number,
		shareToken?: string,
	): Promise<string> {
		// For local, we point to our own API endpoint that handles the direct local upload
		const baseUrl = `http://localhost:${config[config.env || "development"].elysia_port}/api/v1/public/images/upload-direct-local?key=${key}`;
		return shareToken ? `${baseUrl}&shareToken=${shareToken}` : baseUrl;
	}

	async createMultipartUpload(
		_key: string,
		_contentType: string,
	): Promise<string> {
		throw new Error("Multipart upload not supported by LocalProvider");
	}

	async getUploadPartPresignedUrl(
		_key: string,
		_uploadId: string,
		_partNumber: number,
	): Promise<string> {
		throw new Error("Multipart upload not supported by LocalProvider");
	}

	async completeMultipartUpload(
		_key: string,
		_uploadId: string,
		_parts: StoragePart[],
	): Promise<void> {
		throw new Error("Multipart upload not supported by LocalProvider");
	}

	async abortMultipartUpload(_key: string, _uploadId: string): Promise<void> {
		throw new Error("Multipart upload not supported by LocalProvider");
	}

	getDownloadUrl(key: string): string {
		return `${this.baseUrl}/${key}`;
	}

	async getObject(key: string): Promise<Buffer> {
		const filePath = path.join(this.baseDir, key);
		return fs.readFile(filePath);
	}
}

/**
 * Cloudflare R2 / AWS S3 Provider
 */
export class R2Provider implements StorageProvider {
	private client: S3Client;
	private bucket: string;

	constructor(
		cred: NonNullable<StorageConfig["credentials"]> & {
			skip_tls_verify?: boolean;
		},
	) {
		if (cred.skip_tls_verify) {
			console.warn(
				"[STORAGE] SKIP_TLS_VERIFY is enabled. Disabling TLS certificate validation.",
			);
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
		}

		this.client = new S3Client({
			region: cred.region || "auto",
			endpoint: cred.endpoint,
			credentials: {
				accessKeyId: cred.accessKeyId,
				secretAccessKey: cred.secretAccessKey,
			},
			forcePathStyle: true,
		});
		this.bucket = cred.bucket;
	}

	async upload(
		file: Buffer | Uint8Array,
		options: UploadOptions,
	): Promise<string> {
		await this.client.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: options.key,
				Body: file,
				ContentType: options.contentType,
			}),
		);
		return options.key;
	}

	async delete(key: string): Promise<void> {
		await this.client.send(
			new DeleteObjectCommand({
				Bucket: this.bucket,
				Key: key,
			}),
		);
	}

	async getSignedUrl(key: string, expires: number = 3600): Promise<string> {
		const command = new GetObjectCommand({
			Bucket: this.bucket,
			Key: key,
		});
		return getSignedUrl(this.client, command, { expiresIn: expires });
	}

	async getUploadPresignedUrl(
		key: string,
		contentType: string,
		expires: number = 3600,
		_shareToken?: string,
	): Promise<string> {
		const command = new PutObjectCommand({
			Bucket: this.bucket,
			Key: key,
			ContentType: contentType,
		});
		return getSignedUrl(this.client, command, { expiresIn: expires });
	}

	async createMultipartUpload(
		key: string,
		contentType: string,
	): Promise<string> {
		const command = new CreateMultipartUploadCommand({
			Bucket: this.bucket,
			Key: key,
			ContentType: contentType,
		});
		const response = await this.client.send(command);
		return response.UploadId!;
	}

	async getUploadPartPresignedUrl(
		key: string,
		uploadId: string,
		partNumber: number,
		expires: number = 3600,
	): Promise<string> {
		const command = new UploadPartCommand({
			Bucket: this.bucket,
			Key: key,
			UploadId: uploadId,
			PartNumber: partNumber,
		});
		return getSignedUrl(this.client, command, { expiresIn: expires });
	}

	async completeMultipartUpload(
		key: string,
		uploadId: string,
		parts: StoragePart[],
	): Promise<void> {
		const command = new CompleteMultipartUploadCommand({
			Bucket: this.bucket,
			Key: key,
			UploadId: uploadId,
			MultipartUpload: {
				Parts: parts,
			},
		});
		await this.client.send(command);
	}

	async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
		const command = new AbortMultipartUploadCommand({
			Bucket: this.bucket,
			Key: key,
			UploadId: uploadId,
		});
		await this.client.send(command);
	}

	getDownloadUrl(key: string): string {
		// In R2, public URLs depend on a custom domain or a specific R2 URL pattern.
		// For now, we'll use signed URLs for security.
		return key;
	}

	getProviderName(): string {
		return "r2";
	}

	async getObject(key: string): Promise<Buffer> {
		const command = new GetObjectCommand({
			Bucket: this.bucket,
			Key: key,
		});
		const response = await this.client.send(command);
		if (!response.Body) {
			throw new Error(`Empty response for key: ${key}`);
		}
		return Buffer.from(await response.Body.transformToByteArray());
	}
}

/**
 * Main Storage Service Factory
 */
export class StorageService {
	private static instance: StorageService;
	private provider: StorageProvider;

	private constructor() {
		// Default to Managed R2 if configured in .env, otherwise Local
		const envConfig = config[config.env || "development"];
		const r2 = envConfig?.r2;

		if (r2?.access_key_id && r2?.secret_access_key && r2?.bucket) {
			console.log(
				`[STORAGE] Initializing with Managed R2 Bucket: ${r2.bucket}`,
			);
			this.provider = new R2Provider({
				accessKeyId: r2.access_key_id,
				secretAccessKey: r2.secret_access_key,
				bucket: r2.bucket,
				endpoint: r2.endpoint || "",
				region: r2.region,
				skip_tls_verify: (envConfig as any).skip_tls_verify,
			});
		} else {
			console.log("[STORAGE] No Managed R2 configured, using LocalProvider");
			this.provider = new LocalProvider();
		}
	}

	static getInstance(): StorageService {
		if (!StorageService.instance) {
			StorageService.instance = new StorageService();
		}
		return StorageService.instance;
	}

	getProviderName(): string {
		return this.provider.getProviderName();
	}

	/**
	 * Initialize with specific credentials (used for BYOS or Managed R2)
	 */
	getProvider(config?: StorageConfig): StorageProvider {
		if (!config || config.provider === "local") {
			return new LocalProvider();
		}

		if (
			config.provider === "r2" ||
			config.provider === "byos" ||
			config.provider === "s3"
		) {
			if (!config.credentials)
				throw new Error("Credentials required for R2/BYOS provider");

			// Decrypt credentials if they are encrypted
			let { accessKeyId, secretAccessKey } = config.credentials;
			try {
				accessKeyId = decrypt(accessKeyId);
				secretAccessKey = decrypt(secretAccessKey);
			} catch (_e) {
				// If decryption fails, assume they are already plain text
				console.warn("Storage credential decryption failed, using as-is");
			}

			return new R2Provider({
				...config.credentials,
				accessKeyId,
				secretAccessKey,
				skip_tls_verify: config.skip_tls_verify,
			});
		}

		return this.provider;
	}

	// Convenience methods for the default provider
	async upload(
		file: Buffer | Uint8Array,
		options: UploadOptions,
	): Promise<string> {
		return this.provider.upload(file, options);
	}

	async delete(key: string): Promise<void> {
		return this.provider.delete(key);
	}

	async getSignedUrl(key: string, expires?: number): Promise<string> {
		return this.provider.getSignedUrl(key, expires);
	}

	async getUploadPresignedUrl(
		key: string,
		contentType: string,
		expires?: number,
		shareToken?: string,
	): Promise<string> {
		return this.provider.getUploadPresignedUrl(
			key,
			contentType,
			expires,
			shareToken,
		);
	}

	async createMultipartUpload(
		key: string,
		contentType: string,
	): Promise<string> {
		return this.provider.createMultipartUpload(key, contentType);
	}

	async getUploadPartPresignedUrl(
		key: string,
		uploadId: string,
		partNumber: number,
		expires?: number,
	): Promise<string> {
		return this.provider.getUploadPartPresignedUrl(
			key,
			uploadId,
			partNumber,
			expires,
		);
	}

	async completeMultipartUpload(
		key: string,
		uploadId: string,
		parts: StoragePart[],
	): Promise<void> {
		return this.provider.completeMultipartUpload(key, uploadId, parts);
	}

	async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
		return this.provider.abortMultipartUpload(key, uploadId);
	}

	async getObject(key: string): Promise<Buffer> {
		return this.provider.getObject(key);
	}
}

export const storage = StorageService.getInstance();
