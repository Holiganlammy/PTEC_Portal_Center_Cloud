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
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Clock,
  Check,
} from "lucide-react"
import Image from "next/image"
import Picture1 from "@/image/Picture1.png"
import Picture2 from "@/image/Picture2.png"
import LogoSMPlus from "@/image/LogoSMPlus.png"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useSession } from "next-auth/react"

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
    accessorKey: "sb_name",
    header: "Company",
    cell: ({ row }) => {
      const originalCompany = row.getValue("sb_name") as string
      
      // ถ้าไม่ใช่ PTEC, SMPlus หรือ SCT ให้แสดง PTEC เป็นค่าเริ่มต้น
      const company = ["PTEC", "SMPlus", "SCT"].includes(originalCompany) 
        ? originalCompany 
        : "PTEC"

      // เลือกโลโก้ตามบริษัท
      const getCompanyLogo = () => {
        if (company === "PTEC") return Picture1
        if (company === "SCT") return Picture2
        if (company === "SMPlus") return LogoSMPlus
        return Picture1 // ค่าเริ่มต้นเป็น PTEC logo
      }

      const logo = getCompanyLogo()

      return (
        <div className="flex items-center gap-2 w-[100px] justify-center">
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white shadow-sm border border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Image
              src={logo}
              alt={company}
              fill
              className="object-contain p-1"
            />
          </div>
          <span className="font-medium text-sm">
            {company}
          </span>
        </div>
      )
    },
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
    header: ({ column }) => (
      <div className="text-center">ประเภทรถ</div>
    ),
    cell: ({ row }) => {
      const category = row.getValue("car_categary_name") as string

      return (
        <div className="flex justify-center">
          {category === "รถยนต์ประจำตำแหน่ง" ? (
            <div className="inline-flex items-center px-3 py-1.5 rounded-md font-semibold text-xs transition-all duration-200 bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-sm hover:shadow-md">
              <span>รถประจำตำแหน่ง</span>
            </div>
          ) : category === "รถยนต์ประจำหน้าที่" ? (
            <div className="inline-flex items-center px-3 py-1.5 rounded-md font-semibold text-xs transition-all duration-200 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm hover:shadow-md">
              <span>รถประจำหน้าที่</span>
            </div>
          ) : category === "รถยนต์ส่วนกลาง" ? (
            <div className="inline-flex items-center px-3 py-1.5 rounded-md font-semibold text-xs transition-all duration-200 bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-sm hover:shadow-md">
              <span>รถส่วนกลาง</span>
            </div>
          ) : category === "รถยนต์ประจำหน่วยงาน" ? (
            <div className="inline-flex items-center px-3 py-1.5 rounded-md font-semibold text-xs transition-all duration-200 bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-sm hover:shadow-md">
              <span>รถประจำหน่วยงาน</span>
            </div>
          ) : category === "รถยนต์ส่วนตัวของพนักงาน" ? (
            <div className="inline-flex items-center px-3 py-1.5 rounded-md font-semibold text-xs transition-all duration-200 bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-sm hover:shadow-md">
              <span>รถส่วนตัวพนักงาน</span>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              {category || "-"}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "sb_status_name",
    header: ({ column }) => (
      <div className="text-center">สถานะ</div>
    ),
    cell: ({ row }) => {
      const status = row.getValue("sb_status_name") as string

      // ตรวจสอบประเภทสถานะ
      const isAdminApproved = status?.includes('[') && status?.includes('] ตรวจสอบแล้ว')
      const isUserChecked = status?.includes('ตรวจสอบแล้ว')
      const isCompleted = status === 'ดำเนินการเสร็จสิ้น'
      const isWaiting = status === 'รอ Admin ตรวจสอบ'

      // แยก username ออกจาก status (ถ้ามี)
      const username = status?.match(/\[(.*?)\]/)?.[1]

      return (
        <div className="flex justify-center">
          {isAdminApproved ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 border-2 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-950/50">
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              <ShieldCheck className="h-3.5 w-3.5" />
              <div className="flex flex-col items-start">
                <span className="leading-tight">Admin ตรวจสอบแล้ว</span>
                {username && (
                  <span className="text-[10px] text-purple-500 dark:text-purple-400">
                    โดย {username}
                  </span>
                )}
              </div>
            </div>
          ) : isUserChecked ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 border-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/50">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <UserCheck className="h-3.5 w-3.5" />
              <div className="flex flex-col items-start">
                <span className="leading-tight">ตรวจสอบแล้ว</span>
                {username && (
                  <span className="text-[10px] text-blue-500 dark:text-blue-400">
                    โดย {username}
                  </span>
                )}
              </div>
            </div>
          ) : isCompleted ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 border-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>เสร็จสิ้น</span>
            </div>
          ) : isWaiting ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 border-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/50">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <Clock className="h-3.5 w-3.5" />
              <span>{status}</span>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              {status || "-"}
            </div>
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const smartCar = row.original
      const { data: session } = useSession()
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
          {(smartCar.sb_status === 1 
            && smartCar.sb_status_name === 'รอ Admin ตรวจสอบ' 
            && !smartCar.admin_approve
            && (session?.user?.depid === 19 || session?.user?.depid === 23)) && (
              <Link href={`/smart/smart_car/checklist?code=${smartCar.sb_code}`}>
                <DropdownMenuItem>
                  <Check className="mr-2 h-4 w-4" />
                  ตรวจสอบเอกสาร
                </DropdownMenuItem>
              </Link>
            )}
            {/* <Link href={`/smart/smart_car/updateform?code=${smartCar.sb_code}`}> */}
            {/* <DropdownMenuItem disabled>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem> */}
            {/* </Link> */}
            {(session?.user?.UserCode === smartCar.usercode || session?.user?.role_id === 1) && (
              <Link href={`/smart/smart_car/updateform?code=${smartCar.sb_code}`}>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Asset
                </DropdownMenuItem>
              </Link>
            )}
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