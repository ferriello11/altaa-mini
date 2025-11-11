export function parsePagination(q: any) {
  const page = Math.max(parseInt(q?.page ?? '1', 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(q?.pageSize ?? '10', 10) || 10, 1), 100);
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { page, pageSize, skip, take };
}
