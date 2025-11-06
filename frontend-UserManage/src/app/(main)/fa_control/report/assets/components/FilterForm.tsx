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
   code: z.string(),
   name: z.string(),
   owner: z.string(),
   group: z.string(),
   location: z.string(),
   search: z.string().optional(),
})
type SelectType = z.infer<typeof SelectSchema>

export default function AssetsFilterForm({
   typeCode,
   activeType,
   setActiveType,
   filterOptions,
   onFilterChange
}: {
   typeCode: Assets_TypeGroup[],
   activeType: string,
   setActiveType: (type: string) => void,
   filterOptions: FilterOption,
   onFilterChange: (filters: SelectType) => void
}) {
    const isFirstRender = useRef(true)
    const form = useForm<SelectType>({
        resolver: zodResolver(SelectSchema),
        defaultValues: {
            code: "",
            name: "",
            owner: "",
            group: "",
            location: "",
            search: "",
        },
    })

    const [watchCode, watchName, watchOwner, watchGroup, watchLocation, watchSearch] = form.watch([
      "code",
      "name",
      "owner",
      "group",
      "location",
      "search"
   ])

    const [debouncedCode] = useDebounce(watchCode, 750)
    const [debouncedName] = useDebounce(watchName, 750)
    const [debouncedOwner] = useDebounce(watchOwner, 750)
    const [debouncedGroup] = useDebounce(watchGroup, 750)
    const [debouncedLocation] = useDebounce(watchLocation, 750)
    const [debouncedSearch] = useDebounce(watchSearch, 500)

    const loadOptionsForSelect = async (input: string, offset?: number, pageSize?: number) => {
      const params: any = { search: input || "" };

      if (typeof offset === "number" && typeof pageSize === "number") {
         params.offset = offset;
         params.pageSize = pageSize;
      }
      const res = await client.get("/FA_Control_Fetch_Assets_FilterCode", { params });
      return Array.isArray(res.data) ? res.data : (res.data?.recordset ?? []);
   };


    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
            }
            const newFilters = {
            code: debouncedCode || "",
            name: debouncedName || "",
            owner: debouncedOwner || "",
            group: debouncedGroup || "",
            location: debouncedLocation || "",
            search: debouncedSearch || "",
            }
            if (onFilterChange) {
            onFilterChange(newFilters)
        }
    }, [debouncedCode, debouncedName, debouncedOwner, debouncedGroup, debouncedLocation, debouncedSearch])
  return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(form.getValues)}
                className="grid grid-cols-2 gap-x-5 sm:flex sm:gap-x-0 mt-4 space-x-4 justify-end"
            >
                <div className="w-full max-w-[200px]">
                    <FormField 
                        name="code" 
                        control={form.control} 
                        render={({ field }) => (
                            <CustomSelect
                                field={field}
                                formLabel="Code"
                                placeholder="Code"
                                loadOptions={loadOptionsForSelect}
                                enableInfiniteScroll={true}
                            />
                        )} />
                </div>

                <div className="w-full max-w-[200px]">
                    <FormField 
                        name="name" 
                        control={form.control} 
                        render={({ field }) => (
                        <CustomSelect
                            field={field}
                            formLabel="Name"
                            placeholder="Name"
                            options={filterOptions.names}
                        />
                    )} />
                </div>

                <div className="w-full max-w-[200px]">
                    <FormField 
                        name="owner" 
                        control={form.control} 
                        render={({ field }) => (
                            <CustomSelect
                                field={field}
                                formLabel="Owner"
                                placeholder="Owner"
                                options={filterOptions.owners}
                            />
                    )} />
                </div>

                <div className="w-full max-w-[200px]">
                    <FormField 
                        name="group" 
                        control={form.control} 
                        render={({ field }) => (
                            <CustomSelect
                                field={field}
                                formLabel="Group"
                                placeholder="Group"
                                options={filterOptions.groups}
                            />
                    )} />
                </div>

                <div className="w-full max-w-[200px]">
                    <FormField 
                        name="location" 
                        control={form.control} 
                        render={({ field }) => (
                            <CustomSelect
                                field={field}
                                formLabel="Location"
                                placeholder="Location"
                                options={filterOptions.locations}
                            />
                    )} />
                </div>
            </form>
        </Form>
  )
}