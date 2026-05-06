import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "../standard/Checkbox";

describe("Checkbox Component", () => {
	it("renders unchecked by default", () => {
		render(<Checkbox />);
		const checkbox = screen.getByRole("checkbox");
		expect(checkbox).not.toBeChecked();
	});

	it("renders checked when defaultChecked is true", () => {
		render(<Checkbox defaultChecked />);
		const checkbox = screen.getByRole("checkbox");
		expect(checkbox).toBeChecked();
	});

	it("renders with label", () => {
		render(<Checkbox label="Accept terms" />);
		expect(screen.getByText("Accept terms")).toBeInTheDocument();
	});

	it("handles onChange events", () => {
		const handleChange = vi.fn();
		render(<Checkbox onChange={handleChange} />);
		fireEvent.click(screen.getByRole("checkbox"));
		expect(handleChange).toHaveBeenCalled();
	});

	it("can be disabled", () => {
		render(<Checkbox disabled />);
		expect(screen.getByRole("checkbox")).toBeDisabled();
	});

	it("applies custom className", () => {
		render(<Checkbox className="custom-checkbox" />);
		expect(screen.getByRole("checkbox")).toHaveClass("custom-checkbox");
	});
});