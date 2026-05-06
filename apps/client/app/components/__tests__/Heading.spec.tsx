import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Heading } from "../standard/Heading";

describe("Heading Component", () => {
	it("renders with default level 2", () => {
		render(<Heading>Heading Text</Heading>);
		const heading = screen.getByRole("heading", { name: /heading text/i });
		expect(heading.tagName).toBe("H2");
	});

	it("renders level 1 heading", () => {
		render(<Heading level={1}>Level 1</Heading>);
		const heading = screen.getByRole("heading", { name: /level 1/i });
		expect(heading.tagName).toBe("H1");
	});

	it("renders level 2 heading", () => {
		render(<Heading level={2}>Level 2</Heading>);
		const heading = screen.getByRole("heading", { name: /level 2/i });
		expect(heading.tagName).toBe("H2");
	});

	it("renders level 3 heading", () => {
		render(<Heading level={3}>Level 3</Heading>);
		const heading = screen.getByRole("heading", { name: /level 3/i });
		expect(heading.tagName).toBe("H3");
	});

	it("renders level 4 heading", () => {
		render(<Heading level={4}>Level 4</Heading>);
		const heading = screen.getByRole("heading", { name: /level 4/i });
		expect(heading.tagName).toBe("H4");
	});

	it("applies custom className", () => {
		render(<Heading className="custom-heading">Custom</Heading>);
		const heading = screen.getByRole("heading", { name: /custom/i });
		expect(heading).toHaveClass("custom-heading");
	});
});