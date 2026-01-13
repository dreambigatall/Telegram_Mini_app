import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  total?: number;
  page?: number;
  totalPages?: number;
  errors?: Array<{ field: string; message: string }>;
}

export class ResponseHelper {
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data
    };
    return res.status(statusCode).json(response);
  }

  static successWithPagination<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message?: string
  ): Response {
    const response: ApiResponse<T[]> = {
      success: true,
      message,
      data,
      count: data.length,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
    return res.status(200).json(response);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 400,
    errors?: Array<{ field: string; message: string }>
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      errors
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    data: T,
    message?: string
  ): Response {
    return this.success(res, data, message, 201);
  }
}

