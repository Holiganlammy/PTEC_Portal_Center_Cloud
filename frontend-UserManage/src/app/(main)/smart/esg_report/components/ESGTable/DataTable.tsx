"use client"

import { useMemo } from "react"
import { DataTable } from "@/components/DataTable/DataTable"
import { ESGColumn } from "../Column/Column"

interface Props {
  data: EsgReport[]
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

export default function ESGDataTable({ 
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
  const columns = useMemo(() => ESGColumn, [])
  return (
    <div>
      <DataTable
        columns={columns}
        data={data}
        searchKeys={["car_infocode", "car_band", "car_tier"]}
        searchPlaceholder="ค้นหาทะเบียนรถ, แบรนด์รถ, รุ่นรถ"
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