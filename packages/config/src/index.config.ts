import path from "node:path";
import dotenv from "dotenv";

// Load .env from multiple possible locations
const envPaths = [
	path.join(import.meta.dir, "../../../apps/api/.env"),
	path.join(import.meta.dir, "../../../.env"),
	path.resolve(".env"),
	path.resolve("apps/api/.env"),
];

const initialNodeEnv = process.env.NODE_ENV;
let loadedEnv: any = {};
for (const envPath of envPaths) {
	try {
		const result = dotenv.config({ path: envPath, override: true });
		if (result.parsed) {
			loadedEnv = { ...loadedEnv, ...result.parsed };
			console.log(`[Config] SUCCESS: Loaded .env from: ${envPath}`);
			break;
		}
	} catch (e) {
		console.log(`[Config] FAILED: Could not load .env from: ${envPath}`);
	}
}

// Helper to get env value
const getEnv = (key: string): string | undefined => {
	// If we are in test mode, prioritize initial process.env over loadedEnv for NODE_ENV
	if (key === "NODE_ENV" && initialNodeEnv === "test") {
		return "test";
	}
	return loadedEnv[key] || process.env[key];
};

interface IConfig {
	env: "development" | "test" | "production";
	app_name: string;
	development: Record<string, any>;
	test: Record<string, any>;
	production: Record<string, any>;
}

