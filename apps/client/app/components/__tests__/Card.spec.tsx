import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Card } from "../standard/Card";

describe("Card Component", () => {
	it("renders children correctly", () => {
		render(<Card>Card Content</Card>);
		expect(screen.getByText("Card Content")).toBeInTheDocument();
	});

	it("renders with default hoverable style", () => {
		render(<Card>Content</Card>);
		const card = screen.getByText("Content").closest("div");
		expect(card).toHaveClass("hover:-translate-y-1");
	});

	it("disables hover effect when hoverable is false", () => {
		render(<Card hoverable={false}>Content</Card>);
		const card = screen.getByText("Content").closest("div");
		expect(card).not.toHaveClass("hover:-translate-y-1");
	});

	it("handles click events", () => {
		const handleClick = vi.fn();
		render(<Card onClick={handleClick}>Content</Card>);
		fireEvent.click(screen.getByText("Content"));
		expect(handleClick).toHaveBeenCalled();
	});
});