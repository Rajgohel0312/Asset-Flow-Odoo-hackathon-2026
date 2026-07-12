export const getPagination = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 10, 100);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

export default getPagination;
