"use client";

import { propertiesQueryOptions } from "@/lib/queries";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Skeleton } from "./ui/skeleton";
import { Fragment } from "react";
import { Button } from "./ui/button";

function SkeletonPropertyTable() {
  const array = new Array(10).fill(0);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {array.map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="w-80 h-4" />
            </TableCell>
            <TableCell>
              <Skeleton className="w-80 h-4" />
            </TableCell>
            <TableCell>
              <Skeleton className="w-10 h-4" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function PropertyTable() {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery(propertiesQueryOptions);

  return status === "pending" ? (
    <SkeletonPropertyTable />
  ) : status === "error" ? (
    <p>Error: {error.message}</p>
  ) : (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="h-[360px] w-full overflow-x-auto overflow-y-auto border rounded-md">
        <Table className="w-full">
          <TableHeader className="bg-background shadow-sm">
            <TableRow>
              <TableHead className="min-w-80">ID</TableHead>
              <TableHead className="min-w-60">Name</TableHead>
              <TableHead className="min-w-10">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="overflow-y-auto h-[calc(100%-41px)]">
            {data.pages.map((group, i) => (
              <Fragment key={i}>
                {group.data.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>{property.id}</TableCell>
                    <TableCell>{property.name}</TableCell>
                    <TableCell>{property.type}</TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetching}
        className="mt-4"
      >
        {isFetchingNextPage
          ? "Loading more..."
          : hasNextPage
            ? "Load More"
            : "Nothing more to load"}
      </Button>
    </section>
  );
}
