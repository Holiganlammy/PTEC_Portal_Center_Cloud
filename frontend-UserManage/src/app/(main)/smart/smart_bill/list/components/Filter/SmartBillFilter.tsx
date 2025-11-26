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
   sbw_code: z.string(),
   usercode: z.string(),
   car_infocode: z.string(),
   company: z.string(),
})
type SelectType = z.infer<typeof SelectSchema>
    
export default function SmartBillFilter({
   filterOptions,
   onFilterChange
}: {
   filterOptions: SmartBill_FilterOption,
   onFilterChange: (filters: SelectType) => void
}) {
    const isFirstRender = useRef(true)
    const form = useForm<SelectType>({
        resolver: zodResolver(SelectSchema),
        defaultValues: {
            sbw_code: "",
            usercode: "",
            car_infocode: "",
            company: "",
        },
    })

    const [watchSbwCode, watchUsercode, watchCarInfocode, watchCompany] = form.watch([
      "sbw_code",
      "usercode",
      "car_infocode",
      "company"
   ])

    const [debouncedSbwCode] = useDebounce(watchSbwCode, 750)
    const [debouncedUsercode] = useDebounce(watchUsercode, 750)
    const [debouncedCarInfocode] = useDebounce(watchCarInfocode, 750)
    const [debouncedCompany] = useDebounce(watchCompany, 750)

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
            }
            const newFilters = {
            sbw_code: debouncedSbwCode || "",
            usercode: debouncedUsercode || "",
            car_infocode: debouncedCarInfocode || "",
            company: debouncedCompany || "",
            }
            if (onFilterChange) {
            onFilterChange(newFilters)
        }
    }, [debouncedSbwCode, debouncedUsercode, debouncedCarInfocode, debouncedCompany])
    
  return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(form.getValues)}
                className="grid grid-cols-2 gap-x-5 sm:flex sm:gap-x-0 mt-4 space-x-4 justify-end"
            >
                <div className="w-full max-w-[200px]">
                    <FormField 
                        name="sbw_code" 
                        control={form.control} 
                        render={({ field }) => (
                            <CustomSelect
                                field={field}
                                formLabel="เลขที่ทำรายการ"
                                placeholder="กรุณาเลือก Smart Bill Code"
                                options={filterOptions.sbw_code}
                                // loadOptions={loadOptionsForSelect}
                                // enableInfiniteScroll={true}
                            />
                        )} />
                </div>

                <div className="w-full max-w-[200px]">
                    <FormField 
                        name="usercode" 
                        control={form.control} 
                        render={({ field }) => (
                        <CustomSelect
                            field={field}
                            formLabel="ผู้ทำรายการ"
                            placeholder="กรุณาเลือก User Code"
                            options={filterOptions.usercode}
                        />
                    )} />
                </div>

                <div className="w-full max-w-[200px]">
                    <FormField 
                        name="car_infocode" 
                        control={form.control} 
                        render={({ field }) => (
                            <CustomSelect
                                field={field}
                                formLabel="ทะเบียนรถ"
                                placeholder="กรุณาเลือก ทะเบียนรถ"
                                options={filterOptions.car_infocode}
                            />
                    )} />
                </div>

                <div className="w-full max-w-[200px]">
                    <FormField 
                        name="company" 
                        control={form.control} 
                        render={({ field }) => (
                            <CustomSelect
                                field={field}
                                formLabel="บริษัท"
                                placeholder="กรุณาเลือก Company"
                                options={filterOptions.company}
                            />
                    )} />
                </div>
            </form>
        </Form>
  )
}