import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	CACHE_TTL,
	cacheGetOrSet,
	cacheKeys,
	hashCacheParams,
} from "../../../../../packages/utils/src/cache.util.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	share_token: Joi.string().required(),
	status: Joi.string().optional(),
	startDate: Joi.string().optional(),
	endDate: Joi.string().optional(),
	uploaderId: Joi.string().uuid().optional(),
	minFaces: Joi.number().optional(),
	guest_session_id: Joi.string().uuid().optional(),
});

const aliasSpec = {
	request: {
		token: "share_token",
		guestSessionId: "guest_session_id",
	},
	response: {
		id: "albumId",
		albumName: "albumName",
		settings: "settings",
		canUpload: "canUpload",
		images: "images",
	},
	image: {
		image_id: "imageId",
		image_path: "imagePath",
		original_width: "originalSize.width",
		original_height: "originalSize.height",
		status: "isPending",
	},
};

// Reserved share_tokens that back the public marketing demos. When no DB
// record exists we serve deterministic synthetic albums so the previews
// always render real data. Admins can override by seeding actual albums.
const DEMO_TOKENS = new Set(["demo", "demo-party", "demo-church"]);

export type AlbumPhase = "collecting" | "curating" | "delivered";

const derivePhase = (
	settings: { curating?: boolean; delivered?: boolean } | null | undefined,
	canUpload: boolean,
): AlbumPhase => {
	if (settings?.delivered) return "delivered";
	if (settings?.curating) return "curating";
	if (canUpload) return "collecting";
	return "delivered";
};

const buildDemoAlbum = () => {
	const cover = (url: string, width: number, height: number) => ({
		image_path: url,
		original_width: width,
		original_height: height,
	});
	const photos = [
		cover(
			"https://images.pexels.com/photos/31851041/pexels-photo-31851041.jpeg?auto=compress&cs=tinysrgb&w=1200",
			1200,
			800,
		),
		cover(
			"https://images.pexels.com/photos/31464056/pexels-photo-31464056.jpeg?auto=compress&cs=tinysrgb&w=1200",
			1200,
			800,
		),
		cover(
			"https://images.pexels.com/photos/29168547/pexels-photo-29168547.jpeg?auto=compress&cs=tinysrgb&w=1200",
			1200,
			800,
		),
		cover(
			"https://images.pexels.com/photos/6579100/pexels-photo-6579100.jpeg?auto=compress&cs=tinysrgb&w=1200",
			1200,
			800,
		),
		cover(
			"https://images.pexels.com/photos/7114417/pexels-photo-7114417.jpeg?auto=compress&cs=tinysrgb&w=1200",
			1200,
			800,
		),
		cover(
			"https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80",
			1200,
			800,
		),
	];
	const images = photos.map((p, idx) => ({
		image_id: `demo-img-${idx + 1}`,
		imageId: `demo-img-${idx + 1}`,
		imagePath: p.image_path,
		originalSize: { width: p.original_width, height: p.original_height },
		isPending: false,
		reactionCount: 3 + idx,
		faces: Array.from({ length: 2 + (idx % 3) }, (_, fi) => ({
			face_id: idx * 10 + fi + 1,
		})),
		status: "APPROVED",
		upload_date: new Date(Date.now() - idx * 86_400_000).toISOString(),
	}));
	return {
		id: "00000000-0000-0000-0000-000000000000",
		albumName: "Summer Wedding 2025",
		settings: {
			is_event: true,
			allow_guest_uploads: true,
			requires_approval: false,
			expires_at: null,
			curating: false,
			delivered: false,
			tagline: "Captured together, remembered forever.",
			theme_config: {
				preset: "wedding",
				accent: "#C8A97E",
				background: "light",
				backgroundTexture: "noise",
				font: "playfair",
				heroLayout: "centered",
				cornerRadius: "rounded",
				showStats: true,
				showSearch: true,
				sections: ["hero", "stats", "grid"],
				brandingHandle: "@lumina.otagera",
				brandingUrl: "https://lumina.otagera.xyz",
			},
			delivered: true,
		},
		canUpload: false,
		phase: "delivered" as AlbumPhase,
		stats: {
			guestCount: 12,
			recentMatches: 4,
			lastActivityAt: new Date().toISOString(),
		},
		images,
	};
};

