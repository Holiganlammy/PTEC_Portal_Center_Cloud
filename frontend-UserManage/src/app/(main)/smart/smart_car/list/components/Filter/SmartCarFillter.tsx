"use client"
import CustomSelect from "@/components/SelectSection/SelectSearch"
import { FormField, Form } from "@/components/ui/form"
import client from "@/lib/axios/interceptors"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { useDebounce } from "use-debounce"
import { z } from "zod"


const SelectSchema = z.object({
   sb_code: z.string(),
   usercode: z.string(),
   car_infocode: z.string(),
   car_category: z.string(),
   sb_status: z.string().optional(),
})
type SelectType = z.infer<typeof SelectSchema>

export default function SmartCarFilter({
   filterOptions,
   onFilterChange
}: {
   filterOptions: SmartCar_FilterOption,
   onFilterChange: (filters: SelectType) => void
}) {
    const isFirstRender = useRef(true)
    const form = useForm<SelectType>({
        resolver: zodResolver(SelectSchema),
        defaultValues: {
            sb_code: "",
            usercode: "",
            car_infocode: "",
            car_category: "",
            sb_status: "",
        },
    })

    const [watchSbCode, watchUsercode, watchCarInfocode, watchCarCategory, watchSbStatus] = form.watch([
      "sb_code",
      "usercode",
      "car_infocode",
      "car_category",
      "sb_status"
   ])

    const [debouncedSbCode] = useDebounce(watchSbCode, 750)
    const [debouncedUsercode] = useDebounce(watchUsercode, 750)
    const [debouncedCarInfocode] = useDebounce(watchCarInfocode, 750)
    const [debouncedCarCategory] = useDebounce(watchCarCategory, 750)
    const [debouncedSbStatus] = useDebounce(watchSbStatus, 750)

    const loadOptionsForSelect = async (input: string, offset?: number, pageSize?: number) => {
      const params: any = { search: input || "" };

      if (typeof offset === "number" && typeof pageSize === "number") {
         params.offset = offset;
         params.pageSize = pageSize;
      }
      const res = await client.get("/SmartBill_Control_Fetch_Filter_SearchCodes", { params });
      return Array.isArray(res.data) ? res.data : (res.data?.recordset ?? []);
   };


    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
            }
            const newFilters = {
            sb_code: debouncedSbCode || "",
            usercode: debouncedUsercode || "",
            car_infocode: debouncedCarInfocode || "",
            car_category: debouncedCarCategory || "",
            sb_status: debouncedSbStatus || "",
            }
            if (onFilterChange) {
            onFilterChange(newFilters)
        }
    }, [debouncedSbCode, debouncedUsercode, debouncedCarInfocode, debouncedCarCategory, debouncedSbStatus])
    
  return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(() => {})}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mt-4"
            >
                <div className="w-full">
                    <FormField 
                        name="sb_code" 
                        control={form.control} 
                        render={({ field }) => (
                            <CustomSelect
                                field={field}
                                formLabel="เลขที่ทำรายการ"
                                placeholder="กรุณาเลือก เลขที่ทำรายการ"
                                loadOptions={loadOptionsForSelect}
                                enableInfiniteScroll={true}
                            />
                        )} />
                </div>

                <div className="w-full">
                    <FormField 
                        name="usercode" 
                        control={form.control} 
                        render={({ field }) => (
                        <CustomSelect
                            field={field}
                            formLabel="ผู้ทำรายการ"
                            placeholder="กรุณาเลือก User Code"
                            options={filterOptions.usercodes}
                        />
                    )} />
                </div>

                <div className="w-full">
                    <FormField 
                        name="car_infocode" 
                        control={form.control} 
                        render={({ field }) => (
                            <CustomSelect
                                field={field}
                                formLabel="ทะเบียนรถ"
                                placeholder="กรุณาเลือก ทะเบียนรถ"
                                options={filterOptions.car_infocodes}
                            />
                    )} />
                </div>

                <div className="w-full">
                    <FormField 
                        name="car_category" 
                        control={form.control} 
                        render={({ field }) => (
                            <CustomSelect
                                field={field}
                                formLabel="ประเภทของรถ"
                                placeholder="กรุณาเลือก ประเภทของรถ"
                                options={filterOptions.car_categories}
                            />
                    )} />
                </div>

                <div className="w-full">
                    <FormField 
                        name="sb_status" 
                        control={form.control} 
                        render={({ field }) => (
                            <CustomSelect
                                field={field}
                                formLabel="สถานะ"
                                placeholder="กรุณาเลือก สถานะ"
                                options={filterOptions.sb_statuses}
                            />
                    )} />
                </div>
            </form>
        </Form>
  )
}