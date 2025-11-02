"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

export function Providers({ children }: PropsWithChildren) {
	return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}
