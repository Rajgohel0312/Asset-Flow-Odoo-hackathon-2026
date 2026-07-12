export const getSortQuery = (query, defaultField = 'createdAt', defaultOrder = 'desc') => {
  const sort = query.sort || defaultField;
  const order = query.order === 'asc' ? 'asc' : defaultOrder;

  return {
    [sort]: order,
  };
};

export default getSortQuery;
