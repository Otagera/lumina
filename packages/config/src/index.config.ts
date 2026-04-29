import path from "node:path";
import dotenv from "dotenv";

// 1. Try loading from apps/api/.env (where the main backend config resides)
dotenv.config({ path: path.join(import.meta.dir, "../../../apps/api/.env") });

// 2. Try loading from the monorepo root (relative to this file in packages/config/src/)
dotenv.config({ path: path.join(import.meta.dir, "../../../.env") });

// 3. Try loading from the current working directory
dotenv.config();

interface IConfig {
	env: "development" | "test" | "production";
	app_name: string;
	development: Record<string, any>;
	test: Record<string, any>;
	production: Record<string, any>;
}

const config: IConfig = {
	env: (process.env.NODE_ENV || "development") as
		| "development"
		| "test"
		| "production",
	app_name: process.env.APP_NAME || "Lumina",
	development: {
		// DB
		db_user: process.env.PG_USERNAME,
		db_host: process.env.PG_HOSTNAME,
		database: process.env.PG_DATABASE,
		db_password: process.env.PG_PASSWORD,
		db_port: 5432,
		db_url: `${process.env.DB_URL}${process.env.DB_NAME}`,
		base_api_url: process.env.BASE_API_URL || "http://localhost",
		port: process.env.PORT || 5001,
		worker_port: process.env.WORKER_PORT || 5002,
		elysia_port: process.env.ELYSIA_PORT || 3005,
		secret: process.env.SESSION_SECRET,

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
			access_key_id: process.env.R2_ACCESS_KEY_ID,
			secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
			bucket: process.env.R2_BUCKET,
			endpoint: process.env.R2_ENDPOINT,
			region: process.env.R2_REGION || "auto",
			public_url: process.env.R2_PUBLIC_URL,
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
		db_url: `${process.env.TEST_DB_URL}${process.env.TEST_DB_NAME}`,
		base_api_url: process.env.TEST_BASE_API_URL || "http://localhost",
		port: process.env.TEST_PORT || 5001,
		elysia_port: process.env.TEST_ELYSIA_PORT || 3005,
		secret: process.env.TEST_SESSION_SECRET,
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
	},
	production: {
		db_url: process.env.DB_URL,
		base_api_url:
			process.env.BASE_API_URL || "https://entryboost-server-node.onrender.com",
		port: process.env.PORT || 5001,
		secret: process.env.SESSION_SECRET,
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
		ai_service_url: process.env.AI_SERVICE_URL || "http://localhost:8000",
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

export default config;
