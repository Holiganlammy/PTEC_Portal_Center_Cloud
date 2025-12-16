"use client"

import React, { useState, useEffect } from 'react'
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
import Swal from 'sweetalert2'

dayjs.extend(utc)
dayjs.extend(timezone)

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const sbw_code = searchParams.get('code')
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserData[]>([])
  const [carInfoData, setCarInfoData] = useState<CarInfo[]>([])
  const [carInfoDataCompany, setCarInfoDataCompany] = useState<CarInfo[]>([])
  
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
  
  // Alert states
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
  
  // Dialog states
  const [openAddExpense, setOpenAddExpense] = useState(false)

  // Alert helper function
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

  //  ฟังก์ชันล้างรายการค่าใช้จ่าย
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
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถลบรายการค่าใช้จ่ายได้'
      })
      return false
    }
  }

  //  ฟังก์ชันตรวจสอบก่อนเพิ่มรายการ
  const handleAddExpenseClick = () => {
    // ตรวจสอบว่าเลือกประเภทรถแล้วหรือยัง
    if (smartBill_Withdraw.condition === null || smartBill_Withdraw.condition === undefined) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเลือกประเภทรถ',
        text: 'กรุณาเลือกประเภทการเดินทางก่อนเพิ่มรายการค่าใช้จ่าย',
        confirmButtonText: 'ตรวจสอบ'
      })
      return
    }

    //  ถ้าเป็นรถบริษัท (0) หรือรถส่วนตัว (1) ต้องมีทะเบียนรถ
    if ([0, 1].includes(smartBill_Withdraw.condition)) {
      if (!smartBill_Withdraw.car_infocode || smartBill_Withdraw.car_infocode.trim() === '') {
        Swal.fire({
          icon: 'warning',
          title: 'กรุณาเลือกทะเบียนรถ',
          text: 'กรุณาเลือกหมายเลขทะเบียนรถก่อนเพิ่มรายการค่าใช้จ่าย',
          confirmButtonText: 'ตรวจสอบ'
        })
        return
      }
    }

    //  ผ่านการตรวจสอบแล้ว เปิด dialog
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

  useEffect(() => {
    fetchData()
  }, [sbw_code])

  const calculateTotal = () => {
    if (!smartBill_WithdrawDtl.length) return 0
    const total = smartBill_WithdrawDtl.reduce((sum, item) => {
      return sum + (item.amouthAll || 0)
    }, 0)
    return total - (smartBill_Withdraw.pure_card || 0)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {alert.show && (
          <div className="fixed top-4 right-4 z-50 w-96">
            <Alert className={`
              ${alert.type === 'error' ? 'border-red-500 bg-red-50 text-red-800' : ''}
              ${alert.type === 'success' ? 'border-green-500 bg-green-50 text-green-800' : ''}
              ${alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50 text-yellow-800' : ''}
              ${alert.type === 'info' ? 'border-blue-500 bg-blue-50 text-blue-800' : ''}
              shadow-lg relative
            `}>
              <button
                onClick={() => setAlert(prev => ({ ...prev, show: false }))}
                className="absolute top-2 right-2 p-1 hover:bg-black/10 rounded"
              >
                <X className="h-4 w-4" />
              </button>
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          </div>
        )}
        
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!sbw_code) {
    return (
      <div className="container mx-auto py-8 px-4">
        {alert.show && (
          <div className="fixed top-4 right-4 z-50 w-96">
            <Alert className={`
              ${alert.type === 'error' ? 'border-red-500 bg-red-50 text-red-800' : ''}
              ${alert.type === 'success' ? 'border-green-500 bg-green-50 text-green-800' : ''}
              ${alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50 text-yellow-800' : ''}
              ${alert.type === 'info' ? 'border-blue-500 bg-blue-50 text-blue-800' : ''}
              shadow-lg relative
            `}>
              <button
                onClick={() => setAlert(prev => ({ ...prev, show: false }))}
                className="absolute top-2 right-2 p-1 hover:bg-black/10 rounded"
              >
                <X className="h-4 w-4" />
              </button>
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          </div>
        )}
        
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <PaymentHeader 
            smartBill_Withdraw={smartBill_Withdraw}
            setSmartBill_Withdraw={setSmartBill_Withdraw}
            sbw_code={null}
          />
          
          <Separator className="my-6" />
          
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
          
          <Separator className="my-6" />
          
          <div className="flex justify-center">
            <Button 
              onClick={handleSave}
              size="lg"
              className="px-8"
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
        <div className="fixed top-4 right-4 z-50 w-96">
          <Alert className={`
            ${alert.type === 'error' ? 'border-red-500 bg-red-50 text-red-800' : ''}
            ${alert.type === 'success' ? 'border-green-500 bg-green-50 text-green-800' : ''}
            ${alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50 text-yellow-800' : ''}
            ${alert.type === 'info' ? 'border-blue-500 bg-blue-50 text-blue-800' : ''}
            shadow-lg relative
          `}>
            <button
              onClick={() => setAlert(prev => ({ ...prev, show: false }))}
              className="absolute top-2 right-2 p-1 hover:bg-black/10 rounded"
            >
              <X className="h-4 w-4" />
            </button>
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex gap-3 mb-6">
          <Button 
            variant="outline"
            onClick={() => handleSubmitUpdate()}
            disabled={smartBill_Withdraw.lock_status}
            className="bg-amber-500 hover:bg-amber-600 text-white border-0"
          >
            Save Update
          </Button>
          <Button 
            onClick={() => handleSubmitUpdate('lock')}
            disabled={smartBill_Withdraw.lock_status}
          >
            Save Lock
          </Button>
          <Button 
            variant="destructive"
            onClick={() => handleSubmitUpdate('unlock')}
            disabled={!smartBill_Withdraw.lock_status}
          >
            UnLock Save
          </Button>
        </div>

        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
          <PaymentHeader 
            smartBill_Withdraw={smartBill_Withdraw}
            setSmartBill_Withdraw={setSmartBill_Withdraw}
            sbw_code={sbw_code}
          />
          
          <Separator className="my-6" />
          
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
          
          <Separator className="my-6" />
          
          {/* ✅ ปุ่มเพิ่มรายการ - มี validation */}
          {!smartBill_Withdraw.lock_status && (
            <Button 
              onClick={handleAddExpenseClick} // ✅ เปลี่ยนจาก setOpenAddExpense(true)
              variant="outline"
              className="w-full mb-4"
            >
              เพิ่มรายการ
            </Button>
          )}
          
          <ExpenseTable 
            smartBill_WithdrawDtl={smartBill_WithdrawDtl}
            smartBill_Withdraw={smartBill_Withdraw}
            fetchData={fetchData}
          />
          
          <Separator className="my-6" />
          
          <SummarySection 
            smartBill_Withdraw={smartBill_Withdraw}
            setSmartBill_Withdraw={setSmartBill_Withdraw}
            totalAmount={calculateTotal()}
          />
        </Card>

        <AddExpenseDialog 
          open={openAddExpense}
          onOpenChange={setOpenAddExpense}
          smartBill_Withdraw={smartBill_Withdraw}
          fetchData={fetchData}
          sbw_code={sbw_code || ''}
        />
      </div>
    </div>
  )
}