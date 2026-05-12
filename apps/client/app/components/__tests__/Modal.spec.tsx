import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal, ModalSection } from "../standard/Modal";

describe("Modal Component", () => {
	it("does not Render when isOpen is false", () => {
		render(
			<Modal isOpen={false} onClose={() => {}}>
				<div>Content</div>
			</Modal>,
		);
		expect(screen.queryByText("Content")).not.toBeInTheDocument();
	});

	it("renders when isOpen is true", () => {
		render(
			<Modal isOpen={true} onClose={() => {}}>
				<div>Content</div>
			</Modal>,
		);
		expect(screen.getByText("Content")).toBeInTheDocument();
	});

	it("renders with title", () => {
		render(
			<Modal isOpen={true} onClose={() => {}} title="Test Title">
				<div>Content</div>
			</Modal>,
		);
		expect(screen.getByText("Test Title")).toBeInTheDocument();
	});

	it("renders with description", () => {
		render(
			<Modal isOpen={true} onClose={() => {}} description="Test Description">
				<div>Content</div>
			</Modal>,
		);
		expect(screen.getByText("Test Description")).toBeInTheDocument();
	});

	it("calls onClose when close button is clicked", () => {
		const handleClose = vi.fn();
		render(
			<Modal isOpen={true} onClose={handleClose} title="Test">
				<div>Content</div>
			</Modal>,
		);
		fireEvent.click(screen.getByLabelText("Close modal"));
		expect(handleClose).toHaveBeenCalledTimes(1);
	});

	it("renders small size when size prop is sm", () => {
		render(
			<Modal isOpen={true} onClose={() => {}} size="sm">
				<div>Content</div>
			</Modal>,
		);
		expect(screen.getByText("Content")).toBeInTheDocument();
	});

	it("renders large size when size prop is lg", () => {
		render(
			<Modal isOpen={true} onClose={() => {}} size="lg">
				<div>Content</div>
			</Modal>,
		);
		expect(screen.getByText("Content")).toBeInTheDocument();
	});

	it("renders full size when size prop is full", () => {
		render(
			<Modal isOpen={true} onClose={() => {}} size="full">
				<div>Content</div>
			</Modal>,
		);
		expect(screen.getByText("Content")).toBeInTheDocument();
	});
});

describe("ModalSection Component", () => {
	it("renders children correctly", () => {
		render(
			<ModalSection>
				<div>Section Content</div>
			</ModalSection>,
		);
		expect(screen.getByText("Section Content")).toBeInTheDocument();
	});
});
