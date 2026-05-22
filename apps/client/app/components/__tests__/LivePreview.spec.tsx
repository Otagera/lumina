import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LivePreview from "../../welcome/LivePreview";

vi.mock("../../utils/api", () => ({
	fetchSharedAlbum: vi.fn(),
}));

import { fetchSharedAlbum } from "../../utils/api";

const buildAlbum = (facesPerImage: number[]) => ({
	data: {
		id: "demo-album",
		albumName: "Maya & Jordan",
		images: facesPerImage.map((faceCount, idx) => ({
			imageId: `img-${idx}`,
			imagePath: `https://example.com/p${idx}.jpg`,
			originalSize: { width: 800, height: 800 },
			faces: Array.from({ length: faceCount }, (_, fi) => ({
				faceId: idx * 10 + fi,
				bbox: { x: 0, y: 0, w: 50, h: 50 },
			})),
		})),
	},
});

const renderPreview = () => {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<QueryClientProvider client={client}>
			<BrowserRouter>
				<LivePreview demoToken="demo" />
			</BrowserRouter>
		</QueryClientProvider>,
	);
};

describe("LivePreview", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("counter target equals the sum of faces.length across images", async () => {
		(fetchSharedAlbum as any).mockResolvedValue(buildAlbum([2, 3, 4, 1]));

		renderPreview();

		await waitFor(() => {
			expect(screen.getByText("Maya & Jordan")).toBeInTheDocument();
		});

		await waitFor(
			() => {
				const tabular = document.querySelector(".tabular-nums");
				expect(tabular?.textContent).toBe("10");
			},
			{ timeout: 2500 },
		);
	});

	it("renders zero faces when album has no detected faces", async () => {
		(fetchSharedAlbum as any).mockResolvedValue(buildAlbum([0, 0, 0]));

		renderPreview();

		await waitFor(() => {
			expect(screen.getByText("Maya & Jordan")).toBeInTheDocument();
		});

		await waitFor(() => {
			const tabular = document.querySelector(".tabular-nums");
			expect(tabular?.textContent).toBe("0");
		});
	});

	it("renders the photo count and demo link", async () => {
		(fetchSharedAlbum as any).mockResolvedValue(buildAlbum([1, 1, 1]));

		renderPreview();

		await waitFor(() => {
			expect(screen.getByText("3 photos available")).toBeInTheDocument();
		});

		const link = screen.getByRole("link", { name: /Open the sample event/i });
		expect(link).toHaveAttribute("href", "/share/demo");
	});

	it("shows the loading skeleton placeholder before data resolves", () => {
		(fetchSharedAlbum as any).mockReturnValue(new Promise(() => {}));

		renderPreview();

		expect(screen.getByText(/See what your guests will experience/i)).toBeInTheDocument();
		expect(screen.getByText(/Open to browse photos/i)).toBeInTheDocument();
	});
});
