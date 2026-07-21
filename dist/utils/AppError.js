export class AppError extends Error {
    statusCode;
    errorType;
    details;
    constructor(message, statusCode = 500, errorType = "APPLICATION_ERROR", details) {
        super(message);
        this.statusCode = statusCode;
        this.errorType = errorType;
        this.details = details;
    }
}
