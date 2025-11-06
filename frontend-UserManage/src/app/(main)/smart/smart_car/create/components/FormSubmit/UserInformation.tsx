'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { UserData, SmartBillHeader } from '../../service/type/types';

interface UserInformationProps {
  users: UserData[];
  smartBillHeader: SmartBillHeader;
  onHeaderChange: (header: SmartBillHeader) => void;
}

export default function UserInformation({ users, smartBillHeader, onHeaderChange }: UserInformationProps) {
  const updateHeader = (field: keyof SmartBillHeader, value: any) => {
    onHeaderChange({
      ...smartBillHeader,
      [field]: value
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">
          ผู้ทำรายการ <span className="text-red-500">*</span>
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between"
            >
              {smartBillHeader.usercode
                ? users.find((user) => user.UserCode === smartBillHeader.usercode)
                  ? `${smartBillHeader.usercode} - ${smartBillHeader.sb_fristName} ${smartBillHeader.sb_lastName}`
                  : smartBillHeader.usercode
                : "เลือกหรือพิมพ์รหัสผู้ใช้"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="ค้นหาผู้ใช้..." />
              <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto">
                {users.map((user) => (
                  <CommandItem
                    key={user.UserCode}
                    value={`${user.UserCode} ${user.fristName} ${user.lastName}`}
                    onSelect={() => {
                      onHeaderChange({
                        ...smartBillHeader,
                        usercode: user.UserCode,
                        sb_fristName: user.fristName,
                        sb_lastName: user.lastName
                      });
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        smartBillHeader.usercode === user.UserCode
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {user.UserCode} - {user.fristName} {user.lastName}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">
          ชื่อจริง <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          value={smartBillHeader.sb_fristName}
          onChange={(e) => updateHeader('sb_fristName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          placeholder="ชื่อจริง"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">
          นามสกุล <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          value={smartBillHeader.sb_lastName}
          onChange={(e) => updateHeader('sb_lastName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          placeholder="นามสกุล"
        />
      </div>
    </div>
  );
}