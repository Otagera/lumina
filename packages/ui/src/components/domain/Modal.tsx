import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";

export interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
	title?: string;
	description?: string;
	size?: "sm" | "md" | "lg" | "xl" | "full";
	className?: string;
}

const sizeClasses = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
	xl: "max-w-xl",
	full: "max-w-4xl",
};

export const Modal = ({
	isOpen,
	onClose,
	children,
	title,
	description,
	size = "md",
	className = "",
}: ModalProps) => {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className={cn(sizeClasses[size], className)}>
				{(title || description) && (
					<DialogHeader>
						{title && <DialogTitle>{title}</DialogTitle>}
						{description && (
							<DialogDescription>{description}</DialogDescription>
						)}
					</DialogHeader>
				)}
				{children}
			</DialogContent>
		</Dialog>
	);
};

export interface ModalSectionProps {
	children: ReactNode;
	className?: string;
}

export const ModalSection = ({
	children,
	className = "",
}: ModalSectionProps) => {
	return <div className={cn("space-y-4", className)}>{children}</div>;
};
