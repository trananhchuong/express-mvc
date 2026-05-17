export function paginate(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  return { page, limit, total, totalPages, offset: (page - 1) * limit };
}
