import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../utils/api", () => ({
	fetchSharedAlbum: vi.fn(),
	searchFaces: vi.fn(),
}));

vi.mock("../../utils/UploadContext", () => ({
	useUpload: () => ({ addUploads: vi.fn(), tasks: [] }),
}));

vi.mock("../../components/BulkActionBar", () => ({
	BulkActionBar: () => null,
}));

vi.mock("../../Images/ImageGridItem", () => ({
	default: () => <div data-testid="image-grid-item" />,
}));

vi.mock("../../Images/ImageModal", () => ({
	default: () => null,
}));

vi.mock("../../components/SelfieSearchModal", () => ({
	SelfieSearchModal: () => null,
}));

import SharedAlbumPage from "../../routes/sharedAlbum";
import { fetchSharedAlbum } from "../../utils/api";

const buildAlbum = (canUpload = true) => ({
	data: {
		id: "album-1",
		albumName: "Maya & Jordan Wedding",
		canUpload,
		settings: { requires_approval: false },
		images: [
			{
				imageId: "img-1",
				imagePath: "https://example.com/1.jpg",
				originalSize: { width: 800, height: 800 },
				faces: [],
			},
			{
				imageId: "img-2",
				imagePath: "https://example.com/2.jpg",
				originalSize: { width: 800, height: 800 },
				faces: [],
			},
		],
	},
});

const renderHero = (canUpload = true) => {
	(fetchSharedAlbum as any).mockResolvedValue(buildAlbum(canUpload));
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<QueryClientProvider client={client}>
			<MemoryRouter initialEntries={["/share/demo"]}>
				<Routes>
					<Route path="/share/:token" element={<SharedAlbumPage />} />
				</Routes>
			</MemoryRouter>
		</QueryClientProvider>,
	);
};

describe("SharedAlbumPage hero", () => {
	it("renders the album title once data resolves", async () => {
		renderHero();
		await waitFor(() => {
			expect(screen.getByText("Maya & Jordan Wedding")).toBeInTheDocument();
		});
	});

	it("shows the Find My Face CTA", async () => {
		renderHero();
		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: /Find My Face/i }),
			).toBeInTheDocument();
		});
	});

	it("shows the Contribute CTA when the album allows uploads", async () => {
		renderHero(true);
		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: /Contribute/i }),
			).toBeInTheDocument();
		});
	});

	it("hides the Contribute CTA when uploads are disabled", async () => {
		renderHero(false);
		await waitFor(() => {
			expect(screen.getByText("Maya & Jordan Wedding")).toBeInTheDocument();
		});
		expect(
			screen.queryByRole("button", { name: /Contribute/i }),
		).not.toBeInTheDocument();
	});

	it("renders the photo count summary", async () => {
		renderHero();
		await waitFor(() => {
			expect(
				screen.getByText(/2 photos · organized by the owner for you/i),
			).toBeInTheDocument();
		});
	});
});
