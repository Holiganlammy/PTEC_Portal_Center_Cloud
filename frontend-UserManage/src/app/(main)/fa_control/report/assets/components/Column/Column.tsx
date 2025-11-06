"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"

export const assetsColumns: ColumnDef<Asset>[] = [
  {
    accessorKey: "Code",
    header: "Asset Code",
    cell: ({ row }) => (
      <div className="font-medium text-primary">
        {row.getValue("Code")}
      </div>
    ),
  },
  {
    accessorKey: "Name",
    header: "Asset Name",
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate" title={row.getValue("Name")}>
        {row.getValue("Name")}
      </div>
    ),
  },
  {
    accessorKey: "SerialNo",
    header: "Serial No",
    cell: ({ row }) => (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {row.getValue("SerialNo") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "OwnerID",
    header: "Owner",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.getValue("OwnerID") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "Asset_group",
    header: "Asset Group",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.getValue("Asset_group") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "Position",
    header: "Location",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.getValue("Position") || "-"}
      </div>
    ),
  },
 { 
    accessorKey: "Group_name",
    header: "Group Name",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.getValue("Group_name") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "Details",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("Details") as string
      
      const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
        Active: {
          variant: "default",
          className: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
        },
        Inactive: {
          variant: "destructive",
          className: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
        },
        Maintenance: {
          variant: "secondary",
          className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
        },
        Disposed: {
          variant: "outline",
          className: "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/30 dark:text-gray-400"
        }
      }

      const config = statusConfig[status] || statusConfig.Active

      return (
        <Badge variant={config.variant} className={config.className}>
          {status || "N/A"}
        </Badge>
      )
    },
  },
  { 
    accessorKey: "Price",
    header: "ราคาทุน",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.getValue("Price") || "-"}
      </div>
    ),
  },
  { 
    accessorKey: "CreateDate",
    header: "วันที่ขึ้นทะเบียน",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.getValue("CreateDate") || "-"}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const asset = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(asset.Code)}
            >
              Copy Asset Code
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Asset
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Asset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]