/** Standardized response object for sending list data to client */
export interface ClientList {
	records: any[];
	totalRecords: number;
	page: number;
	pageSize: number;
	order: string;
}
/** Standardized response object for sending one record data to client */
export interface ClientRecord {
	record: any;
	message: string;
}