const buildPartyDemoAlbum = () => {
	const cover = (url: string) => ({ image_path: url, original_width: 1200, original_height: 800 });
	const photos = [
		cover("https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1200"),
		cover("https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=1200"),
		cover("https://images.pexels.com/photos/1543793/pexels-photo-1543793.jpeg?auto=compress&cs=tinysrgb&w=1200"),
		cover("https://images.pexels.com/photos/787961/pexels-photo-787961.jpeg?auto=compress&cs=tinysrgb&w=1200"),
		cover("https://images.pexels.com/photos/3771900/pexels-photo-3771900.jpeg?auto=compress&cs=tinysrgb&w=1200"),
		cover("https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=1200"),
	];
	const images = photos.map((p, idx) => ({
		image_id: `demo-party-img-${idx + 1}`,
		imageId: `demo-party-img-${idx + 1}`,
		imagePath: p.image_path,
		originalSize: { width: p.original_width, height: p.original_height },
		isPending: false,
		reactionCount: 5 + idx * 2,
		faces: Array.from({ length: 3 + (idx % 4) }, (_, fi) => ({ face_id: idx * 10 + fi + 1 })),
		status: "APPROVED",
		upload_date: new Date(Date.now() - idx * 43_200_000).toISOString(),
	}));
	return {
		id: "00000000-0000-0000-0000-000000000001",
		albumName: "Musa's Birthday Bash 🎉",
		settings: {
			is_event: true,
			allow_guest_uploads: true,
			requires_approval: false,
			expires_at: null,
			curating: false,
			delivered: false,
			tagline: "Blurry memories, crisp photos.",
			theme_config: {
				preset: "dark-luxe",
				accent: "#7C3AED",
				background: "dark",
				backgroundTexture: "none",
				font: "dm-sans",
				heroLayout: "centered",
				cornerRadius: "rounded",
				showStats: true,
				showSearch: true,
				sections: ["hero", "stats", "grid"],
				brandingHandle: "@lumina.otagera",
				brandingUrl: "https://lumina.otagera.xyz",
			},
		},
		canUpload: true,
		phase: "collecting" as AlbumPhase,
		stats: {
			guestCount: 18,
			recentMatches: 7,
			lastActivityAt: new Date().toISOString(),
		},
		images,
	};
};

const buildChurchDemoAlbum = () => {
	const cover = (url: string) => ({ image_path: url, original_width: 1200, original_height: 800 });
	const photos = [
		cover("https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=1200"),
		cover("https://images.pexels.com/photos/8468470/pexels-photo-8468470.jpeg?auto=compress&cs=tinysrgb&w=1200"),
		cover("https://images.pexels.com/photos/1595385/pexels-photo-1595385.jpeg?auto=compress&cs=tinysrgb&w=1200"),
		cover("https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg?auto=compress&cs=tinysrgb&w=1200"),
		cover("https://images.pexels.com/photos/8468673/pexels-photo-8468673.jpeg?auto=compress&cs=tinysrgb&w=1200"),
		cover("https://images.pexels.com/photos/7214166/pexels-photo-7214166.jpeg?auto=compress&cs=tinysrgb&w=1200"),
	];
	const images = photos.map((p, idx) => ({
		image_id: `demo-church-img-${idx + 1}`,
		imageId: `demo-church-img-${idx + 1}`,
		imagePath: p.image_path,
		originalSize: { width: p.original_width, height: p.original_height },
		isPending: false,
		reactionCount: 2 + idx,
		faces: Array.from({ length: 4 + (idx % 5) }, (_, fi) => ({ face_id: idx * 10 + fi + 1 })),
		status: "APPROVED",
		upload_date: new Date(Date.now() - idx * 86_400_000 * 7).toISOString(),
	}));
	return {
		id: "00000000-0000-0000-0000-000000000002",
		albumName: "Grace Community Church · June 2026",
		settings: {
			is_event: true,
			allow_guest_uploads: true,
			requires_approval: false,
			expires_at: null,
			curating: false,
			delivered: false,
			tagline: "Every service, beautifully remembered.",
			theme_config: {
				preset: "minimal",
				accent: "#1d4ed8",
				background: "light",
				backgroundTexture: "none",
				font: "inter",
				heroLayout: "centered",
				cornerRadius: "rounded",
				showStats: true,
				showSearch: true,
				sections: ["hero", "stats", "grid"],
				brandingHandle: "@lumina.otagera",
				brandingUrl: "https://lumina.otagera.xyz",
			},
		},
		canUpload: true,
		phase: "collecting" as AlbumPhase,
		stats: {
			guestCount: 34,
			recentMatches: 12,
			lastActivityAt: new Date().toISOString(),
		},
		images,
	};
};

