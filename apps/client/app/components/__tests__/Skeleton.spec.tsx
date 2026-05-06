import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { 
	Skeleton, 
	SkeletonText, 
	SkeletonCard, 
	SkeletonImageGrid, 
	SkeletonButton, 
	SkeletonInput, 
	SkeletonAvatar 
} from "../standard/Skeleton";

describe("Skeleton Component", () => {
	it("renders base skeleton", () => {
		const { container } = render(<Skeleton />);
		expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
	});
});

describe("SkeletonText Component", () => {
	it("renders default number of lines", () => {
		const { container } = render(<SkeletonText />);
		const skeletons = container.querySelectorAll(".animate-pulse");
		expect(skeletons.length).toBe(3);
	});

	it("renders custom number of lines", () => {
		const { container } = render(<SkeletonText lines={5} />);
		const skeletons = container.querySelectorAll(".animate-pulse");
		expect(skeletons.length).toBe(5);
	});
});

describe("SkeletonCard Component", () => {
	it("renders skeleton card structure", () => {
		const { container } = render(<SkeletonCard />);
		expect(container.querySelector(".bg-white")).toBeInTheDocument();
	});
});

describe("SkeletonImageGrid Component", () => {
	it("renders default number of images", () => {
		const { container } = render(<SkeletonImageGrid />);
		const skeletons = container.querySelectorAll(".animate-pulse");
		expect(skeletons.length).toBe(8);
	});

	it("renders custom number of images", () => {
		const { container } = render(<SkeletonImageGrid count={4} />);
		const skeletons = container.querySelectorAll(".animate-pulse");
		expect(skeletons.length).toBe(4);
	});
});

describe("SkeletonButton Component", () => {
	it("renders button skeleton", () => {
		const { container } = render(<SkeletonButton />);
		const skeleton = container.querySelector(".animate-pulse");
		expect(skeleton).toHaveClass("h-10");
	});
});

describe("SkeletonInput Component", () => {
	it("renders input skeleton", () => {
		const { container } = render(<SkeletonInput />);
		const skeleton = container.querySelector(".animate-pulse");
		expect(skeleton).toHaveClass("h-10");
	});
});

describe("SkeletonAvatar Component", () => {
	it("renders default medium size", () => {
		const { container } = render(<SkeletonAvatar />);
		const avatar = container.querySelector(".animate-pulse");
		expect(avatar).toHaveClass("w-12", "h-12");
	});

	it("renders small size", () => {
		const { container } = render(<SkeletonAvatar size="sm" />);
		const avatar = container.querySelector(".animate-pulse");
		expect(avatar).toHaveClass("w-8", "h-8");
	});

	it("renders large size", () => {
		const { container } = render(<SkeletonAvatar size="lg" />);
		const avatar = container.querySelector(".animate-pulse");
		expect(avatar).toHaveClass("w-16", "h-16");
	});
});