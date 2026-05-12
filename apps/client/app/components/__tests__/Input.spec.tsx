import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Input } from "../standard/Input";

describe("Input Component", () => {
	it("renders without label", () => {
		render(<Input />);
		expect(screen.getByRole("textbox")).toBeInTheDocument();
	});

	it("renders with label", () => {
		render(<Input label="Email" />);
		expect(screen.getByText("Email")).toBeInTheDocument();
	});

	it("renders with placeholder", () => {
		render(<Input placeholder="Enter text" />);
		expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
	});

	it("renders with hint text", () => {
		render(<Input hint="This is a hint" />);
		expect(screen.getByText("This is a hint")).toBeInTheDocument();
	});

	it("renders error state with error message", () => {
		render(<Input error="This field is required" />);
		expect(screen.getByText("This field is required")).toBeInTheDocument();
	});

	it("applies error styling to input", () => {
		render(<Input error="Error message" />);
		const input = screen.getByRole("textbox");
		expect(input).toHaveClass("border-plum");
	});

	it("handles onChange events", () => {
		const handleChange = vi.fn();
		render(<Input onChange={handleChange} />);
		fireEvent.change(screen.getByRole("textbox"), {
			target: { value: "test" },
		});
		expect(handleChange).toHaveBeenCalled();
	});

	it("can be disabled", () => {
		render(<Input disabled />);
		expect(screen.getByRole("textbox")).toBeDisabled();
	});

	it("applies custom className", () => {
		render(<Input className="custom-input" />);
		expect(screen.getByRole("textbox")).toHaveClass("custom-input");
	});

	it("handles default value", () => {
		render(<Input defaultValue="default text" />);
		expect(screen.getByRole("textbox")).toHaveValue("default text");
	});
});
