import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../standard/Button";

describe("Button Component", () => {
	it("renders with primary variant by default", () => {
		render(<Button>Click me</Button>);
		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toHaveClass("bg-sage");
	});

	it("renders with secondary variant", () => {
		render(<Button variant="secondary">Click me</Button>);
		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toHaveClass("bg-terracotta");
	});

	it("renders with ghost variant", () => {
		render(<Button variant="ghost">Click me</Button>);
		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toHaveClass("bg-transparent");
	});

	it("renders with danger variant", () => {
		render(<Button variant="danger">Click me</Button>);
		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toHaveClass("bg-plum");
	});

	it("renders with outline variant", () => {
		render(<Button variant="outline">Click me</Button>);
		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toHaveClass("border-zinc-200");
	});

	it("renders small size", () => {
		render(<Button size="sm">Click me</Button>);
		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toHaveClass("px-3");
	});

	it("renders medium size", () => {
		render(<Button size="md">Click me</Button>);
		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toHaveClass("px-5");
	});

	it("renders large size", () => {
		render(<Button size="lg">Click me</Button>);
		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toHaveClass("px-8");
	});

	it("handles click events", () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click me</Button>);
		fireEvent.click(screen.getByRole("button"));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("can be disabled", () => {
		render(<Button disabled>Click me</Button>);
		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toBeDisabled();
	});

	it("renders with custom className", () => {
		render(<Button className="custom-class">Click me</Button>);
		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toHaveClass("custom-class");
	});

	it("renders children correctly", () => {
		render(<Button>Button Text</Button>);
		expect(screen.getByText("Button Text")).toBeInTheDocument();
	});
});