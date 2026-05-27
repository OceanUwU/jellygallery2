import { Request } from "express";

const pageLimit = 80;
const maxPageLimit = 200;

export interface SearchQuery {
    tags: Array<number>,
    search?: string;
    limit: number;
    page: number
}

export function getSearchQuery(req: Request): SearchQuery | string {
    let query: SearchQuery = {
        tags: [],
        limit: pageLimit,
        page: 0,
    };
    if (typeof req.query.p == "string")
        query.page = Number.parseInt(req.query.p);
    if (Number.isNaN(query.page) || query.page < 0) return "invalid page number";
    if (typeof req.query.t == "string")
        query.tags = req.query.t.split('-').map(t => Number.parseInt(t));
    if (query.tags.some(t => Number.isNaN(t))) return "invalid tag supplied";
    query.tags = query.tags.filter((t, i) => query.tags.indexOf(t) === i);
    if (typeof req.query.q == "string" && req.query.q.length > 25) return "search query too long (max 25 chars)";
    if (typeof req.query.q == "string" && req.query.q.length > 0)
        query.search = req.query.q;
    if (typeof req.query.limit == "string") {
        let qLimit = Number.parseInt(req.query.limit);
        if (!Number.isNaN(qLimit))
            query.limit = Math.min(maxPageLimit, Math.max(qLimit, 1));
    }
    return query;
};