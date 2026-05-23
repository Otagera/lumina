import type { HTMLAttributes } from "react";

// ============== Base Types ==============

export interface CanvasBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface BoundingBox {
	bottom: number;
	left: number;
	right: number;
	top: number;
}

export interface ImageSize {
	width: number;
	height: number;
}

// ============== Face & Person Types ==============

export interface Face {
	face_id: number;
	bounding_box: BoundingBox;
	person_id?: string | null;
	personName?: string | null;
	det_score?: number;
}

export interface Person {
	personId: string;
	name: string;
	createdAt: string;
	faceUrl?: string;
	boundingBox?: BoundingBox;
}

export interface SearchResultFace {
	faceId: number;
	imageId: string;
	imagePath: string;
	originalWidth?: number;
	originalHeight?: number;
	boundingBox?: BoundingBox;
	distance?: number;
	personId?: string | null;
	personName?: string | null;
	isConfirmed?: boolean;
	isIgnored?: boolean;
	hidden?: boolean;
}

export interface SearchSourceFace {
	faceId: number;
	personId: string | null;
	personName?: string;
	imagePath?: string;
	boundingBox?: BoundingBox;
	originalWidth?: number;
	originalHeight?: number;
}

// ============== Image Types ==============

export interface ImageFromDB {
	faces?: Face[];
	imageId: string;
	imagePath: string;
	originalSize?: { width: number; height: number };
	uploadDate?: string;
	status?: "PENDING" | "APPROVED" | "REJECTED";
	original?: string;
}

export interface UploadImagesProps {
	sendToParent: {
		imageUrl: (data: string) => void;
		imageSize: (imageSize: ImageSize) => void;
		boundingBox: (boundingBox: BoundingBox[]) => void;
	};
}

// ============== Album Types ==============

export interface AlbumSettings {
	is_event?: boolean;
	requires_approval?: boolean;
	tagging_policy?: "HOST_ONLY" | "GUESTS_SELF" | "ANYONE";
	expires_at?: string | null;
	allow_guest_uploads?: boolean;
	semantic_search_enabled?: boolean;
}

// API response uses different field names
export interface Album {
	id: string;
	albumId?: string;
	albumName: string;
	userId?: string;
	createdAt?: string;
	creation_date?: string;
	settings?: AlbumSettings;
	storageConfigId?: string | null;
	shareToken?: string | null;
	sharedLink?: string;
	coverImage?: { id: string | null; url: string | null } | string | null;
	coverImages?: string[];
	imageCount?: number;
	images?: number;
	_count?: {
		images?: number;
	};
	members?: Array<{ userId: string; email: string; role: string }>;
	qrColor?: string;
	qrLogoUrl?: string;
	cover_image?: { imagePath: string };
}

export type AlbumListItem = Pick<
	Album,
	"id" | "albumName" | "coverImages" | "createdAt" | "imageCount" | "settings"
>;

export interface StorageConfig {
	id: string;
	name: string;
	provider: string;
	bucket: string;
	endpoint?: string;
	region?: string;
	isActive?: boolean;
	createdAt?: string;
}

// ============== API Response Types ==============

export interface ApiError {
	message: string;
	statusCode?: number;
}

export interface ApiResponse<T> {
	status: "completed" | "error";
	message?: string;
	data: T;
}

export interface PaginationMeta {
	nextCursor?: string | null;
	prevCursor?: string | null;
	total?: number;
	page?: number;
	pageSize?: number;
}

// ============== Usage Types ==============

export interface UsageStats {
	computeUnitsUsed: number;
	computeUnitsLimit: number;
	storageUsedMB: number;
	storageLimitMB: number;
	resetDate?: string;
	plan?: "free" | "pro" | "business";
}

// ============== Album Image Types ==============

export interface AlbumImage {
	imageId: string;
	imagePath: string;
	originalSize?: { width: number; height: number };
	takenAt?: string | null;
	uploadDate?: string;
	status?: "PENDING" | "APPROVED" | "REJECTED";
	faces?: Face[];
	reactionCount?: number;
	isPending?: boolean;
}

export interface SharedAlbum {
	id: string;
	albumName: string;
	settings?: AlbumSettings;
	images: AlbumImage[];
	canUpload?: boolean;
	coverImage?: { id: string | null; url: string | null } | string | null;
}

export interface ImagesInAlbum {
	images: AlbumImage;
	imageId: string;
}

export interface ImagesInAlbumResponse {
	imagesInAlbum: ImagesInAlbum[];
	pagination: PaginationMeta;
}

export interface AlbumImageFilters {
	startDate?: string;
	endDate?: string;
	uploaderId?: string;
}

export type ImageStatus = "APPROVED" | "PENDING" | "REJECTED";

// ============== UI State Types ==============

export type ViewMode = "gallery" | "moderation" | "duplicates";
export type DisplayMode = "grid" | "list";

export interface UIState {
	modals: {
		upload: boolean;
		share: boolean;
		settings: boolean;
		permissions: boolean;
		deleteAlbum: boolean;
		addToAlbum: boolean;
	};
	selection: Set<string>;
	view: ViewMode;
	viewMode: DisplayMode;
	isEditingName: boolean;
	isBatchProcessing: boolean;
	rejectModal: {
		isOpen: boolean;
		imageIds: string[];
	};
}
