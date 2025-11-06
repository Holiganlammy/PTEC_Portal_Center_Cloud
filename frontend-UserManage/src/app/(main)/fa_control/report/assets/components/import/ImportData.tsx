"use client";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle2, XCircle, Loader2, FileSpreadsheet, Upload } from "lucide-react";
import * as XLSX from 'xlsx';
import client from "@/lib/axios/interceptors";
import { toast } from "sonner"


interface ImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    users: DataUserList[];
    assetsTypeGroup: Assets_TypeGroup[];
    userCode: string;
    onSuccess: () => void;
}

export default function ImportDialog({
    open,
    onOpenChange,
    users,
    assetsTypeGroup,
    userCode,
    onSuccess,
}: ImportDialogProps) {
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importData, setImportData] = useState<AssetDataExcel[]>([]);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [activeTab, setActiveTab] = useState("summary");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportFile(file);
        setIsValidating(true);
        setActiveTab("summary");

        try {
            const data = await readExcelFile(file);
            setImportData(data);
            await validateImportData(data);
            
            toast.success("ไฟล์ถูกโหลดสำเร็จ", {
                description: `พบข้อมูล ${data.length} รายการ`,
            });
        } catch (error: any) {
            toast.error("เกิดข้อผิดพลาด", {
                description: error.message,
            });
            handleClose();
        } finally {
            setIsValidating(false);
        }

        event.target.value = '';
    };

    const readExcelFile = (file: File): Promise<AssetDataExcel[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e: ProgressEvent<FileReader>) => {
                try {
                    if (!e.target?.result) {
                        reject(new Error("No file content"));
                        return;
                    }

                    const data = new Uint8Array(e.target.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { 
                        type: 'array', 
                        cellText: false, 
                        cellDates: true 
                    });

                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    const columnsHeader: string[][] = XLSX.utils.sheet_to_json(worksheet, { 
                        header: 1, 
                        raw: false, 
                        dateNF: 'dd/mm/yyyy', 
                        rawNumbers: false 
                    });

                    if (!columnsHeader[0]?.includes('Code')) {
                        reject(new Error("ไม่พบคอลัมน์ 'Code' ในไฟล์"));
                        return;
                    }

                    const parsedData = XLSX.utils.sheet_to_json<AssetDataExcel>(worksheet, {
                        range: 1,
                        header: columnsHeader[0] as string[],
                        raw: false,
                        dateNF: 'dd/mm/yyyy',
                    });

                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsArrayBuffer(file);
        });
    };

    const validateImportData = async (data: AssetDataExcel[]) => {
    const codes = data.map(item => item.Code).join(",");
    
    const res = await client.get("/FA_Control_Check_Assets_Codes", {
        params: { codes }
    });

    const detail: AssetValidateResult[] = res.data;

    const duplicateCodes = detail
        .filter((item: AssetValidateResult) => item.ExistsStatus === 1)
        .map((item: AssetValidateResult) => item.Code);

    const normalize = (str: string | number): string => String(str).trim().toUpperCase();

    const validUserCodes = new Set(users.map(user => normalize(user.UserCode)));
    const validBranchIds = new Set(users.map(user => String(user.BranchID).trim()));
    const validTypeGroups = new Set(assetsTypeGroup.map(type => normalize(type.typeCode)));

    const invalidOwners: string[] = [];
    const invalidBranches: string[] = [];
    const invalidTypes: string[] = [];
    const validData: AssetDataExcel[] = [];

    data.forEach(item => {
        let isValid = true;

        if (duplicateCodes.includes(item.Code)) isValid = false;

        if (!validUserCodes.has(normalize(item.OwnerCode))) {
        if (!invalidOwners.includes(item.OwnerCode)) invalidOwners.push(item.OwnerCode);
        isValid = false;
        }

        if (!validBranchIds.has(String(item.BranchID).trim())) {
        if (!invalidBranches.includes(item.BranchID)) invalidBranches.push(item.BranchID);
        isValid = false;
        }

        if (!validTypeGroups.has(normalize(item.TypeGroup))) {
        if (!invalidTypes.includes(item.TypeGroup)) invalidTypes.push(item.TypeGroup);
        isValid = false;
        }

        if (isValid) validData.push(item);
    });

    setValidationResult({
        valid: validData,
        duplicateCodes,
        invalidOwners,
        invalidBranches,
        invalidTypes,
    });

    console.log("✅ Duplicate Codes:", duplicateCodes);
    console.log("✅ Valid Data:", validData);
    };

    const handleUploadValidData = async () => {
        if (!validationResult?.valid.length || !userCode) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const response = await client.post(
                `/FA_Control_BPC_Running_NO`,
                { UserCode: userCode },
                { headers: { "Content-Type": "application/json" } }
            );

            const keyID = response.data[0]?.TAB;
            if (!keyID) throw new Error("Failed to retrieve keyID");

            const totalItems = validationResult.valid.length;

            for (let i = 0; i < totalItems; i++) {
                const body = {
                    ...validationResult.valid[i],
                    UserCode: userCode,
                    keyID,
                };

                await client.post(`/FA_Control_New_Assets_Xlsx`, body, {
                    headers: { "Content-Type": "application/json" }
                });

                const progress = Math.floor(((i + 1) / totalItems) * 100);
                setUploadProgress(progress);

                if (i === totalItems - 1) {
                    const finalBody = { count: totalItems, keyID };
                    const finalResponse = await client.post(
                        `/FA_Control_import_dataXLSX_toAssets`,
                        finalBody,
                        { headers: { "Content-Type": "application/json" } }
                    );

                    const finalResponseMsg = finalResponse.data[0]?.response;
                    if (finalResponseMsg === "ทำรายการสำเร็จ") {
                        toast.success("สำเร็จ!", {
                            description: `อัปโหลดข้อมูล ${totalItems} รายการเรียบร้อยแล้ว`,
                        });
                        onSuccess();
                        handleClose();
                    } else {
                        throw new Error(finalResponseMsg || "เกิดข้อผิดพลาด");
                    }
                }
            }
        } catch (error: any) {
            toast.error("เกิดข้อผิดพลาด",{
                description: error.message || "ไม่สามารถอัปโหลดข้อมูลได้",
            });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleClose = () => {
        setImportFile(null);
        setImportData([]);
        setValidationResult(null);
        setIsValidating(false);
        setIsUploading(false);
        setUploadProgress(0);
        setActiveTab("summary");
        onOpenChange(false);
    };

    const hasErrors = validationResult && (
        validationResult.duplicateCodes.length > 0 ||
        validationResult.invalidOwners.length > 0 ||
        validationResult.invalidBranches.length > 0 ||
        validationResult.invalidTypes.length > 0
    );

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
            />

            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-3xl! max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5" />
                            {isUploading ? "กำลังอัปโหลดข้อมูล" : "นำเข้าข้อมูลทรัพย์สิน"}
                        </DialogTitle>
                        <DialogDescription>
                            {importFile ? `ไฟล์: ${importFile.name}` : "เลือกไฟล์ Excel เพื่อนำเข้าข้อมูล"}
                        </DialogDescription>
                    </DialogHeader>

                    {isValidating ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">กำลังตรวจสอบข้อมูล...</p>
                        </div>
                    ) : isUploading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium">กำลังอัปโหลดข้อมูล {uploadProgress}%</p>
                            <Progress value={uploadProgress} className="w-full max-w-md" />
                            <p className="text-xs text-muted-foreground">กรุณาอย่าปิดหน้าต่างนี้</p>
                        </div>
                    ) : !importFile ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <FileSpreadsheet className="h-16 w-16 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">ยังไม่ได้เลือกไฟล์</p>
                            <Button onClick={() => fileInputRef.current?.click()}>
                                <Upload className="h-4 w-4 mr-2" />
                                เลือกไฟล์ Excel
                            </Button>
                        </div>
                    ) : validationResult ? (
                        <div className="flex-1 overflow-hidden flex flex-col">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div className="border rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                                        <span className="text-xs text-muted-foreground">ทั้งหมด</span>
                                    </div>
                                    <p className="text-2xl font-bold">{importData.length}</p>
                                </div>
                                <div className="border rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <span className="text-xs text-muted-foreground">ถูกต้อง</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600">{validationResult.valid.length}</p>
                                </div>
                                <div className="border rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <XCircle className="h-4 w-4 text-red-500" />
                                        <span className="text-xs text-muted-foreground">รหัสซ้ำ</span>
                                    </div>
                                    <p className="text-2xl font-bold text-red-600">{validationResult.duplicateCodes.length}</p>
                                </div>
                                <div className="border rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertCircle className="h-4 w-4 text-orange-500" />
                                        <span className="text-xs text-muted-foreground">ข้อผิดพลาด</span>
                                    </div>
                                    <p className="text-2xl font-bold text-orange-600">
                                        {validationResult.invalidOwners.length + 
                                         validationResult.invalidBranches.length + 
                                         validationResult.invalidTypes.length}
                                    </p>
                                </div>
                            </div>

                            {/* Tabs for details */}
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="summary">สรุป</TabsTrigger>
                                    <TabsTrigger value="valid" className="relative">
                                        ข้อมูลถูกต้อง
                                        {validationResult.valid.length > 0 && (
                                            <Badge variant="secondary" className="ml-1 h-5 px-1">
                                                {validationResult.valid.length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="duplicates" className="relative">
                                        รหัสซ้ำ
                                        {validationResult.duplicateCodes.length > 0 && (
                                            <Badge variant="destructive" className="ml-1 h-5 px-1">
                                                {validationResult.duplicateCodes.length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="other" className="relative">
                                        อื่นๆ
                                        {(validationResult.invalidBranches.length + validationResult.invalidTypes.length) > 0 && (
                                            <Badge variant="destructive" className="ml-1 h-5 px-1">
                                                {validationResult.invalidBranches.length + validationResult.invalidTypes.length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="summary" className="flex-1 overflow-auto mt-4">
                                    <div className="space-y-4">
                                        {hasErrors && (
                                            <Alert variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    พบข้อผิดพลาดในข้อมูล กรุณาตรวจสอบแท็บรายละเอียดเพื่อดูข้อมูลที่มีปัญหา
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {validationResult.valid.length > 0 && (
                                            <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                <AlertDescription className="text-green-800 dark:text-green-200">
                                                    มีข้อมูลที่ถูกต้อง {validationResult.valid.length} รายการ พร้อมสำหรับการอัปโหลด
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold">สรุปการตรวจสอบ</h4>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span>จำนวนข้อมูลทั้งหมด:</span>
                                                    <Badge variant="outline">{importData.length}</Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>ข้อมูลถูกต้อง:</span>
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        {validationResult.valid.length}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>รหัสซ้ำในระบบ:</span>
                                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                        {validationResult.duplicateCodes.length}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>รหัสผู้ถือครองไม่ถูกต้อง:</span>
                                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                        {validationResult.invalidOwners.length}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>รหัสสาขาไม่ถูกต้อง:</span>
                                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                        {validationResult.invalidBranches.length}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>ประเภททรัพย์สินไม่ถูกต้อง:</span>
                                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                        {validationResult.invalidTypes.length}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Debug Info
                                        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                                            <details className="text-xs">
                                                <summary className="cursor-pointer font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                                                    🔍 ข้อมูล Debug (สำหรับตรวจสอบปัญหา)
                                                </summary>
                                                <div className="mt-2 space-y-2 text-gray-600 dark:text-gray-400">
                                                    <div>
                                                        <strong>จำนวนข้อมูลในระบบ:</strong> {assets.length} รายการ
                                                    </div>
                                                    <div>
                                                        <strong>ตัวอย่างรหัสในระบบ (5 อันแรก):</strong>
                                                        <div className="mt-1 space-x-1">
                                                            {assets.slice(0, 5).map((a, i) => (
                                                                <Badge key={i} variant="outline" className="text-xs">
                                                                    {a.Code}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <strong>ตัวอย่างรหัสที่นำเข้า (5 อันแรก):</strong>
                                                        <div className="mt-1 space-x-1">
                                                            {importData.slice(0, 5).map((d, i) => (
                                                                <Badge key={i} variant="outline" className="text-xs">
                                                                    {d.Code}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </details>
                                        </div> */}
                                    </div>
                                </TabsContent>

                                <TabsContent value="valid" className="flex-1 overflow-hidden mt-4">
                                    <ScrollArea className="h-[400px]">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">#</TableHead>
                                                    <TableHead>รหัส</TableHead>
                                                    <TableHead>ชื่อ</TableHead>
                                                    <TableHead>ผู้ถือครอง</TableHead>
                                                    <TableHead>ประเภท</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {validationResult.valid.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell className="font-medium">{item.Code}</TableCell>
                                                        <TableCell>{item.Name}</TableCell>
                                                        <TableCell>{item.OwnerCode}</TableCell>
                                                        <TableCell>{item.TypeGroup}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </TabsContent>

                                <TabsContent value="duplicates" className="flex-1 overflow-hidden mt-4">
                                    <ScrollArea className="h-[400px]">
                                        {validationResult.duplicateCodes.length > 0 ? (
                                            <div className="space-y-2">
                                                <Alert variant="destructive">
                                                    <XCircle className="h-4 w-4" />
                                                    <AlertDescription>
                                                        รหัสทรัพย์สินเหล่านี้มีอยู่ในระบบแล้ว
                                                    </AlertDescription>
                                                </Alert>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {validationResult.duplicateCodes.map((code, index) => (
                                                        <Badge key={index} variant="destructive" className="justify-start">
                                                            {code}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-center text-muted-foreground py-8">ไม่พบรหัสซ้ำ</p>
                                        )}
                                    </ScrollArea>
                                </TabsContent>

                                <TabsContent value="owners" className="flex-1 overflow-hidden mt-4">
                                    <ScrollArea className="h-[400px]">
                                        {validationResult.invalidOwners.length > 0 ? (
                                            <div className="space-y-2">
                                                <Alert variant="destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertDescription>
                                                        ไม่พบรหัสผู้ถือครองเหล่านี้ในระบบ
                                                    </AlertDescription>
                                                </Alert>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {validationResult.invalidOwners.map((owner, index) => (
                                                        <Badge key={index} variant="destructive" className="justify-start">
                                                            {owner}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-center text-muted-foreground py-8">รหัสผู้ถือครองถูกต้องทั้งหมด</p>
                                        )}
                                    </ScrollArea>
                                </TabsContent>

                                <TabsContent value="other" className="flex-1 overflow-hidden mt-4">
                                    <ScrollArea className="h-[400px]">
                                        <div className="space-y-4">
                                            {validationResult.invalidBranches.length > 0 && (
                                                <div className="space-y-2">
                                                    <Alert variant="destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        <AlertDescription>
                                                            ไม่พบรหัสสาขาเหล่านี้ในระบบ
                                                        </AlertDescription>
                                                    </Alert>
                                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                                        {validationResult.invalidBranches.map((branch, index) => (
                                                            <Badge key={index} variant="destructive" className="justify-start">
                                                                {branch}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {validationResult.invalidTypes.length > 0 && (
                                                <div className="space-y-2">
                                                    <Alert variant="destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        <AlertDescription>
                                                            ไม่พบประเภททรัพย์สินเหล่านี้ในระบบ
                                                        </AlertDescription>
                                                    </Alert>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                        {validationResult.invalidTypes.map((type, index) => (
                                                            <Badge key={index} variant="destructive" className="justify-start">
                                                                {type}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {validationResult.invalidBranches.length === 0 && validationResult.invalidTypes.length === 0 && (
                                                <p className="text-center text-muted-foreground py-8">ไม่พบข้อผิดพลาดอื่นๆ</p>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>
                            </Tabs>
                        </div>
                    ) : null}

                    <DialogFooter className="gap-2">
                        {!isValidating && !isUploading && importFile && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    เลือกไฟล์ใหม่
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={handleUploadValidData}
                                    disabled={!validationResult?.valid.length || !!hasErrors}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    อัปโหลดข้อมูลที่ถูกต้อง ({validationResult?.valid.length || 0})
                                </Button>
                            </>
                        )}
                        <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                            {isUploading ? "กำลังอัปโหลด..." : "ปิด"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}