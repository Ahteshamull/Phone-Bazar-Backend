export function normalizeListQuery(query) {
    return {
        page: Math.max(1, query.page ?? 1),
        limit: Math.min(1000, Math.max(1, query.limit ?? 1000)),
        search: query.search?.trim() ?? "",
    };
}
export async function findPaginated(model, filter, sort, query) {
    const { page, limit } = normalizeListQuery(query);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        model.find(filter).sort(sort).skip(skip).limit(limit).lean({ virtuals: true }),
        model.countDocuments(filter),
    ]);
    return {
        data,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    };
}
