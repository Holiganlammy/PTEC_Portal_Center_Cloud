"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2, ArrowUpDown } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

export const SmartCarColumns: ColumnDef<SmartCarData>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <div className="flex justify-center items-center w-8">
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex justify-center items-center w-8">
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
    },
  {
    accessorKey: "sb_code",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            เลขที่ดำเนินการ
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium text-primary">
        {row.getValue("sb_code")}
      </div>
    ),
  },
  {
    accessorKey: "usercode",
    header: "ผู้ทำรายการ",
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate" title={row.getValue("usercode")}>
        {row.getValue("usercode")}
      </div>
    ),
  },
  {
    accessorKey: "createdate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            วันที่ทำรายการ
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {row.getValue("createdate") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "car_infocode",
    header: "ทะเบียนรถ",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.getValue("car_infocode") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "reamarks",
    header: "สถานที่จอดหลังใช้",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.getValue("reamarks") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "car_categary_name",
    header: "ประเภทรถ",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.getValue("car_categary_name") || "-"}
      </div>
    ),
  },
 { 
    accessorKey: "sb_status_name",
    header: "สถานะ",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.getValue("sb_status_name") || "-"}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const smartCar = row.original

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
              onClick={() => navigator.clipboard.writeText(smartCar.sb_code || '')}
            >
              Copy Smart Car Code
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Link href={`/smart/smart_car/updateform?code=${smartCar.sb_code}`}>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem disabled>
              <Edit className="mr-2 h-4 w-4" />
              Edit Asset
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Asset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]