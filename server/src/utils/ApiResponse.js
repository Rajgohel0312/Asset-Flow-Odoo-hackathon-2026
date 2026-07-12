export class ApiResponse {
  constructor(statusCode, data, message = 'Success', meta = {}) {
    this.statusCode = statusCode;
    this.success = true;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }
}

export default ApiResponse;
