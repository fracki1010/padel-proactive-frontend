import { useInfiniteQuery } from "@tanstack/react-query";

import { userService } from "../../../services/api";
import type { User } from "../../../types";

const CLIENT_SEARCH_PAGE_SIZE = 10;

/**
 * Server-side search + infinite scroll for the client picker (turnos fijos).
 * Each page hits GET /users?search=&page=&limit=10 and returns items shaped
 * exactly like the full list, so the drawer renders them identically.
 */
export const useClientSearch = (search: string) => {
  const query = useInfiniteQuery({
    queryKey: ["client-search", search],
    queryFn: ({ pageParam = 1 }) =>
      userService.searchUsers({
        search,
        page: pageParam,
        limit: CLIENT_SEARCH_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce(
        (count, page) => count + (page?.data?.length || 0),
        0,
      );
      return loaded < (lastPage?.total || 0) ? pages.length + 1 : undefined;
    },
  });

  const clients: User[] =
    query.data?.pages.flatMap((page) => page?.data ?? []) ?? [];

  const total = query.data?.pages[query.data.pages.length - 1]?.total ?? 0;

  return {
    clients,
    total,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
  };
};