"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, MapPin, Gauge, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import dayjs from 'dayjs'
import axios from 'axios'
import Swal from 'sweetalert2'
import client from '@/lib/axios/interceptors'

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  smartBill_Withdraw: any
  fetchData: () => void
  sbw_code: string
}

export default function AddExpenseDialog({
  open,
  onOpenChange,
  smartBill_Withdraw,
  fetchData,
  sbw_code
}: AddExpenseDialogProps) {
  const [mode, setMode] = useState<'smartcar' | 'manual'>('smartcar')
  const [operations, setOperations] = useState<any[]>([])
  const [selectedOperation, setSelectedOperation] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    sbw_code: smartBill_Withdraw.sbw_code,
    sb_operationid: '',
    ownercode: smartBill_Withdraw.ownercode,
    car_infocode: smartBill_Withdraw.car_infocode,
    remark: '',
    sbwdtl_operationid_startdate: new Date(),
    sbwdtl_operationid_enddate: new Date(),
    sbwdtl_operationid_startmile: '',
    sbwdtl_operationid_endmile: ''
  })

  useEffect(() => {
    if (open && mode === 'smartcar') {
      loadOperations()
    }
  }, [open, mode])

  const loadOperations = async () => {
    try {
      const body = { 
        car_infocode: smartBill_Withdraw.car_infocode || null 
      }
      const response = await client.post('/SmartBill_Withdraw_Addrow', body)
      setOperations(response.data || [])
    } catch (error) {
      console.error('Error loading operations:', error)
      setOperations([])
    }
  }

  const handleOperationSelect = (operation: any) => {
    setSelectedOperation(operation)
    setFormData({
      ...formData,
      sb_operationid: operation.sb_operationid,
      sbwdtl_operationid_startdate: new Date(operation.sb_operationid_startdate),
      sbwdtl_operationid_enddate: new Date(operation.sb_operationid_enddate),
      sbwdtl_operationid_startmile: operation.sb_operationid_startmile,
      sbwdtl_operationid_endmile: operation.sb_operationid_endmile,
      remark: operation.sb_operationid_location
    })
  }

  const handleSave = async () => {
    // Validation
    if (!formData.remark) {
      Swal.fire('Warning', 'Please enter activity description', 'warning')
      return
    }

    if (!formData.sbwdtl_operationid_startmile || !formData.sbwdtl_operationid_endmile) {
      Swal.fire('Warning', 'Please enter start and end mileage', 'warning')
      return
    }

    console.log('Current smartBill_Withdraw data:', smartBill_Withdraw)
    console.log('car_infoid:', smartBill_Withdraw.car_infoid)
    console.log('car_infocode:', smartBill_Withdraw.car_infocode)

    try {
      const body = {
        sbw_code: sbw_code,
        sb_operationid: mode === 'smartcar' ? formData.sb_operationid : '',
        ownercode: smartBill_Withdraw.ownercode,
        car_infocode: smartBill_Withdraw.car_infocode,
        car_infoid: smartBill_Withdraw.car_infoid || null, // เพิ่มนี้
        remark: formData.remark,
        sbwdtl_operationid_startdate: dayjs(formData.sbwdtl_operationid_startdate).format('YYYY-MM-DD HH:mm:ss'),
        sbwdtl_operationid_enddate: dayjs(formData.sbwdtl_operationid_enddate).format('YYYY-MM-DD HH:mm:ss'),
        sbwdtl_operationid_startmile: parseFloat(formData.sbwdtl_operationid_startmile),
        sbwdtl_operationid_endmile: parseFloat(formData.sbwdtl_operationid_endmile)
      }

      console.log('Sending body to API:', body)
      await client.post('/SmartBill_Withdraw_AddrowDtl', body)
      
      Swal.fire('Success', 'Activity added successfully', 'success')
      onOpenChange(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving:', error)
      Swal.fire('Error', 'Unable to add activity', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      sbw_code: smartBill_Withdraw.sbw_code,
      sb_operationid: '',
      ownercode: smartBill_Withdraw.ownercode,
      car_infocode: smartBill_Withdraw.car_infocode,
      remark: '',
      sbwdtl_operationid_startdate: new Date(),
      sbwdtl_operationid_enddate: new Date(),
      sbwdtl_operationid_startmile: '',
      sbwdtl_operationid_endmile: ''
    })
    setSelectedOperation(null)
    setMode('smartcar')
  }

  const calculateDistance = () => {
    const start = parseFloat(formData.sbwdtl_operationid_startmile) || 0
    const end = parseFloat(formData.sbwdtl_operationid_endmile) || 0
    return Math.max(0, end - start)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Add Travel/Activity Entry</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Entry Mode</Label>
            <RadioGroup value={mode} onValueChange={(value: any) => setMode(value)}>
              <div className="grid grid-cols-2 gap-3">
                <label className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${mode === 'smartcar' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }
                `}>
                  <RadioGroupItem value="smartcar" id="smartcar" />
                  <div className="flex-1">
                    <span className="font-medium text-sm">From SmartCar</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Select existing records
                    </p>
                  </div>
                </label>
                
                <label className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${mode === 'manual' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }
                `}>
                  <RadioGroupItem value="manual" id="manual" />
                  <div className="flex-1">
                    <span className="font-medium text-sm">Create New</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Enter details manually
                    </p>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* SmartCar Selection */}
          {mode === 'smartcar' && (
            <div className="space-y-3">
              <Label>Select Operation from SmartCar</Label>
              {operations.length > 0 ? (
                <Select 
                  value={selectedOperation?.sb_operationid} 
                  onValueChange={(value) => {
                    const op = operations.find(o => o.sb_operationid === value)
                    if (op) handleOperationSelect(op)
                  }}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder="Select an operation" />
                  </SelectTrigger>
                  <SelectContent>
                    {operations.map((op) => (
                      <SelectItem key={op.sb_operationid} value={op.sb_operationid}>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">[{op.createby}] [{op.sb_code}]</span>
                          <span className="text-xs text-slate-500">{op.sb_operationid_location}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    No operations available from SmartCar for this vehicle
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={mode === 'smartcar' && !selectedOperation}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.sbwdtl_operationid_startdate, 'dd/MM/yyyy HH:mm')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.sbwdtl_operationid_startdate}
                    onSelect={(date) => date && setFormData({...formData, sbwdtl_operationid_startdate: date})}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={mode === 'smartcar' && !selectedOperation}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.sbwdtl_operationid_enddate, 'dd/MM/yyyy HH:mm')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.sbwdtl_operationid_enddate}
                    onSelect={(date) => date && setFormData({...formData, sbwdtl_operationid_enddate: date})}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Mileage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Mileage (km)</Label>
              <div className="relative">
                <Gauge className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="number"
                  value={formData.sbwdtl_operationid_startmile}
                  onChange={(e) => setFormData({...formData, sbwdtl_operationid_startmile: e.target.value})}
                  disabled={mode === 'smartcar' && !selectedOperation}
                  className="pl-10"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>End Mileage (km)</Label>
              <div className="relative">
                <Gauge className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="number"
                  value={formData.sbwdtl_operationid_endmile}
                  onChange={(e) => setFormData({...formData, sbwdtl_operationid_endmile: e.target.value})}
                  disabled={mode === 'smartcar' && !selectedOperation}
                  className="pl-10"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Distance Badge */}
          {(formData.sbwdtl_operationid_startmile && formData.sbwdtl_operationid_endmile) && (
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="text-base px-4 py-2">
                Distance: {calculateDistance().toLocaleString()} km
              </Badge>
            </div>
          )}

          {/* Activity Description */}
          {mode === 'manual' && (
            <div className="space-y-2">
              <Label>Activity Description *</Label>
              <Textarea
                value={formData.remark}
                onChange={(e) => setFormData({...formData, remark: e.target.value})}
                placeholder="Enter activity or destination details"
                rows={4}
                className="resize-none"
              />
            </div>
          )}

          {/* Info Card */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-2">Important Notes:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Enter accurate start and end mileage for proper calculation</li>
                  <li>• Dates should match your actual travel period</li>
                  <li>• Activity description will appear in the expense report</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={mode === 'smartcar' && !selectedOperation}
          >
            Add Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}