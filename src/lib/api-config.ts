const DEFAULT_API_BASE = "https://voxflow-ai-site.onrender.com";

const configuredApiBase = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

export const API_BASE = configuredApiBase || DEFAULT_API_BASE;

export const API_BASE_CANDIDATES = configuredApiBase
	? [configuredApiBase]
	: [DEFAULT_API_BASE];
