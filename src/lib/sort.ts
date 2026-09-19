export function sortProjects<T extends { data: { order?: number; date: Date } }>(items: T[]): T[] {
  // order 가 있는 항목 먼저(오름차순), 나머지는 date 최신순
  return items.slice().sort((a, b) => {
    const ao = a.data.order, bo = b.data.order;
    if (ao !== undefined && bo !== undefined) return ao - bo;
    if (ao !== undefined) return -1;
    if (bo !== undefined) return 1;
    return b.data.date.getTime() - a.data.date.getTime();
  });
}

export function sortAlbums<T extends { data: { order?: number; date?: Date; title: string } }>(items: T[]): T[] {
  // order 우선, 그 다음 date 최신순, 마지막으로 제목
  return items.slice().sort((a, b) => {
    const ao = a.data.order, bo = b.data.order;
    if (ao !== undefined && bo !== undefined) return ao - bo;
    if (ao !== undefined) return -1;
    if (bo !== undefined) return 1;
    const ad = a.data.date?.getTime() ?? 0, bd = b.data.date?.getTime() ?? 0;
    if (ad !== bd) return bd - ad;
    return a.data.title.localeCompare(b.data.title);
  });
}
