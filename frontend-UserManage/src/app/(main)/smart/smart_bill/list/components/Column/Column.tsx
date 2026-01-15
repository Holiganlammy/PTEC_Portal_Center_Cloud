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
import { MoreHorizontal, Eye, Edit, Trash2, ArrowUpDown, LockOpen, Lock } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Picture1 from "@/image/Picture1.png"
import Picture2 from "@/image/Picture2.png"
import LogoSMPlus from "@/image/LogoSMPlus.png"

export const SmartBillColumns: ColumnDef<SmartBillData>[] = [
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
    accessorKey: "sbw_code",
    header: ({ column }) => {
      return (
        <Button
         className="text-[13px] 3xl:text-sm p-1!"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            เลขที่ดำเนินการ
          <ArrowUpDown className="w-3! h-3!" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="text-[13px] 3xl:text-sm font-medium text-primary">
        {row.getValue("sbw_code")}
      </div>
    ),
  },
  {
    accessorKey: "typePay",
    header: ({ column }) => (
      <div className="text-center text-[13px] 3xl:text-sm font-semibold">บริษัท</div>
    ),
    cell: ({ row }) => {
      const company = row.getValue("typePay") as string
      
      // เลือกโลโก้ตามบริษัท
      const getCompanyLogo = () => {
        if (company === "PTEC") return Picture1
        if (company === "SCT") return Picture2
        if (company === "SMPlus") return LogoSMPlus
        return null
      }

      const logo = getCompanyLogo()

      return (
        <div className="flex items-center gap-2 w-[100px] justify-center">
          {logo && (
            <div className="relative w-7 h-7 rounded-full overflow-hidden bg-white shadow-sm border border-gray-200 dark:border-gray-700 flex-shrink-0">
              <Image
                src={logo}
                alt={company}
                fill
                className="object-contain p-1"
              />
            </div>
          )}
          <span className="text-[13px] 3xl:text-sm font-semibold">
            {company || "-"}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "ownercode",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="max-w-[100px] mx-auto text-[13px] 3xl:text-sm p-1!"
        >
            ผู้ทำรายการ
          <ArrowUpDown className="w-3! h-3!" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="text-[13px] 3xl:text-sm font-semibold text-center">
        {row.getValue("ownercode") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "createdate",
    header: ({ column }) => (
      <div className="text-[13px] 3xl:text-sm text-center">วันที่ทำรายการ</div>
    ),
    cell: ({ row }) => (
      <div className="text-[13px] 3xl:text-sm font-semibold">
        {row.getValue("createdate") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "car_infocode",
        header: ({ column }) => (
      <div className="text-[13px] 3xl:text-sm text-center">ทะเบียนรถ</div>
    ),
    cell: ({ row }) => (
      <div className="text-[13px] 3xl:text-sm font-semibold">
        {row.getValue("car_infocode") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "car_band",
    header: ({ column }) => (
      <div className="text-[13px] 3xl:text-sm text-center">ยี่ห้อรถ</div>
    ),
    cell: ({ row }) => (
      <div className="text-[13px] 3xl:text-sm font-semibold">
        {row.getValue("car_band") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "car_tier",
        header: ({ column }) => (
      <div className="text-[13px] 3xl:text-sm text-center">รุ่นรถ</div>
    ),
    cell: ({ row }) => {
      const carTier = row.getValue("car_tier") as string;
      
      if (!carTier || carTier === "" || carTier === "-") {
        return (
          <div className="text-[13px] 3xl:text-sm text-red-600 font-semibold">
            ยังไม่มีรายการรถยนต์
          </div>
        );
      }
      
      return (
        <div className="text-[13px] 3xl:text-sm font-semibold">
          {carTier}
        </div>
      );
    },
  },
  { 
    accessorKey: "lock_status",
    header: ({ column }) => {
      return (
        <Button
          className="text-[13px] 3xl:text-sm p-1!"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          สถานะเอกสาร
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const isLocked = row.getValue("lock_status")
      
      return (
        <div className="flex items-center justify-center text-[13px] 3xl:text-sm font-semibold">
          {isLocked ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-sm">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-100"></span>
              </div>
              <Lock className="h-3.5 w-3.5" />
              <span className="text-[13px] 3xl:text-sm font-semibold">ล็อค</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm">
              <div className="relative flex h-2 w-2">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-100"></span>
              </div>
              <LockOpen className="h-3.5 w-3.5" />
              <span className="text-[13px] 3xl:text-sm font-semibold">ปลดล็อค</span>
            </div>
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: ({ column }) => (
      <div className="text-[13px] 3xl:text-sm text-center">การจัดการ</div>
    ),
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
              onClick={() => navigator.clipboard.writeText(smartCar.sbw_code || '')}
            >
              Copy Smart Car Code
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Link href={`/smart/smart_bill/create?code=${smartCar.sbw_code}`}>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Smart Bill
              </DropdownMenuItem>
            </Link>
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