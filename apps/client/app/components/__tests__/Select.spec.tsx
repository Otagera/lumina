import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Select } from "../standard/Select";

describe("Select Component", () => {
	const options = [
		{ value: "option1", label: "Option 1" },
		{ value: "option2", label: "Option 2" },
		{ value: "option3", label: "Option 3" },
	];

	it("renders without label", () => {
		render(<Select options={options} />);
		expect(screen.getByRole("combobox")).toBeInTheDocument();
	});

	it("renders with label", () => {
		render(<Select label="Choose option" options={options} />);
		expect(screen.getByText("Choose option")).toBeInTheDocument();
	});

	it("renders options correctly", () => {
		render(<Select options={options} />);
		expect(screen.getByText("Option 1")).toBeInTheDocument();
		expect(screen.getByText("Option 2")).toBeInTheDocument();
		expect(screen.getByText("Option 3")).toBeInTheDocument();
	});

	it("renders placeholder when provided", () => {
		render(<Select options={options} placeholder="Select an option" />);
		expect(screen.getByText("Select an option")).toBeInTheDocument();
	});

	it("renders error state with error message", () => {
		render(<Select options={options} error="Selection required" />);
		expect(screen.getByText("Selection required")).toBeInTheDocument();
	});

	it("handles onChange events", () => {
		const handleChange = vi.fn();
		render(<Select options={options} onChange={handleChange} />);
		fireEvent.change(screen.getByRole("combobox"), { target: { value: "option2" } });
		expect(handleChange).toHaveBeenCalled();
	});

	it("can be disabled", () => {
		render(<Select options={options} disabled />);
		expect(screen.getByRole("combobox")).toBeDisabled();
	});
});