import { randomUUID } from "node:crypto";
import { green, isColorSupported } from "colorette";
import { DateTime } from "luxon";
import { pino } from "pino";
import pinoHttp from "pino-http";
// import { startChatterboxServer } from "@chatterbox/chatterbox-sdk";
import config from "../../config/src/index.config.ts";

const envConfig = config[config.env || "development"];

// startChatterboxServer({
// 	appName: config[config.env].chatterbox.app_name,
// 	apiSecret: config[config.env].chatterbox.api_secret,
// 	logFile:
// 		process.env.NODE_ENV === "test"
// 			? "chatterbox-queue-test.json"
// 			: "chatterbox-queue.json",
// });

class PinoLogger {
	httpLoggerInstance;
	_config;

	constructor(_config) {
		this._config = _config;
		const pinoLogger = pino(this._getPinoOptions());
		this.httpLoggerInstance = pinoHttp(this._getPinoHttpOptions(pinoLogger));
	}

	log(message) {
		// console.log('🌶️', message);
		// console.log('🎁', green(message));
		this.trace({ message: green(message), context: "log" });
	}
	info(data, key) {
		this.httpLoggerInstance.logger.info({ data }, key);
	}
	warn(data, key) {
		this.httpLoggerInstance.logger.warn({ data }, key);
	}
	trace(data, key) {
		// console.log('🍅--> ', obj, key, '**', context);
		this.httpLoggerInstance.logger.trace({ data }, key);
	}
	fatal(error, message, context) {
		this.httpLoggerInstance.logger.fatal(
			{
				context: [context, this._config.appName].find(Boolean),
				type: error.name,
				formattedTimestamp: `${this._getDateFormat()}`,
				application: this._config.appName,
				stack: error.stack,
			},
			message,
		);
	}
	error(context, key) {
		this.httpLoggerInstance.logger.error({ context }, key);
	}

	_getDateFormat(date = new Date(), format = "dd-MM-yyyy HH:mm:ss") {
		return DateTime.fromJSDate(date).setZone("system").toFormat(format);
	}

	_getPinoOptions() {
		const transportConfig = this._getLogDestination();

		return {
			name: this._config.appName,
			level: this._config.level,
			base: undefined,
			messageKey: this._config.messageKey,
			errorKey: "error",
			transport: transportConfig,
		};
	}

	_getPinoConfig() {
		return {
			colorize: isColorSupported,
			levelFirst: true,
			ignore: "pid,hostname",
			quietReqLogger: true,
			messageFormat: (log, messageKey) => {
				const message = log[String(messageKey)];
				if (this._config.appName) {
					return `[${this._config.appName}] ${message}`;
				}

				return message;
			},
			customPrettifiers: {
				time: () => {
					return `[${this._getDateFormat()}]`;
				},
			},
		};
	}

	_getLogDestination() {
		const targets = [
			// {
			// 	target: "@chatterbox/chatterbox-sdk/chatterboxTransport.mjs",
			// 	options: {
			// 		appName: this._config.appName,
			// 		apiSecret: process.env.CHATTERBOX_API_SECRET,
			// 		fallbackQueueFilePath: "chatterbox-queue.json",
			// 	},
			// },
		];

		if (this._config.enableConsoleLogs) {
			targets.push({
				target: "pino-pretty",
				options: {
					colorize: true,
					colorizeObjects: true,
					messageKey: this._config.messageKey,
					ignore: "pid,hostname,name",
					singleLine: config.env === "development",
					translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
					customColors: {
						info: "green",
						warn: "yellow",
						trace: "gray",
						fatal: "red",
					},
				},
			});
		}

		return {
			targets: targets,
		};
	}

	_getPinoHttpOptions(logger) {
		return {
			logger,
			quietReqLogger: true,
			genReqId: () => randomUUID(),
			customAttributeKeys: {
				req: "request",
				res: "response",
				err: "error",
				responseTime: "timeTaken",
				reqId: "traceId",
			},
			customReceivedMessage: (req) => {
				return `REQUEST-INITIATED-${req.id}`;
			},
			customSuccessMessage: (req, res) => {
				if (res.statusCode >= 400) {
					return `REQUEST-FAILED-${req.id}`;
				}
				return `REQUEST-COMPLETE-${req.id}`;
			},
			customErrorMessage: (req) => {
				return `REQUEST-FAILED-${req.id}`;
			},
			customReceivedObject: (req) => {
				return {
					request: {
						id: req.id,
						method: req.method,
						url: req.url,
						query: req.query,
						params: req.params,
						body: req.body,
					},
				};
			},
			serializers: {
				err: pino.stdSerializers.err,
				req: (req) => {
					return config.env === "development"
						? `${req.method} ${req.url}`
						: req;
				},
				res: (res) =>
					config.env === "development"
						? `${res.statusCode} ${res.headers["content-type"]}`
						: res,
			},
			customLogLevel: (_req, res) => {
				if (res.statusCode >= 400) {
					return "error";
				}

				if (res.statusCode >= 300 && res.statusCode < 400) {
					return "silent";
				}

				return "info";
			},
			redact: {
				censor: "********",
				paths: [
					"request.body.password",
					"response.headers",
					"request.headers",
					"request.remoteAddress",
					"request.remotePort",
				],
			},
		};
	}
}

const logger = new PinoLogger({
	appName: config[config.env].chatterbox.app_name,
	level: "debug",
	messageKey: "key",
	enableConsoleLogs: true,
});

export const createServiceLogger = (serviceName: string) => {
	const pinoInstance = pino({
		name: serviceName,
		level: envConfig.log_level,
		formatters: {
			bindings: () => ({ service: serviceName }),
		},
	});

	return {
		info: (message: string, meta?: Record<string, unknown>) => {
			pinoInstance.info({ ...meta }, message);
		},
		warn: (message: string, meta?: Record<string, unknown>) => {
			pinoInstance.warn({ ...meta }, message);
		},
		error: (message: string, meta?: Record<string, unknown>) => {
			pinoInstance.error({ ...meta }, message);
		},
		debug: (message: string, meta?: Record<string, unknown>) => {
			pinoInstance.debug({ ...meta }, message);
		},
	};
};

export default logger;
