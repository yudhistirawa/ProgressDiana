"use client";
import React from "react";
import BasePagination from "@/components/ui/pagination";

export type PaginationProps = React.ComponentProps<typeof BasePagination>;

export default function Pagination(props: PaginationProps) {
  return <BasePagination {...props} />;
}

