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
	title?: ReactNode;
	description?: ReactNode;
	size?: "sm" | "md" | "lg" | "xl" | "full";
	className?: string;
	contentClassName?: string;
	showCloseButton?: boolean;
	closeOnBackdrop?: boolean;
	padding?: boolean;
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
	contentClassName = "",
	showCloseButton = true,
	closeOnBackdrop = true,
	padding = true,
}: ModalProps) => {
	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => !open && closeOnBackdrop && onClose()}
		>
			<DialogContent
				showCloseButton={showCloseButton}
				onPointerDownOutside={(e) => {
					if (!closeOnBackdrop) e.preventDefault();
				}}
				onEscapeKeyDown={(e) => {
					if (!closeOnBackdrop) e.preventDefault();
				}}
				className={cn(
					sizeClasses[size],
					!padding && "p-0 gap-0",
					className,
				)}
			>
				{(title || description) && (
					<DialogHeader className={cn(!padding && "p-6 md:p-8 pb-0")}>
						{title && <DialogTitle>{title}</DialogTitle>}
						{description && (
							<DialogDescription>{description}</DialogDescription>
						)}
					</DialogHeader>
				)}
				<div className={cn(contentClassName)}>{children}</div>
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
