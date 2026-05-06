import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import AlbumCard from "../AlbumCard";

const mockAlbum = {
	id: "album-1",
	albumName: "Test Album",
	images: [
		{ id: "img-1", url: "https://example.com/1.jpg" },
		{ id: "img-2", url: "https://example.com/2.jpg" },
		{ id: "img-3", url: "https://example.com/3.jpg" },
		{ id: "img-4", url: "https://example.com/4.jpg" },
	],
	_count: { images: 4 },
} as any;

describe("AlbumCard Component", () => {
	it("renders album name and photo count", () => {
		render(
			<BrowserRouter>
				<AlbumCard album={mockAlbum} />
			</BrowserRouter>
		);
		expect(screen.getByText("Test Album")).toBeInTheDocument();
		expect(screen.getByText("4 photos")).toBeInTheDocument();
	});

	it("renders 4 cover images when available", () => {
		render(
			<BrowserRouter>
				<AlbumCard album={mockAlbum} />
			</BrowserRouter>
		);
		expect(screen.getByText("Test Album")).toBeInTheDocument();
	});

	it("renders a single cover image when fewer than 4 are available", () => {
		const singleImageAlbum = {
			...mockAlbum,
			images: [{ id: "img-1", url: "https://example.com/1.jpg" }],
			_count: { images: 1 },
		} as any;
		render(
			<BrowserRouter>
				<AlbumCard album={singleImageAlbum} />
			</BrowserRouter>
		);
		expect(screen.getByText("1 photos")).toBeInTheDocument();
	});

	it("renders fallback stylized text when no cover images exist", () => {
		const emptyAlbum = {
			id: "album-empty",
			albumName: "Empty Album",
			images: [],
			_count: { images: 0 },
		} as any;
		render(
			<BrowserRouter>
				<AlbumCard album={emptyAlbum} />
			</BrowserRouter>
		);
		expect(screen.getByText("Empty Album")).toBeInTheDocument();
		expect(screen.getByText("0 photos")).toBeInTheDocument();
	});

	it("navigates to the album page on click", () => {
		render(
			<BrowserRouter>
				<AlbumCard album={mockAlbum} />
			</BrowserRouter>
		);
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/album/album-1");
	});

	it("opens the menu and triggers onEdit/onDelete", () => {
		const handleEdit = vi.fn();
		const handleDelete = vi.fn();
		render(
			<BrowserRouter>
				<AlbumCard album={mockAlbum} onEdit={handleEdit} onDelete={handleDelete} />
			</BrowserRouter>
		);
		const menuButton = screen.getByRole("button");
		fireEvent.click(menuButton);
		expect(screen.getByText("Edit")).toBeInTheDocument();
		expect(screen.getByText("Delete")).toBeInTheDocument();
	});
});