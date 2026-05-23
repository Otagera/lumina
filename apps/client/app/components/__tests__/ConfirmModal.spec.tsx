import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmModal } from "../ConfirmModal";

describe("ConfirmModal Component", () => {
	const defaultProps = {
		isOpen: true,
		title: "Delete Item",
		message: "Are you sure you want to delete this?",
		onConfirm: vi.fn(),
		onCancel: vi.fn(),
	};

	it("does not render when isOpen is false", () => {
		render(<ConfirmModal {...defaultProps} isOpen={false} />);
		expect(screen.queryByText("Delete Item")).not.toBeInTheDocument();
	});

	it("renders title, message, and default button text", () => {
		render(<ConfirmModal {...defaultProps} />);

		expect(screen.getByText("Delete Item")).toBeInTheDocument();
		expect(
			screen.getByText("Are you sure you want to delete this?"),
		).toBeInTheDocument();
		expect(screen.getByText("Confirm")).toBeInTheDocument();
		expect(screen.getByText("Cancel")).toBeInTheDocument();
	});

	it("calls onConfirm when confirm button is clicked", () => {
		const onConfirm = vi.fn();
		render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);

		fireEvent.click(screen.getByText("Confirm"));
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	it("calls onCancel when cancel button is clicked", () => {
		const onCancel = vi.fn();
		render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

		fireEvent.click(screen.getByText("Cancel"));
		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it("shows loading state and disables buttons", () => {
		render(
			<ConfirmModal
				{...defaultProps}
				isLoading={true}
				confirmText="Confirming..."
			/>,
		);

		expect(screen.getByText("Processing...")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /processing/i })).toBeDisabled();
		expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
	});

	it("applies destructive styling when isDestructive is true", () => {
		render(<ConfirmModal {...defaultProps} isDestructive={true} />);

		const confirmButton = screen.getByText("Confirm").closest("button");
		expect(confirmButton).toHaveClass("bg-red-600");
	});

	it("applies sage styling when isDestructive is false", () => {
		render(<ConfirmModal {...defaultProps} isDestructive={false} />);

		const confirmButton = screen.getByText("Confirm").closest("button");
		expect(confirmButton).toHaveClass("bg-sage");
	});
});
