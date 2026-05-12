import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "../standard/EmptyState";

describe("EmptyState Component", () => {
	it("renders title", () => {
		render(<EmptyState title="No items found" />);
		expect(screen.getByText("No items found")).toBeInTheDocument();
	});

	it("renders description when provided", () => {
		render(
			<EmptyState title="No items" description="Try adjusting your filters" />,
		);
		expect(screen.getByText("Try adjusting your filters")).toBeInTheDocument();
	});

	it("renders custom icon when provided", () => {
		const CustomIcon = () => <span data-testid="custom-icon">Icon</span>;
		render(<EmptyState title="Empty" icon={<CustomIcon />} />);
		expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
	});

	it("renders action button when provided", () => {
		const ActionButton = () => <button>Add Item</button>;
		render(<EmptyState title="Empty" action={<ActionButton />} />);
		expect(
			screen.getByRole("button", { name: /add item/i }),
		).toBeInTheDocument();
	});

	it("applies custom className", () => {
		render(<EmptyState title="Empty" className="custom-empty" />);
		const container = screen.getByText("Empty").parentElement;
		expect(container).toHaveClass("custom-empty");
	});

	it("has dashed border styling", () => {
		render(<EmptyState title="Empty" />);
		const container = screen.getByText("Empty").parentElement;
		expect(container).toHaveClass("border-dashed");
	});
});
