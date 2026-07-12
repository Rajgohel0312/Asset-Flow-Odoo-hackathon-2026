import * as reportsService from './reports.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

const handleReportResponse = (req, res, data, filename = 'report') => {
  if (req.query.format === 'csv') {
    const csv = reportsService.convertToCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
    return res.status(200).send(csv);
  }
  return res.status(200).json(
    new ApiResponse(200, data, 'Report data retrieved successfully')
  );
};

export const getAssetsReport = asyncHandler(async (req, res, next) => {
  const data = await reportsService.getAssetReportData(req.query, req.user);
  return handleReportResponse(req, res, data, 'assets_report');
});

export const getMaintenanceReport = asyncHandler(async (req, res, next) => {
  const data = await reportsService.getMaintenanceReportData(req.user);
  return handleReportResponse(req, res, data, 'maintenance_report');
});

export const getDepartmentReport = asyncHandler(async (req, res, next) => {
  const data = await reportsService.getDepartmentReportData(req.user);
  return handleReportResponse(req, res, data, 'department_report');
});

export const getBookingsReport = asyncHandler(async (req, res, next) => {
  const data = await reportsService.getBookingsReportData(req.user);
  return handleReportResponse(req, res, data, 'bookings_report');
});

export const getAuditReport = asyncHandler(async (req, res, next) => {
  const data = await reportsService.getAuditReportData(req.user);
  return handleReportResponse(req, res, data, 'audits_report');
});

export const getUtilizationReport = asyncHandler(async (req, res, next) => {
  const data = await reportsService.getUtilizationReportData(req.user);
  return res.status(200).json(
    new ApiResponse(200, data, 'Utilization report data retrieved successfully')
  );
});

export const getIdleAssetsReport = asyncHandler(async (req, res, next) => {
  const data = await reportsService.getIdleAssetsReportData(req.user);
  return handleReportResponse(req, res, data, 'idle_assets_report');
});

export const getOverdueAssetsReport = asyncHandler(async (req, res, next) => {
  const data = await reportsService.getOverdueAssetsReportData(req.user);
  return handleReportResponse(req, res, data, 'overdue_assets_report');
});
