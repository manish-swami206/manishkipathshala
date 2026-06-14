"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import type { CurrentAffair } from "@/lib/api";

interface CurrentAffairsTableProps {
  data: CurrentAffair[];
  onDelete: (id: string) => void;
  onEdit: (item: CurrentAffair) => void;
  onView: (item: CurrentAffair) => void;
  isLoading?: boolean;
}

export function CurrentAffairsTable({
  data,
  onDelete,
  onEdit,
  onView,
  isLoading,
}: CurrentAffairsTableProps) {

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 w-full bg-gray-200 animate-pulse rounded"
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8">
        <Empty>
          <EmptyTitle>No current affairs</EmptyTitle>
          <EmptyDescription>
            Create a current affair to show up here.
          </EmptyDescription>
        </Empty>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Published</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <div className="line-clamp-1">{item.title}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {item.category}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(item.publishedAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onView(item)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onEdit(item)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onDelete(item.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
