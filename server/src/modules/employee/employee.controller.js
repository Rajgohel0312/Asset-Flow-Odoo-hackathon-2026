import * as employeeService from "./employee.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { toUserDTO, toUserListDTO } from "../../mappers/user.mapper.js";
export const getById = asyncHandler(async (req, res, next) => {
  const employee = await employeeService.getEmployeeById(req.params.id);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        toUserDTO(employee),
        "Employee details retrieved successfully",
      ),
    );
});
export const getAll = asyncHandler(async (req, res, next) => {
  const result = await employeeService.getAllEmployees(req.query);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const meta = {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  };
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        toUserListDTO(result.data),
        "Employees directory retrieved successfully",
        meta,
      ),
    );
});
export const update = asyncHandler(async (req, res, next) => {
  const employee = await employeeService.updateEmployee(
    req.params.id,
    req.body,
    req.user,
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        toUserDTO(employee),
        "Employee details updated successfully",
      ),
    );
});
export const promote = asyncHandler(async (req, res, next) => {
  const employee = await employeeService.promoteEmployee(
    req.params.id,
    req.body,
    req.user,
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        toUserDTO(employee),
        "Employee role updated successfully",
      ),
    );
});
export const toggleStatus = asyncHandler(async (req, res, next) => {
  const employee = await employeeService.updateStatus(
    req.params.id,
    req.body,
    req.user,
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        toUserDTO(employee),
        "Employee status updated successfully",
      ),
    );
});