const config: IConfig = {
	env: (getEnv("NODE_ENV") || "development") as
		| "development"
		| "test"
		| "production",
	app_name: getEnv("APP_NAME") || "Lumina",
	development: {
		// System user for orphan records
		system_user_id: getEnv("SYSTEM_USER_ID"),

		// DB
		db_user: getEnv("PG_USERNAME"),
		db_host: getEnv("PG_HOSTNAME"),
		database: getEnv("PG_DATABASE"),
		db_password: getEnv("PG_PASSWORD"),
		db_port: 5432,
		db_url: `${getEnv("DB_URL")}/${getEnv("DB_NAME")}`,
		base_api_url: getEnv("BASE_API_URL") || "http://localhost",
		port: getEnv("PORT") || 5001,
		worker_port: getEnv("WORKER_PORT") || 5002,
		elysia_port: getEnv("ELYSIA_PORT") || 3005,
		secret: getEnv("SESSION_SECRET"),

		// Redis
		redis_port: process.env.REDIS_PORT,
		redis_host: process.env.REDIS_HOSTNAME,
		redis_username: process.env.REDIS_USERNAME || "default",
		redis_password: process.env.REDIS_PASSWORD || "",
		redis_url: process.env.REDIS_URL,

		// chatterbox
		chatterbox_log_file: process.env.LOG_FILE || "logQueue.json",
		chatterbox_retry_delay: process.env.RETRY_DELAY_MS || 10000,
		chatterbox_max_bulk_log: process.env.MAX_BULK_LOG || 10,
		chatterbox_api_url:
			process.env.CHATTERBOX_API_URL || "http://localhost:3005",
		chatterbox_app_name: process.env.CHATTERBOX_APP_NAME || "lumina",
		chatterbox_api_secret: process.env.CHATTERBOX_API_SECRET,

		chatterbox: {
			log_file: process.env.LOG_FILE || "logQueue.json",
			retry_delay_MS: Number(process.env.RETRY_DELAY_MS) || 10000,
			max_bilk_log: Number(process.env.MAX_BULK_LOG) || 10,
			api_url: process.env.CHATTERBOX_API_URL,
			logging_api_url: process.env.LOGGING_API_URL,
			bulk_logging_api_url: process.env.BULK_LOGGING_API_URL,
			app_name: process.env.CHATTERBOX_APP_NAME || "chatterbox",
			api_secret: process.env.CHATTERBOX_API_SECRET,
		},

		// python
		python_interpreter_path: path.join(
			__dirname,
			"..",
			"..",
			"..",
			"venv",
			"bin",
			"python",
		),
		ai_service_url: process.env.AI_SERVICE_URL || "http://localhost:8000",
		skip_tls_verify: process.env.SKIP_TLS_VERIFY === "true",

		// Managed R2
		r2: {
			access_key_id: getEnv("R2_ACCESS_KEY_ID"),
			secret_access_key: getEnv("R2_SECRET_ACCESS_KEY"),
			bucket: getEnv("R2_BUCKET"),
			endpoint: getEnv("R2_ENDPOINT"),
			region: getEnv("R2_REGION") || "auto",
			public_url: getEnv("R2_PUBLIC_URL"),
		},

		// Email
		resend_api_key: process.env.RESEND_API_KEY,
		frontend_url: process.env.FRONTEND_URL || "http://localhost:5173",

		// Secrets & Webhooks
		billing_webhook_secret: process.env.BILLING_WEBHOOK_SECRET,
		webhook_secret: process.env.WEBHOOK_SECRET || "default_secret",
		encryption_key: process.env.ENCRYPTION_KEY || "anoda-default-secret-key",

		// Monitoring & Security
		sentry_dsn: process.env.SENTRY_DSN,
		cors_origin: process.env.CORS_ORIGIN,
		log_level: process.env.LOG_LEVEL || "info",
		is_api: process.env.IS_API === "true",
		metrics_token: process.env.METRICS_TOKEN,

		// Plan limits
		plans: {
			free: {
				storage_mb: 5 * 1024, // 5GB
				compute_units_per_month: 100,
			},
			pro: {
				storage_mb: 50 * 1024, // 50GB
				compute_units_per_month: -1, // unlimited
			},
		},
	},
	test: {
		// System user for orphan records
		system_user_id: getEnv("SYSTEM_USER_ID"),

		db_url: `${getEnv("TEST_DB_URL")}/${getEnv("TEST_DB_NAME")}`,
		base_api_url: getEnv("TEST_BASE_API_URL") || "http://localhost",
		port: getEnv("TEST_PORT") || 5001,
		worker_port: getEnv("TEST_WORKER_PORT") || 5002,
		elysia_port: getEnv("TEST_ELYSIA_PORT") || 3005,
		secret: getEnv("TEST_SESSION_SECRET"),
		redis_port: process.env.TEST_REDIS_PORT, // Redis port
		redis_host: process.env.TEST_REDIS_HOSTNAME, // Redis host
		redis_username: process.env.TEST_REDIS_USERNAME || "default", // needs Redis >= 6
		redis_password: process.env.TEST_REDIS_PASSWORD || "",
		redis_url: process.env.TEST_REDIS_URL,

		chatterbox: {
			log_file: process.env.LOG_FILE || "testLogQueue.json",
			retry_delay_MS: Number(process.env.RETRY_DELAY_MS) || 10000,
			max_bilk_log: Number(process.env.MAX_BULK_LOG) || 10,
			api_url: process.env.CHATTERBOX_API_URL,
			logging_api_url: process.env.LOGGING_API_URL,
			bulk_logging_api_url: process.env.BULK_LOGGING_API_URL,
			app_name: process.env.CHATTERBOX_APP_NAME || "chatterbox",
			api_secret: process.env.CHATTERBOX_API_SECRET,
		},

		// python
		python_interpreter_path: path.join(
			__dirname,
			"..",
			"..",
			"..",
			"venv",
			"bin",
			"python",
		),
		ai_service_url: process.env.TEST_AI_SERVICE_URL || "http://localhost:8000",
		skip_tls_verify: process.env.SKIP_TLS_VERIFY === "true",

		// Email
		resend_api_key: process.env.RESEND_API_KEY,
		frontend_url: process.env.FRONTEND_URL || "http://localhost:5173",

		// Secrets & Webhooks
		billing_webhook_secret: process.env.BILLING_WEBHOOK_SECRET,
		webhook_secret: process.env.WEBHOOK_SECRET || "default_secret",
		encryption_key: process.env.ENCRYPTION_KEY || "anoda-default-secret-key",

		// Monitoring & Security
		sentry_dsn: process.env.SENTRY_DSN,
		cors_origin: process.env.CORS_ORIGIN,
		log_level: process.env.LOG_LEVEL || "info",
		is_api: process.env.IS_API === "true",
		metrics_token: process.env.METRICS_TOKEN || "test-metrics-token",
	},
	production: {
		// System user for orphan records
		system_user_id: getEnv("SYSTEM_USER_ID"),

		db_url: getEnv("DB_URL"),
		base_api_url: getEnv("BASE_API_URL") || "https://lumina-api.otagera.xyz",
		port: getEnv("PORT") || 5001,
		secret: getEnv("SESSION_SECRET"),
		redis_port: process.env.REDIS_PORT, // Redis port
		redis_host: process.env.REDIS_HOSTNAME, // Redis host
		redis_username: process.env.REDIS_USERNAME || "default", // needs Redis >= 6
		redis_password: process.env.REDIS_PASSWORD || "",
		redis_url: process.env.REDIS_URL,

		// chatterbox
		chatterbox_log_file: process.env.LOG_FILE || "logQueue.json",
		chatterbox_retry_delay: process.env.RETRY_DELAY_MS || 10000,
		chatterbox_max_bulk_log: process.env.MAX_BULK_LOG || 10,
		chatterbox_api_url:
			process.env.CHATTERBOX_API_URL || "http://localhost:3005",
		chatterbox_app_name: process.env.CHATTERBOX_APP_NAME || "lumina",
		chatterbox_api_secret: process.env.CHATTERBOX_API_SECRET,

		chatterbox: {
			log_file: process.env.LOG_FILE || "logQueue.json",
			retry_delay_MS: Number(process.env.RETRY_DELAY_MS) || 10000,
			max_bilk_log: Number(process.env.MAX_BULK_LOG) || 10,
			api_url: process.env.CHATTERBOX_API_URL,
			logging_api_url: process.env.LOGGING_API_URL,
			bulk_logging_api_url: process.env.BULK_LOGGING_API_URL,
			app_name: process.env.CHATTERBOX_APP_NAME || "chatterbox",
			api_secret: process.env.CHATTERBOX_API_SECRET,
		},
		ai_service_url:
			process.env.AI_SERVICE_URL || "https://lumina-api.otagera.xyz/",
		skip_tls_verify: process.env.SKIP_TLS_VERIFY === "true",

		// Managed R2
		r2: {
			access_key_id: process.env.R2_ACCESS_KEY_ID,
			secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
			bucket: process.env.R2_BUCKET,
			endpoint: process.env.R2_ENDPOINT,
			region: process.env.R2_REGION || "auto",
			public_url: getEnv("R2_PUBLIC_URL"),
		},

		// Email
		resend_api_key: process.env.RESEND_API_KEY,
		frontend_url: process.env.FRONTEND_URL || "https://lumina.otagera.xyz",

		// Secrets & Webhooks
		billing_webhook_secret: process.env.BILLING_WEBHOOK_SECRET,
		webhook_secret: process.env.WEBHOOK_SECRET || "default_secret",
		encryption_key: process.env.ENCRYPTION_KEY || "anoda-default-secret-key",

		// Monitoring & Security
		sentry_dsn: process.env.SENTRY_DSN,
		cors_origin: process.env.CORS_ORIGIN,
		log_level: process.env.LOG_LEVEL || "info",
		is_api: process.env.IS_API === "true",
		metrics_token: process.env.METRICS_TOKEN,

		// Plan limits
		plans: {
			free: {
				storage_mb: 5 * 1024, // 5GB
				compute_units_per_month: 100,
			},
			pro: {
				storage_mb: 50 * 1024, // 50GB
				compute_units_per_month: -1, // unlimited
			},
		},
	},
};

console.log(`[Config] Current Env: ${config.env}`);

export default config;
