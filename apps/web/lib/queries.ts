import { infiniteQueryOptions } from "@tanstack/react-query";
import z from "zod";
import { PropertyReturnSchema } from "@cw/schema";

export const propertiesQueryOptions = infiniteQueryOptions({
  queryKey: ["properties"],
  queryFn: async ({ pageParam }) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/property?cursor=${pageParam}`
    );
    const result: {
      data: z.infer<typeof PropertyReturnSchema>[];
      nextCursor: number;
    } = await res.json();
    return result;
  },
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
