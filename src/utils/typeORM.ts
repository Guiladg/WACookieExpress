export function safeVirtualColumnQuery(alias: string, query: string): string {
	return `SELECT CASE WHEN ${alias}.id IS NULL THEN NULL ELSE (${query}) END`;
}
