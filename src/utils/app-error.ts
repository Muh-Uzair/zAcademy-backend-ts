class AppError extends Error {
  errorStatusCode: number;
  errorStatus: string;
  isOperationalError: boolean;

  constructor(errorMessage: string, errorStatusCode: number) {
    super(errorMessage);
    this.errorStatusCode = errorStatusCode;
    this.errorStatus = `${errorStatusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperationalError = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export { AppError };
