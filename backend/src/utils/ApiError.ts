class ApiError extends Error {
  statusCode: number;
  data: null;
  success: false;
  errors: any[];

  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors: any[] = []
  ) {
    super(message);

    this.statusCode = statusCode;
    this.data = null;
    this.success = false;
    this.errors = errors;

    
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export { ApiError };
