export const sendSuccess = (res, data = null, message = 'Success', status = 200, meta = {}) => {
  const requestId = res.req?.requestId;
  return res.status(status).json({
    success: true,
    message,
    data,
    meta: {
      ...meta,
      ...(requestId ? { requestId } : {}),
    },
  });
};

export const sendError = (res, message = 'An error occurred', errors = [], status = 500, meta = {}) => {
  const requestId = res.req?.requestId;
  return res.status(status).json({
    success: false,
    message,
    errors,
    meta: {
      ...meta,
      ...(requestId ? { requestId } : {}),
    },
  });
};
