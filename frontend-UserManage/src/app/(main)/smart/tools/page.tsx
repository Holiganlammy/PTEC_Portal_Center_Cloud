"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { 
  BookOpen, 
  Play, 
  FileText, 
  Video, 
  ChevronRight,
  ExternalLink,
  Download,
  Search
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface VideoGuide {
  id: string
  title: string
  description: string
  youtubeId: string
  duration: string
  category: string
}

interface DocumentSection {
  id: string
  title: string
  description: string
  content: string[]
  category: string
}

export default function ToolDocumentationPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  // ข้อมูล Video Guides
  const videoGuides: VideoGuide[] = [
    {
      id: 'v1',
      title: 'การสร้างเอกสาร SmartBill / SmartBill',
      description: 'วิธีการเริ่มต้นใช้งานระบบ SmartBill สำหรับผู้ใช้งานใหม่',
      youtubeId: 'YKdQ_r2yyA0',
      duration: '14:49',
      category: 'เริ่มต้นใช้งาน'
    },
    {
      id: 'v4',
      title: 'การอนุมัติรายการ',
      description: 'ขั้นตอนการอนุมัติรายการเบิกจ่ายสำหรับผู้จัดการ',
      youtubeId: 'Gnm9GsP5_aE',
      duration: '3:21',
      category: 'การอนุมัติ'
    }
  ]

  // ข้อมูลเอกสาร
  const documents: DocumentSection[] = [
    {
      id: 'd1',
      title: 'การเริ่มต้นใช้งาน',
      description: 'คู่มือเริ่มต้นสำหรับผู้ใช้งานใหม่',
      category: 'เริ่มต้นใช้งาน',
      content: [
        'ขั้นตอนการเข้าสู่ระบบ',
        'การตั้งค่าบัญชีผู้ใช้',
        'ภาพรวมเมนูหลัก',
        'การนำทางในระบบ'
      ]
    },
    {
      id: 'd2',
      title: 'การเบิกค่าเบี้ยเลี้ยง',
      description: 'คู่มือการเบิกค่าเบี้ยเลี้ยงแบบละเอียด',
      category: 'การเบิกจ่าย',
      content: [
        'เงื่อนไขการเบิกค่าเบี้ยเลี้ยง',
        'การคำนวณจำนวนวัน',
        'การหักค่าอาหาร',
        'การส่งขออนุมัติ'
      ]
    },
    {
      id: 'd3',
      title: 'การจัดการค่าที่พัก',
      description: 'วิธีการจัดการค่าที่พักและผู้เข้าพัก',
      category: 'การเบิกจ่าย',
      content: [
        'การเพิ่มรายการที่พัก',
        'การระบุผู้เข้าพัก',
        'การคำนวณค่าที่พัก',
        'เงื่อนไขการเบิกจ่าย'
      ]
    },
    {
      id: 'd4',
      title: 'FAQ - คำถามที่พบบ่อย',
      description: 'คำตอบสำหรับคำถามที่พบบ่อย',
      category: 'อื่นๆ',
      content: [
        'ลืมรหัสผ่านทำอย่างไร?',
        'แก้ไขรายการที่ส่งไปแล้วได้หรือไม่?',
        'ติดต่อฝ่ายสนับสนุนได้ที่ไหน?',
        'ระบบคำนวณค่าเบี้ยเลี้ยงอย่างไร?'
      ]
    }
  ]

  // Filter content based on search
  const filteredVideos = videoGuides.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get unique categories
  const categories = ['ทั้งหมด', ...Array.from(new Set([...videoGuides.map(v => v.category), ...documents.map(d => d.category)]))]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-black dark:bg-white rounded-lg">
              <BookOpen className="h-6 w-6 text-white dark:text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                คู่มือการใช้งาน
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                เอกสารและวิดีโอแนะนำการใช้งานระบบ SmartBill
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="ค้นหาคู่มือหรือวิดีโอ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-1">
            <TabsTrigger value="videos" className="gap-2">
              <Video className="h-4 w-4" />
              วิดีโอแนะนำ
            </TabsTrigger>
            {/* <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              เอกสารคู่มือ
            </TabsTrigger> */}
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            {/* Featured Video */}
            {selectedVideo && (
              <Card className="border-2 border-black dark:border-white">
                <CardContent className="p-6">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${selectedVideo}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedVideo(null)}
                  >
                    ปิดวิดีโอ
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <Card 
                  key={video.id} 
                  className="group hover:border-black dark:hover:border-white transition-all cursor-pointer"
                  onClick={() => setSelectedVideo(video.youtubeId)}
                >
                  <CardContent className="p-0">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 rounded-t-lg overflow-hidden">
                      <img
                        src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-4 bg-white dark:bg-black rounded-full">
                          <Play className="h-8 w-8 text-black dark:text-white" />
                        </div>
                      </div>
                      <Badge className="absolute bottom-2 right-2 bg-black text-white dark:bg-white dark:text-black">
                        {video.duration}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <Badge variant="outline" className="mb-2">
                        {video.category}
                      </Badge>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">
                        {video.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {video.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredVideos.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    ไม่พบวิดีโอที่ค้นหา
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Accordion type="single" collapsible className="space-y-4">
              {filteredDocuments.map((doc) => (
                <AccordionItem 
                  key={doc.id} 
                  value={doc.id}
                  className="border border-gray-200 dark:border-gray-800 rounded-lg px-6"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-start gap-4 text-left w-full">
                      <div className="p-2 bg-black dark:bg-white rounded-lg shrink-0">
                        <FileText className="h-5 w-5 text-white dark:text-black" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {doc.title}
                          </h3>
                          <Badge variant="outline" className="shrink-0">
                            {doc.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {doc.description}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-0 pb-4">
                    <Separator className="mb-4" />
                    <div className="space-y-3 pl-14">
                      {doc.content.map((item, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer group"
                        >
                          <ChevronRight className="h-4 w-4 shrink-0 group-hover:translate-x-1 transition-transform" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2 mt-6 pl-14">
                      <Button size="sm" variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        ดาวน์โหลด PDF
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        เปิดในหน้าใหม่
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {filteredDocuments.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    ไม่พบเอกสารที่ค้นหา
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <Card className="mt-8 border-2 border-dashed">
          <CardHeader>
            <CardTitle>ต้องการความช่วยเหลือเพิ่มเติม?</CardTitle>
            <CardDescription>
              ติดต่อทีมสนับสนุนหรือดูคำถามที่พบบ่อย
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="text-left">
                <div className="font-semibold mb-1">ติดต่อฝ่ายสนับสนุน IT Support PTEC</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  เบอร์โทรศัพท์: 092-486-3999<br/>
                </div>
              </div>
            </Button>
            {/* <Button variant="outline" className="justify-start h-auto py-4">
              <div className="text-left">
                <div className="font-semibold mb-1">คำถามที่พบบ่อย</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  ดูคำตอบคำถามยอดนิยม
                </div>
              </div>
            </Button> */}
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="text-left">
                <div className="font-semibold mb-1">แจ้งปัญหา</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  รายงานข้อผิดพลาดหรือบัคติดต่อทางเบอร์โทรศัพท์ IT Support PTEC
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}