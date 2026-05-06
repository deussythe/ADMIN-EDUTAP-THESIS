import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface AdminModalPortalProps {
	children: ReactNode;
}

export function AdminModalPortal({ children }: AdminModalPortalProps) {
	if (typeof document === "undefined") {
		return null;
	}

	return createPortal(children, document.body);
}
