"use client"

import { useMemo } from "react"
import { DataTable } from "@/components/DataTable/DataTable"
import { SmartCarColumns } from "./Column/Column"

interface Props {
  data: SmartCarData[]
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

export default function SmartCarDataTable({ 
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
  const columns = useMemo(() => SmartCarColumns, [])
  return (
    <div>
      <DataTable
        columns={columns}
        data={data}
        searchKeys={["Code", "Name", "SerialNo", "OwnerID", "Group_name", "Location"]}
        searchPlaceholder="ค้นหา Smart Car Code, ทะเบียน, Initial..."
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