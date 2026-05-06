"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { X } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'

import PaymentHeader from './components/payment/PaymentHeader'
import VehicleSelection from './components/payment/VehicleSelection'
import ExpenseTable from './components/payment/ExpenseTable'
import SummarySection from './components/payment/SummarySection'
import AddExpenseDialog from './components/dialog/AddExpenseDialog'

import client from '@/lib/axios/interceptors'
import { CarInfo } from '../../smart_car/create/service/type/types'
import { useSession } from 'next-auth/react'
import { Label } from '@/components/ui/label'
import WarningDialog from './components/AlertDialog/wanningdialog'
import ErrorDialog from './components/AlertDialog/errorDialog'
import { set } from 'date-fns'

dayjs.extend(utc)
dayjs.extend(timezone)

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const sbw_code = searchParams.get('code')
  const { data: session } = useSession()
  
  const scrollPositionRef = useRef(0)
  
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserData[]>([])
  const [carInfoData, setCarInfoData] = useState<CarInfo[]>([])
  const [carInfoDataCompany, setCarInfoDataCompany] = useState<CarInfo[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const [smartBill_Withdraw, setSmartBill_Withdraw] = useState<smartBill_Withdraw>({
    sbw_id: null,
    sbw_code: null,
    ownercode: session?.user?.UserCode ?? null,
    depcode: null,
    seccode: null,
    statusid: null,
    car_infoid: null,
    createby: null,
    createdate: null,
    Name: null,
    UserCode: null,
    car_infocode: null,
    car_band: null,
    car_tier: null,
    car_color: null,
    car_paytype: null,
    pure_card: null,
    lock_status: false,
    typePay: "PTEC",
    condition: null,
    car_payname: null,
    ownerid: null,
  })

  const [carInfo, setCarInfo] = useState<CarInfo>({
    car_infocode: '',
    car_infostatus_companny: false,
    car_categaryid: 0,
    car_typeid: 0,
    car_band: '',
    car_tier: '',
    car_color: '',
    car_remarks: '',
    car_payname: undefined,
  })

  const [smartBill_WithdrawDtl, setSmartBill_WithdrawDtl] = useState<smartBill_Withdraw_Detail[]>([])
  const [smartBill_WithdrawHeader, setSmartBill_WithdrawHeader] = useState<smartBill_Withdraw_Header[]>([])
  
  const [alert, setAlert] = useState<{
    show: boolean
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
  }>({
    show: false,
    type: 'info',
    title: '',
    message: ''
  })
  
  const [openAddExpense, setOpenAddExpense] = useState(false)
  const [openWarningDialog, setOpenWarningDialog] = useState(false)
  const [warningTitle, setWarningTitle] = useState('')
  const [warningDescription, setWarningDescription] = useState('')
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorDialogTitle, setErrorDialogTitle] = useState('')
  const [errorDialogDescription, setErrorDialogDescription] = useState('')

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlert({
      show: true,
      type,
      title,
      message
    })
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }))
    }, 5000)
  }

  const handleClearExpenses = async () => {
    if (smartBill_WithdrawDtl.length === 0) {
      return true
    }

    try {
      const deletePromises = smartBill_WithdrawDtl.map(item => 
        client.post('/SmartBill_WithdrawDtl_Delete', { 
          sbwdtl_id: item.sbwdtl_id 
        })
      )
      
      await Promise.all(deletePromises)
      setSmartBill_WithdrawDtl([])
      
      return true
    } catch (error) {
      console.error('❌ Error clearing expenses:', error)
      setErrorDialogTitle('เกิดข้อผิดพลาด')
      setErrorDialogDescription('ไม่สามารถลบรายการค่าใช้จ่ายได้')
      setErrorDialogOpen(true)
      return false
    }
  }

  const handleAddExpenseClick = () => {
    if (smartBill_Withdraw.condition === null || smartBill_Withdraw.condition === undefined) {
      setWarningTitle('กรุณาเลือกประเภทรถ')
      setWarningDescription('กรุณาเลือกประเภทการเดินทางก่อนเพิ่มรายการค่าใช้จ่าย')
      setOpenWarningDialog(true)
      return
    }

    if ([0, 1].includes(smartBill_Withdraw.condition)) {
      if (!smartBill_Withdraw.car_infocode || smartBill_Withdraw.car_infocode.trim() === '') {
        setWarningTitle('กรุณาใส่เลขทะเบียนรถ')
        setWarningDescription('กรุณาใส่เลขทะเบียนรถก่อนเพิ่มรายการค่าใช้จ่าย')
        setOpenWarningDialog(true)
        return
      }
    }

    setOpenAddExpense(true)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await client.get('/getsUserForAssetsControl')
      setUsers(response.data.data || [])
      setCarInfoData([])
      setCarInfoDataCompany([])
      
      if (sbw_code) {
        const billRes = await client.post('/SmartBill_Withdraw_SelectAllForms', { sbw_code })
        
        if (billRes.data[0] && billRes.data[0].length > 0) {
          const headerData = billRes.data[0][0]
          
          setSmartBill_Withdraw(headerData)
          setSmartBill_WithdrawHeader(billRes.data[0] || [])
          setSmartBill_WithdrawDtl(billRes.data[1] || [])
          
          if (headerData.car_infocode) {
            try {
              const carRes = await client.post('/SmartBill_CarInfoSearch', { 
                car_infocode: headerData.car_infocode 
              })
              
              if (carRes.data && carRes.data.length > 0) {
                if (headerData.condition === 0) {
                  setCarInfoDataCompany(carRes.data)
                } else if (headerData.condition === 1) {
                  setCarInfoData(carRes.data)
                }
                
                const selectedCar = carRes.data.find((car: CarInfo) => car.car_infocode === headerData.car_infocode)
                if (selectedCar) {
                  setCarInfo(selectedCar)
                }
              } else {
                showAlert('warning', 'แจ้งเตือน', 'ไม่พบข้อมูลรถ')
              }
            } catch (carError) {
              showAlert('error', 'Error', 'Failed to fetch car data')
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      showAlert('error', 'Error', 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const fetchDataSilent = async () => {
    try {
      setIsRefreshing(true) // ไม่ใช้ setLoading
      
      if (sbw_code) {
        const billRes = await client.post('/SmartBill_Withdraw_SelectAllForms', { sbw_code })
        
        if (billRes.data[0] && billRes.data[0].length > 0) {
          const headerData = billRes.data[0][0]
          
          setSmartBill_Withdraw(headerData)
          setSmartBill_WithdrawHeader(billRes.data[0] || [])
          setSmartBill_WithdrawDtl(billRes.data[1] || []) //  อัพเดตข้อมูล
          
          if (headerData.car_infocode) {
            try {
              const carRes = await client.post('/SmartBill_CarInfoSearch', { 
                car_infocode: headerData.car_infocode 
              })
              
              if (carRes.data && carRes.data.length > 0) {
                if (headerData.condition === 0) {
                  setCarInfoDataCompany(carRes.data)
                } else if (headerData.condition === 1) {
                  setCarInfoData(carRes.data)
                }
                
                const selectedCar = carRes.data.find((car: CarInfo) => car.car_infocode === headerData.car_infocode)
                if (selectedCar) {
                  setCarInfo(selectedCar)
                }
              }
            } catch (carError) {
              console.error('Error loading car data:', carError)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [sbw_code])

  const handleSaveSuccess = () => {
    scrollPositionRef.current = window.scrollY
    
    fetchDataSilent().then(() => {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'instant',
        })
      })
    })
  }

  const calculateActualTotal = () => {
    if (!smartBill_WithdrawDtl.length) return 0
    
    return smartBill_WithdrawDtl.reduce((sum, item) => {
      if (item.sb_paystatus === false) return sum
      let amouthActual = 0
      if (item.car_infostatus_companny === true) {
        if (smartBill_WithdrawHeader?.[0]?.car_paytype === 0) {
          const itemTotal = parseFloat(item.amouthAll?.toString() || '0') || 0
          return sum + itemTotal
        } else {
          amouthActual = parseFloat(item.amouthTrueOil?.toString() || '0') || 0
        }
      }
      else if (item.car_infostatus_companny === false) {
        const itemTotal = parseFloat(item.amouthAll?.toString() || '0') || 0
        return sum + itemTotal
      }
      
      const allowance = parseFloat(item.amouthAllowance?.toString() || '0') || 0
      const hotel = parseFloat(item.amouthHotel?.toString() || '0') || 0
      const toll = parseFloat(item.amouthRush?.toString() || '0') || 0
      const other = parseFloat(item.amouthother?.toString() || '0') || 0
      
      const totalForThisItem = amouthActual + allowance + hotel + toll + other
      
      return sum + totalForThisItem
    }, 0)
  }

  const handleSave = async () => {
    try {
      if (smartBill_Withdraw.condition === null || smartBill_Withdraw.condition === undefined) {
        showAlert('warning', 'แจ้งเตือน', 'กรุณาเลือกประเภทการเดินทาง')
        return
      }

      if ([0, 1].includes(smartBill_Withdraw.condition) && !smartBill_Withdraw.car_infocode) {
        showAlert('warning', 'แจ้งเตือน', 'กรุณาใส่เลขทะเบียนรถ')
        return
      }
      
      const response = await client.post('/SmartBill_Withdraw_Save', smartBill_Withdraw)
      if (response.data[0]?.code) {
        window.location.href = `/smart/smart_bill/create?code=${response.data[0].code}`
      }
    } catch (error) {
      showAlert('error', 'Error', 'Failed to save')
    }
  }

  const handleSubmitUpdate = async (lockAction?: 'lock' | 'unlock') => {
    try {
      const payload: {
        car_infocode: string;
        condition: number | null | undefined;
        purecard: number | null;
        sbw_code: string;
        typePay: string;
        usercode: string;
        lock_status?: number;
      } = {
        car_infocode: smartBill_Withdraw.car_infocode || '',
        condition: smartBill_Withdraw.condition,
        purecard: smartBill_Withdraw.pure_card || null,
        sbw_code: smartBill_Withdraw.sbw_code || '',
        typePay: smartBill_Withdraw.typePay || '',
        usercode: session?.user?.UserCode || ''
      }

      if (lockAction === 'lock') {
        payload.lock_status = 1
      } else if (lockAction === 'unlock') {
        payload.lock_status = 0
      }
      
      const response = await client.post('/SmartBill_Withdraw_updateSBW', payload)
      
      if (response.data[0].status === 'success') {
        let successMessage = 'อัปเดตข้อมูลเรียบร้อย'
        if (lockAction === 'lock') {
          successMessage = 'ล็อครายการสำเร็จ'
        } else if (lockAction === 'unlock') {
          successMessage = 'ปลดล็อครายการสำเร็จ'
        }
        
        showAlert('success', 'สำเร็จ', successMessage)
        await fetchData()
      } else if (lockAction === 'unlock' && response.data?.includes('กรุณายกเลิก')) {
        showAlert('error', 'แจ้งเตือน', response.data)
      }
      
    } catch (error: any) {
      console.error('❌ Update Error:', error)
      console.error('❌ Error Response:', error.response?.data)
      
      let errorMessage = 'Failed to update'
      if (lockAction === 'lock') {
        errorMessage = 'Failed to lock'
      } else if (lockAction === 'unlock') {
        errorMessage = 'Failed to unlock'
      }
      
      showAlert('error', 'Error', error.response?.data || errorMessage)
    }
  }
  useEffect(() => {
    if (!sbw_code) {
      console.log('🔄 No code - clearing vehicle state...')
      
      // เคลียร์ข้อมูลรถ
      setCarInfo({
        car_infocode: '',
        car_infostatus_companny: false,
        car_categaryid: 0,
        car_typeid: 0,
        car_band: '',
        car_tier: '',
        car_color: '',
        car_remarks: '',
        car_payname: undefined,
      })
      
      // เคลียร์รายการรถ
      setCarInfoData([])
      setCarInfoDataCompany([])
      
      //  เคลียร์ smartBill_Withdraw
      setSmartBill_Withdraw(prev => ({
        ...prev,
        condition: null,
        car_infocode: null,
        car_infoid: null
      }))
      
      console.log(' Cleared all vehicle state')
    }
  }, [sbw_code])
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {alert.show && (
          <div className="fixed top-4 right-4 z-50 w-80 sm:w-96">
            <Alert className={`
              ${alert.type === 'error' ? 'border-red-500 bg-red-50 text-red-800' : ''}
              ${alert.type === 'success' ? 'border-green-500 bg-green-50 text-green-800' : ''}
              ${alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50 text-yellow-800' : ''}
              ${alert.type === 'info' ? 'border-blue-500 bg-blue-50 text-blue-800' : ''}
              shadow-lg relative text-sm
            `}>
              <button
                onClick={() => setAlert(prev => ({ ...prev, show: false }))}
                className="absolute top-2 right-2 p-1 hover:bg-black/10 rounded"
              >
                <X className="h-4 w-4" />
              </button>
              <AlertTitle className="text-sm font-semibold">{alert.title}</AlertTitle>
              <AlertDescription className="text-xs">{alert.message}</AlertDescription>
            </Alert>
          </div>
        )}
        
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
          <p className="text-base sm:text-lg font-medium text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!sbw_code) {
    return (
      <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
        {alert.show && (
          <div className="fixed top-4 right-4 z-50 w-80 sm:w-96">
            <Alert className={`
              ${alert.type === 'error' ? 'border-red-500 bg-red-50 text-red-800' : ''}
              ${alert.type === 'success' ? 'border-green-500 bg-green-50 text-green-800' : ''}
              ${alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50 text-yellow-800' : ''}
              ${alert.type === 'info' ? 'border-blue-500 bg-blue-50 text-blue-800' : ''}
              shadow-lg relative text-sm
            `}>
              <button
                onClick={() => setAlert(prev => ({ ...prev, show: false }))}
                className="absolute top-2 right-2 p-1 hover:bg-black/10 rounded"
              >
                <X className="h-4 w-4" />
              </button>
              <AlertTitle className="text-sm font-semibold">{alert.title}</AlertTitle>
              <AlertDescription className="text-xs">{alert.message}</AlertDescription>
            </Alert>
          </div>
        )}
        
        <Card className="p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <PaymentHeader 
            smartBill_Withdraw={smartBill_Withdraw}
            setSmartBill_Withdraw={setSmartBill_Withdraw}
            sbw_code={null}
          />
          {sbw_code &&
            <Separator className="my-4 sm:my-5 lg:my-6" />
          }
          <VehicleSelection
            smartBill_Withdraw={smartBill_Withdraw}
            setSmartBill_Withdraw={setSmartBill_Withdraw}
            carInfo={carInfo}
            setCarInfo={setCarInfo}
            carInfoData={carInfoData}
            setCarInfoData={setCarInfoData}
            carInfoDataCompany={carInfoDataCompany}
            setCarInfoDataCompany={setCarInfoDataCompany}
            users={users}
            onClearExpenses={handleClearExpenses}
          />
          
          <Separator className="my-4 sm:my-5 lg:my-6" />
          
          <div className="flex justify-center">
            <Button 
              onClick={handleSave}
              size="lg"
              className="px-6 sm:px-8 text-sm sm:text-md"
              disabled={smartBill_Withdraw.condition === null}
            >
              สร้างบิล
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {alert.show && (
        <div className="fixed top-4 right-4 z-50 w-80 sm:w-96">
          <Alert className={`
            ${alert.type === 'error' ? 'border-red-500 bg-red-50 text-red-800' : ''}
            ${alert.type === 'success' ? 'border-green-500 bg-green-50 text-green-800' : ''}
            ${alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50 text-yellow-800' : ''}
            ${alert.type === 'info' ? 'border-blue-500 bg-blue-50 text-blue-800' : ''}
            shadow-lg relative text-sm
          `}>
            <button
              onClick={() => setAlert(prev => ({ ...prev, show: false }))}
              className="absolute top-2 right-2 p-1 hover:bg-black/10 rounded"
            >
              <X className="h-4 w-4" />
            </button>
            <AlertTitle className="text-sm font-semibold">{alert.title}</AlertTitle>
            <AlertDescription className="text-xs">{alert.message}</AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto py-3 sm:py-4 md:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-6">
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Button 
            variant="outline"
            onClick={() => handleSubmitUpdate()}
            disabled={smartBill_Withdraw.lock_status}
            className="bg-amber-500 hover:bg-amber-600 text-white border-0 text-xs sm:text-sm h-9 sm:h-10"
          >
            Save Update
          </Button>
          <Button 
            onClick={() => handleSubmitUpdate('lock')}
            disabled={smartBill_Withdraw.lock_status}
            className="text-xs sm:text-sm h-9 sm:h-10"
          >
            Save Lock
          </Button>
          <Button 
            variant="destructive"
            onClick={() => handleSubmitUpdate('unlock')}
            disabled={!smartBill_Withdraw.lock_status}
            className="text-xs sm:text-sm h-9 sm:h-10"
          >
            UnLock Save
          </Button>
        </div>

        <Card className="p-3 sm:p-4 md:p-5 lg:p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
          <PaymentHeader 
            smartBill_Withdraw={smartBill_Withdraw}
            setSmartBill_Withdraw={setSmartBill_Withdraw}
            sbw_code={sbw_code}
          />
          
          <VehicleSelection
            smartBill_Withdraw={smartBill_Withdraw}
            setSmartBill_Withdraw={setSmartBill_Withdraw}
            carInfo={carInfo}
            setCarInfo={setCarInfo}
            carInfoData={carInfoData}
            setCarInfoData={setCarInfoData}
            carInfoDataCompany={carInfoDataCompany}
            setCarInfoDataCompany={setCarInfoDataCompany}
            users={users}
            onClearExpenses={handleClearExpenses}
          />
          
          <Separator className="my-4 sm:my-5 lg:my-6" />
          
          {!smartBill_Withdraw.lock_status && (
            <Button 
              onClick={handleAddExpenseClick}
              variant="outline"
              className="w-full mb-3 sm:mb-4 text-red-600 border-red-600 hover:bg-red-600 hover:text-white font-bold text-xs sm:text-sm h-9 sm:h-10"
            >
              เพิ่มรายการค่าใช้จ่ายที่ต้องการเบิก
            </Button>
          )}
          
          <Label className='text-red-500 font-bold text-xs sm:text-sm block mb-3 sm:mb-4'>
            หมายเหตุ: หากต้องการเพิ่มรายการค่าใช้จ่าย กรุณาตรวจสอบให้แน่ใจว่าได้เลือกประเภทรถและทะเบียนรถเรียบร้อยแล้ว และกด ปุ่มเพิ่มรายการ ด้านบนนี้
          </Label>
          
          <ExpenseTable 
            smartBill_WithdrawDtl={smartBill_WithdrawDtl}
            smartBill_Withdraw={smartBill_Withdraw}
            smartBill_WithdrawHeader={smartBill_WithdrawHeader}
            fetchData={fetchData}
            onSaveSuccess={handleSaveSuccess}
          />
          
          <Separator className="my-4 sm:my-5 lg:my-6" />

          <SummarySection 
            smartBill_Withdraw={smartBill_Withdraw}
            setSmartBill_Withdraw={setSmartBill_Withdraw}
            totalAmount={calculateActualTotal()}
          />
        </Card>

        <AddExpenseDialog 
          open={openAddExpense}
          onOpenChange={setOpenAddExpense}
          smartBill_Withdraw={smartBill_Withdraw}
          onSaveSuccess={handleSaveSuccess}
          sbw_code={sbw_code || ''}
        />

        <WarningDialog
          open={openWarningDialog}
          onOpenChange={setOpenWarningDialog}
          title={warningTitle}
          description={warningDescription}
        />

        <ErrorDialog
          open={errorDialogOpen}
          onOpenChange={setErrorDialogOpen}
          title={errorDialogTitle}
          description={errorDialogDescription}
        />
      </div>
    </div>
  )
}