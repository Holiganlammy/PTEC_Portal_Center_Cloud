"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {ArrowUpDown} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

export const ESGColumn: ColumnDef<EsgReport>[] = [
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
    accessorKey: "car_infocode",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            ทะเบียนรถ
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium text-primary">
        {row.getValue("car_infocode")}
      </div>
    ),
  },
  {
    accessorKey: "car_band",
    header: "แบรนด์รถ",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.getValue("car_band") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "car_tier",
    header: "รุ่นรถ",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.getValue("car_tier") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "car_color",
    header: "สีรถ",
    cell: ({ row }) => (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {row.getValue("car_color") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "rateoil",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            อัตราการใช้น้ำมัน (ลิตร/กม.)
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="text-sm">
        {row.getValue("rateoil") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "mile",
    header: "ระยะทาง (กม.)",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.getValue("mile") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "oil",
    header: "ปริมาณน้ำมันที่ใช้ (ลิตร)",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.getValue("oil") || "-"}
      </div>
    ),
  },
]