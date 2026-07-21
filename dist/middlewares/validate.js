export function validate(schema) {
    return (req, _res, next) => {
        const parsed = schema.parse({
            body: req.body,
            params: req.params,
            query: req.query,
        });
        if ("body" in parsed)
            req.body = parsed.body;
        if ("params" in parsed)
            req.params = parsed.params;
        if ("query" in parsed)
            req.query = parsed.query;
        next();
    };
}
