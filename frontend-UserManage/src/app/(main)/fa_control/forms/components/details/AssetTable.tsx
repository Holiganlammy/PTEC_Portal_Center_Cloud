import { FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove, UseFormReturn, useFieldArray } from "react-hook-form";
import { CombinedForm } from "@/app/(main)/fa_control/forms/schema/combinedSchema";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo } from "react";
import CustomSelect from "@/components/SelectSection/SelectSearch";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { useSession } from "next-auth/react";
import SumDetails from "./SumDetails";
import { SquarePlus, Trash2 } from "lucide-react";
import { FilePicker } from "./fileUpload";
import { validateNumberString } from "../../service/faService";

type Props = {
  nac_code: string;
  form: UseFormReturn<CombinedForm>;
  userFetch: UserData[];
  assets: DataAsset[];
  fields: FieldArrayWithId<CombinedForm, "details", "id">[];
  append: UseFieldArrayAppend<CombinedForm, "details">;
  remove: UseFieldArrayRemove;
  showReceiver: boolean
}



export default function AssetTable({ nac_code, form, userFetch, assets, fields, append, remove, showReceiver }: Props) {
  if (!form) return null;

  const { control } = form;

  const { data: session, status } = useSession({
  required: false,
});
  const dataUser = userFetch.find(data => data.UserCode === session?.user.UserCode)

const loadOptionsForSelect = useMemo(() => {
  return async (input: string): Promise<{ value: string; label: string }[]> => {
    const filtered = input.trim() === ""
      ? assets
      : assets.filter((a) => a.Code.toLowerCase().includes(input.toLowerCase()));
      console.log("🔍 Filtered results:", filtered.length);
    const result = filtered.map((a) => ({ value: a.Code, label: a.Code }));

    return result;
  };
}, [assets]);


  useEffect(() => {
    const details = form.getValues("details");
    if (!details) return;
    details.forEach((item, index) => {
      const matched = assets.find((res: DataAsset) => res.Code === item.nacdtl_assetsCode);
      if (matched) {
        form.setValue(`details.${index}.nacdtl_assetsCode`, item.nacdtl_assetsCode);
        form.setValue(`details.${index}.nacdtl_assetsName`, matched.Name || undefined);
        form.setValue(`details.${index}.nacdtl_assetsSeria`, matched.SerialNo || undefined);
        form.setValue(`details.${index}.nacdtl_assetsPrice`, matched.Price || 0);
        form.setValue(`details.${index}.OwnerCode`, matched.OwnerCode);
        form.setValue(`details.${index}.nacdtl_date_asset`, matched.CreateDate || undefined);
        form.setValue(`details.${index}.nacdtl_assetsDtl`, matched.Details);
      }
    });
  }, [form.getValues("details"), assets]);

  useEffect(() => {
    const details = form.watch("details");
    if (!Array.isArray(details)) return;

    details.forEach((item, index) => {
      const bookV = parseFloat(item.nacdtl_bookV as any) || 0;
      const priceSeals = parseFloat(item.nacdtl_PriceSeals as any) || 0;

      const exVat = priceSeals * (100 / 107);
      const profit = exVat - bookV;

      form.setValue(`details.${index}.nacdtl_assetsExVat`, +exVat.toFixed(2), {
        shouldDirty: true,
        shouldValidate: true,
      });

      form.setValue(`details.${index}.nacdtl_profit`, +profit.toFixed(2), {
        shouldDirty: true,
        shouldValidate: true,
      });
    });
  }, [form.watch("details")]);
  console.log("fields", fields);

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-[768px] table-auto w-full text-sm text-left border">
        <thead className="bg-zinc-700 text-white">
          <tr>
            <th className="p-2 pl-4 whitespace-nowrap w-[15%]">รหัสทรัพย์สิน</th>
            <th className="hidden md:table-cell p-2 pl-4  whitespace-nowrap">Serial No.</th>
            <th className="p-2 pl-4  whitespace-nowrap w-[15%]">ชื่อทรัพย์สิน</th>
            {showReceiver && <th className="hidden md:table-cell p-2 pl-4 whitespace-nowrap">วันที่ขึ้นทะเบียน</th>}
            <th className="p-2 pl-4 whitespace-nowrap">ผู้ถือครอง</th>
            {showReceiver && <th className="hidden md:table-cell p-2 pl-4 whitespace-nowrap">สถานะ</th>}
            <th className="p-2 whitespace-nowrap text-right">ต้นทุน (฿)</th>
            {!showReceiver &&
              <>
                <th className="p-2 whitespace-nowrap text-right">BV (฿)</th>
                <th className="p-2 whitespace-nowrap text-right">Sell (฿)</th>
                <th className="p-2 whitespace-nowrap text-right">Ex.Vat (฿)</th>
                <th className="p-2 whitespace-nowrap text-right">Profit (฿)</th>

              </>
            }
            <th className="p-2 whitespace-nowrap text-center w-[10%]">File</th>
            <th className="p-2 whitespace-nowrap text-center">
              <button
                type="button"
                onClick={() =>
                  append({
                    nacdtl_assetsCode: undefined,
                    nacdtl_assetsName: undefined,
                    nacdtl_assetsSeria: undefined,
                    nacdtl_assetsPrice: 0,
                    OwnerCode: undefined,
                    nacdtl_assetsDtl: undefined,
                    nacdtl_date_asset: undefined,
                    nacdtl_image_1: "",
                    nacdtl_image_2: "",
                    nacdtl_bookV: 0,
                    nacdtl_PriceSeals: 0,
                    nacdtl_assetsExVat: 0,
                    nacdtl_profit: 0,
                  })
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
              >
                <SquarePlus className="w-4 h-4" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => (
            <tr key={field.id} className="bg-white border-t">
              <td className="p-2 pt-0">
              <FormField
                control={control}
                name={`details.${index}.nacdtl_assetsCode`}
                render={({ field }) => {
                  const matched = assets.find(asset => asset.Code === field.value);

                  //  ถ้าไม่มีใน assets ให้โชว์เป็น Input readOnly
                  if (!matched && field.value) {
                    return (
                      <Input
                        type="text"
                        value={field.value}
                        readOnly
                        className="w-full bg-gray-100 text-gray-600 cursor-not-allowed"
                        placeholder="ไม่มีข้อมูลในระบบ"
                      />
                    );
                  }

                  //  ถ้ามี matched หรือค่าว่าง — ใช้ CustomSelect ตามปกติ
                  return (
                    <CustomSelect
                      field={{
                        ...field,
                        onChange: (value: string) => {
                          console.log(" Selected asset code:", value);

                          field.onChange(value);
                          const matched = assets.find(asset => asset.Code === value);
                          if (matched && value) {
                            form.setValue(`details.${index}.nacdtl_assetsCode`, value);
                            form.setValue(`details.${index}.nacdtl_assetsName`, matched.Name || undefined);
                            form.setValue(`details.${index}.nacdtl_assetsSeria`, matched.SerialNo || undefined);
                            form.setValue(`details.${index}.nacdtl_assetsPrice`, matched.Price || 0);
                            form.setValue(`details.${index}.OwnerCode`, matched.OwnerCode || undefined);
                            form.setValue(`details.${index}.nacdtl_assetsDtl`, matched.Details || undefined);
                            form.setValue(`details.${index}.nacdtl_date_asset`, matched.CreateDate || undefined);
                          } else if (!value) {
                            form.setValue(`details.${index}.nacdtl_assetsCode`, "");
                            form.setValue(`details.${index}.nacdtl_assetsName`, undefined);
                            form.setValue(`details.${index}.nacdtl_assetsSeria`, undefined);
                            form.setValue(`details.${index}.nacdtl_assetsPrice`, 0);
                            form.setValue(`details.${index}.OwnerCode`, undefined);
                            form.setValue(`details.${index}.nacdtl_assetsDtl`, undefined);
                            form.setValue(`details.${index}.nacdtl_date_asset`, undefined);
                          }
                        }
                      }}
                      errorString={Boolean(form.formState.errors.details?.[index]?.nacdtl_assetsCode)}
                      placeholder="กรุณาเลือกรหัสทรัพย์สิน"
                      formLabel=""
                      loadOptions={loadOptionsForSelect}
                    />
                  );
                }}
              />
              </td>
              <td className="p-2 hidden md:table-cell">
                <FormField
                  control={control}
                  name={`details.${index}.nacdtl_assetsSeria`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="text"
                          readOnly
                          {...field}
                          value={field.value ?? ""}
                          placeholder=""
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </td>
              <td className="p-2">
                <FormField
                  control={control}
                  name={`details.${index}.nacdtl_assetsName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="text"
                          readOnly
                          {...field}
                          value={field.value ?? ""}
                          placeholder=""
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </td>
              {showReceiver &&
                <td className="p-2 hidden md:table-cell">
                  <FormField
                    control={control}
                    name={`details.${index}.nacdtl_date_asset`}
                    render={({ field }) => {
                      const formattedDate =
                        field.value && !isNaN(Date.parse(field.value))
                          ? new Date(field.value).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "2-digit", year: "numeric"
                          })
                          : "";

                      return (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="text"
                              readOnly
                              {...field}
                              value={formattedDate}
                              placeholder=""
                            />
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />
                </td>
              }
              <td className="p-2">
                <FormField
                  control={control}
                  name={`details.${index}.OwnerCode`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="text"
                          readOnly
                          {...field}
                          value={field.value ?? ""}
                          placeholder=""
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </td>
              {showReceiver &&
                <td className="p-2 hidden md:table-cell">
                  <FormField
                    control={control}
                    name={`details.${index}.nacdtl_assetsDtl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="text"
                            readOnly
                            {...field}
                            value={field.value ?? ""}
                            placeholder=""
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </td>
              }
              <td className="p-2 text-center">
                <FormField
                  control={control}
                  name={`details.${index}.nacdtl_assetsPrice`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type={dataUser?.BranchID === 901 ? 'text' : 'password'}
                          inputMode="decimal"
                          className="text-right cursor-default"
                          value={typeof field.value === 'number'
                            ? field.value.toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                            : ''
                          }
                          onChange={(e) => {
                            const raw = e.target.value.replace(/,/g, "");
                            const parsed = parseFloat(raw);
                            field.onChange(isNaN(parsed) ? 0 : parsed);
                          }}
                          placeholder="0.00"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </td>
              {!showReceiver &&
                <>
                  <td className="p-2 text-center">
                    <FormField
                      control={control}
                      name={`details.${index}.nacdtl_bookV`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              step="0.01"
                              min={0}
                              className="text-right"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (/^\d*\.?\d{0,2}$/.test(raw)) {
                                  field.onChange(raw);
                                }
                              }}
                              onBlur={(e) => {
                                const validated = validateNumberString(e.target.value);
                                field.onChange(validated); // แปลง string → number (หรือ null ถ้าไม่ valid)
                              }}
                              placeholder="0.00"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <FormField
                      control={control}
                      name={`details.${index}.nacdtl_PriceSeals`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              step="0.01"
                              min={0}
                              className="text-right"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (/^\d*\.?\d{0,2}$/.test(raw)) {
                                  field.onChange(raw);
                                }
                              }}
                              onBlur={(e) => {
                                const validated = validateNumberString(e.target.value);
                                field.onChange(validated); // แปลง string → number (หรือ null ถ้าไม่ valid)
                              }}
                              placeholder="0.00"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <FormField
                      name={`details.${index}.nacdtl_assetsExVat`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              step="0.01"
                              min={0}
                              readOnly
                              className="text-right"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (/^\d*\.?\d{0,2}$/.test(raw)) {
                                  field.onChange(raw);
                                }
                              }}
                              onBlur={(e) => {
                                const validated = validateNumberString(e.target.value);
                                field.onChange(validated);
                              }}
                              placeholder="0.00"
                            />
                          </FormControl>
                        </FormItem>
                      )} />
                  </td>
                  <td className="p-2 text-center">
                    <FormField
                      control={control}
                      name={`details.${index}.nacdtl_profit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              step="0.01"
                              min={0}
                              readOnly
                              className="text-right"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (/^\d*\.?\d{0,2}$/.test(raw)) {
                                  field.onChange(raw);
                                }
                              }}
                              onBlur={(e) => {
                                const validated = validateNumberString(e.target.value);
                                field.onChange(validated); // แปลง string → number (หรือ null ถ้าไม่ valid)
                              }}
                              placeholder="0.00"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </td>
                </>
              }
              <td className="p-2">
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  {/* ---------- Image 1 ---------- */}
                  <FormField
                    control={control}
                    name={`details.${index}.nacdtl_image_1`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FilePicker
                            field={field}
                            idx={index}
                            type={'nacdtl_image_1'}
                            nac_code={form.watch("nac_code") || ""}
                            errorString={form.formState.errors.details?.[index]?.nacdtl_image_1?.message || ""}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* {form.watch("nac_type") === 1 && ( */}
                  <FormField
                    control={control}
                    name={`details.${index}.nacdtl_image_2`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FilePicker
                            field={field}
                            idx={index}
                            type={'nacdtl_image_2'}
                            nac_code={form.watch("nac_code") || ""}
                            errorString={form.formState.errors.details?.[index]?.nacdtl_image_2?.message || ""}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {/* )} */}
                </div>
              </td>
              <td className="p-2 text-center">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
          {/* SumDetails */}
          <SumDetails
            nac_code={nac_code}
            form={form}
            userFetch={userFetch}
            assets={assets}
            fields={fields}
            append={append}
            remove={remove}
            showReceiver={showReceiver}
          />
        </tbody>
      </table>
    </div>
  );
}
