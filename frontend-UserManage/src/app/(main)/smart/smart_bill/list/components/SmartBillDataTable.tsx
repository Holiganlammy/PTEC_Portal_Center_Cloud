"use client"

import { useMemo } from "react"
import { DataTable } from "@/components/DataTable/DataTable"
import { SmartBillColumns } from "./Column/Column"

interface Props {
  data: SmartBillData[]
  loading?: boolean
  pagination: {
    pageIndex: number
    pageSize: number
  }
  totalPages: number
  totalRows: number
  onPageChange: (newPage: number) => void
  onPageSizeChange: (newSize: number) => void
  searchValue?: string
  onSearchChange?: (searchValue: string) => void
}

export default function SmartBillDataTable({ 
  data, 
  loading,
  pagination,
  totalPages,
  totalRows,
  onPageChange,
  onPageSizeChange,
  searchValue,
  onSearchChange,
}: Props) {
  const columns = useMemo(() => SmartBillColumns, [])
  return (
    <div>
      <DataTable
        columns={columns}
        data={data}
        searchKeys={["sbw_code", "ownercode", "company"]}
        searchPlaceholder="ค้นหา Smart Bill Code, ผู้ทำรายการ, บริษัท..."
        Loading={loading}
        pagination={pagination}
        pageCount={totalPages}
        totalRows={totalRows}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
      />
    </div>
  )
}