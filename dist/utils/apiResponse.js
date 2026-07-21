export function sendCreated(res, message, data) {
    return res.status(201).json({ success: true, message, data });
}
export function sendSuccess(res, message, data) {
    return res.status(200).json({ success: true, message, data });
}
export function sendOk(res, data) {
    return res.status(200).json(data);
}
export function sendPaginated(res, data, meta) {
    return res.status(200).json({ success: true, data, meta });
}
export function sendMessage(res, message) {
    return res.status(200).json({ success: true, message });
}
