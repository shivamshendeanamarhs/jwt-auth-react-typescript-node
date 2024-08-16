/**
 * Custom Error Class for Handling Application-Specific Errors
 *
 * This class extends the built-in Error class to create a custom error type
 * that includes additional information such as an HTTP status code and an
 * optional error code. This is useful for more descriptive error handling
 * in web applications, especially when dealing with HTTP responses.
 *
 * - `statusCode`: An HTTP status code representing the type of error (e.g., 400, 404).
 * - `message`: A descriptive error message.
 * - `errorCode`: An optional error code for additional context (e.g., 'USER_NOT_FOUND').
 *
 * Example usage:
 * const error = new AppError(404, 'Resource not found', 'RESOURCE_NOT_FOUND');
 *
 * Exported as the default export of the module.
 */

import AppErrorCode from "../constants/appErrorCode";
import { HttpStatusCode } from "../constants/http";

class AppError extends Error {
    constructor(
        public statusCode: HttpStatusCode,
        public message: string,
        public errorCode?: AppErrorCode,
    ) {
        super(message);
      }
}

new AppError (
    200,
    'msg',
    AppErrorCode.InvalidAccessToken
)

export default AppError;