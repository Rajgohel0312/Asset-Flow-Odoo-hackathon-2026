export const getSearchQuery = (fields, search) => {
  if (!search || !fields || fields.length === 0) return {};
  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: "insensitive" },
    })),
  };
};
export default getSearchQuery;