const service = async (data: any) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	// Build image filter
	const imageFilter: any = { deleted_at: null };

	if (params.status) {
		imageFilter.status = params.status;
	} else {
		imageFilter.OR = [
			{ status: "APPROVED" },
			{ guest_session_id: params.guest_session_id },
		];
	}

	if (params.uploaderId) imageFilter.uploaded_by = params.uploaderId;

	if (params.startDate || params.endDate) {
		imageFilter.upload_date = {};
		if (params.startDate)
			imageFilter.upload_date.gte = new Date(params.startDate);
		if (params.endDate) imageFilter.upload_date.lte = new Date(params.endDate);
	}

	if (params.minFaces !== undefined) {
		imageFilter.faces = {
			_count: { gte: Number.parseInt(String(params.minFaces), 10) },
		};
	}

	// Cache key combines token + a stable hash of filter params. Guest session
	// id is intentionally excluded from the hash since PENDING-status filtering
	// is only relevant when status is unspecified; sessions sharing the same
	// filter set see identical APPROVED data. When status is unspecified, we
	// skip caching to avoid leaking another guest's PENDING uploads.
	const isPersonalView =
		!params.status && Boolean(params.guest_session_id);
	const filterHash = hashCacheParams({
		status: params.status,
		startDate: params.startDate,
		endDate: params.endDate,
		uploaderId: params.uploaderId,
		minFaces: params.minFaces,
	});
	const cacheKey = cacheKeys.publicAlbum(params.share_token, filterHash);

	const fetchAlbum = async () => {
		const album = await prisma.albums.findUnique({
			where: { share_token: params.share_token },
			include: {
				album_images: {
					include: {
						images: {
							include: {
								faces: true,
								reactions: { select: { id: true } },
							},
						},
					},
					where: { images: imageFilter },
					orderBy: [
						{ position: "asc" },
						{ images: { upload_date: "desc" } },
					],
				},
				settings: true,
			},
		});

		if (!album) {
			if (params.share_token === "demo") return buildDemoAlbum();
			if (params.share_token === "demo-party") return buildPartyDemoAlbum();
			if (params.share_token === "demo-church") return buildChurchDemoAlbum();
			throw new NotFoundError("Album not found or link expired.");
		}

		const isCollaborative =
			album.settings?.is_event && album.settings?.allow_guest_uploads;
		const canUpload =
			isCollaborative &&
			(!album.settings?.expires_at ||
				new Date(album.settings.expires_at) > new Date());

		const rawImages = album.album_images
			.map((ai) => ai.images)
			.filter((img): img is any => img !== null);

		const images = rawImages.map((img) => ({
			...img,
			imageId: img.image_id,
			imagePath: normalizeImagePath(
				img.image_path,
				img.storage_provider,
				img.storage_key,
			),
			originalSize: {
				width: img.original_width,
				height: img.original_height,
			},
			isPending: img.status === "PENDING",
			reactionCount: img.reactions.length,
		}));

		const guestCount = new Set(
			rawImages
				.filter((img) => img.guest_session_id)
				.map((img) => img.guest_session_id),
		).size;
		const recentMatches = rawImages.filter(
			(img) => img.reactions.length > 0,
		).length;
		const lastActivityAt = rawImages.reduce(
			(max: Date | null, img) => {
				if (!img.upload_date) return max;
				const d = new Date(img.upload_date);
				return !max || d > max ? d : max;
			},
			null as Date | null,
		);

		const phase = derivePhase(album.settings, canUpload);

		return {
			id: album.album_id,
			albumName: album.album_name,
			settings: album.settings,
			canUpload,
			phase,
			stats: {
				guestCount,
				recentMatches,
				lastActivityAt: lastActivityAt?.toISOString() ?? null,
			},
			images,
		};
	};

	const result = isPersonalView
		? await fetchAlbum()
		: await cacheGetOrSet(cacheKey, CACHE_TTL.SHORT, fetchAlbum);

	// Fire-and-forget view tracking — skip demo tokens and filtered views
	if (!DEMO_TOKENS.has(params.share_token) && !params.status && !params.uploaderId) {
		const albumId = (result as any)?.id;
		if (albumId) {
			prisma.album_views
				.create({
					data: {
						album_id: albumId,
						session_hash: params.guest_session_id ?? null,
						view_type: "page_view",
					},
				})
				.catch(() => {});
		}
	}

	return result;
};

export const getSharedAlbumService = service;
