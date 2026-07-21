import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";
export const notFoundHandler = (req, _res, next) => {
    next(new AppError(`Route ${req.method} ${req.originalUrl} was not found`, 404, "ROUTE_NOT_FOUND"));
};
export const globalErrorHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: "Request validation failed",
            errorType: "VALIDATION_ERROR",
            details: error.flatten(),
        });
    }
    if (error instanceof AppError) {
        console.error(error.stack);
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            errorType: error.errorType,
            details: error.details,
        });
    }
    if (error?.name === "ValidationError") {
        console.error(error.stack);
        return res.status(400).json({
            success: false,
            message: "MongoDB document validation failed",
            errorType: "DATABASE_VALIDATION_ERROR",
            details: error.errors,
        });
    }
    if (error?.code === 11000) {
        console.error(error);
        return res.status(409).json({
            success: false,
            message: "A record with the same unique value already exists",
            errorType: "DUPLICATE_RECORD",
            details: error.keyValue,
        });
    }
    console.error(error);
    return res.status(500).json({
        success: false,
        message: "Unexpected server failure while processing the request",
        errorType: "UNEXPECTED_SERVER_ERROR",
    });
};
