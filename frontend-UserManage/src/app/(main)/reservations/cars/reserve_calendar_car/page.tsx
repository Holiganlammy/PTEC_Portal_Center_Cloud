"use client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction"
import { useEffect, useState } from "react";
import ListDetail from "./components/DialogListCar/ListDetail";
import { Card, CardContent } from "@/components/ui/card";
import "./components/DialogListCar/css/calendar-style.css"
import TodayListCard from "./components/TodayListCard/today";
import client from "@/lib/axios/interceptors";
import dataConfig from "@/config/config";
import dayjs from "dayjs";

type EventType = {
    title: string;
    start: string;
    end?: string;
    extendedProps?: {
        carModel: string;
        carLicense: string;
        driverName: string;
        destination: string;
        passengerCount: number;
        contactNumber: string;
        notes?: string;
    };
};
export default function reserveCalendarCarPage() {
    const [events, setEvents] = useState<EventType[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
    const [eventDialogOpen, setEventDialogOpen] = useState(false);
    const [bookingBill, setBookingBill] = useState<BookingBill[]>([]);
    const todayBookings = bookingBill
    .filter((item) => {
        const today = dayjs().format("YYYY-MM-DD");
        const itemDate = dayjs(item.reservation_date_start).format("YYYY-MM-DD");
        return itemDate === today;
    })
    .map((item, index) => {
        const start = dayjs(item.reservation_date_start).format("HH:mm");
        const end = dayjs(item.reservation_date_end).format("HH:mm");
        const attendees =
        typeof item.attendees === "string"
            ? JSON.parse(item.attendees)
            : Array.isArray(item.attendees)
            ? item.attendees
            : [];

        const statusColor = item.approve_status === 1
        ? "bg-green-500"
        : item.approve_status === 2
        ? "bg-orange-500"
        : "bg-blue-500";

        return {
        id: index + 1,
        title: `${item.car_band} ${item.car_tier} (${item.car_infocode}) - ${item.requester_name}`,
        time: `${start} - ${end}`,
        carModel: `${item.car_band} ${item.car_tier}`,
        destination: item.destination,
        status:
            item.approve_status === 1
            ? "ยืนยันแล้ว"
            : item.approve_status === 2
            ? "รอการยืนยัน"
            : "กำลังดำเนินการ",
        color: statusColor,
        };
    });
    const getStatusColor = (status: string) => {
    switch (status) {
      case 'ยืนยันแล้ว':
        return 'bg-green-100 text-green-800';
      case 'กำลังดำเนินการ':
        return 'bg-blue-100 text-blue-800';
      case 'รอการยืนยัน':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  useEffect(() => {
    const response = client.get('/reservation/reservation_get_booking_bill_on_calendar', { method: 'GET', headers: dataConfig().header })
    response.then((res) => {
      if (res.status === 200) {
        console.log(" API response:", res.data);
        setBookingBill(res.data);
      } else {
        console.error("Failed to fetch data:", res.statusText);
      }
    }).catch((error) => {
      console.error("Error fetching data:", error);
    });
  },[])
  useEffect(() => {
    if (!bookingBill) return;

    const mapped = bookingBill.map((item) => {
        let attendees = [];
          try {
            if (typeof item.attendees === "string") {
              attendees = JSON.parse(item.attendees);
            } else if (Array.isArray(item.attendees)) {
              attendees = item.attendees;
            }
          } catch (e) {
            console.warn("Invalid attendee JSON", e);
          }
      return {
        title: `${item.car_band} ${item.car_tier} (${item.car_infocode.trim()}) - ${item.requester_name}`,
        start: item.reservation_date_start,
        end: item.reservation_date_end,
        extendedProps: {
          carModel: `${item.car_band} ${item.car_tier}`,
          carLicense: item.car_infocode,
          driverName: item.requester_name ?? "",
          destination: item.destination,
          passengerCount: attendees.length || 0,
          contactNumber: item.Tel,
          passengers: attendees.map((attendee: attendees) => ({
            id: attendee.attendee_id,
            name: attendee.attendee_name || `ผู้โดยสาร ${attendee.attendee_id}`,
            depname: attendee.DepName || "",
            secname: attendee.SecName || "",
            status:
            attendee.attend_status === 1
              ? "Confirmed"
              : attendee.attend_status === 0
              ? "Declined"
              : "Waiting",
            note: attendee.note || "",
          })),
          notes: item.reason_name,
        },
      };
    });
    setEvents(mapped);
  }, [bookingBill]);

    const handleEventClick = (info: any) => {
        const eventData = {
            title: info.event.title,
            start: info.event.startStr,
            end: info.event.endStr,
            extendedProps: info.event.extendedProps
        };
        setSelectedEvent(eventData);
        setEventDialogOpen(true);
    };
    return (
        <div className="pt-16">
            <Card className="bg-white shadow-md rounded-lg max-w-6xl mx-auto mb-6">
                <CardContent className="p-4">
                    <div className="w-full">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: "prev,next today",
                                center: "title",
                                right: "dayGridMonth,timeGridWeek",
                            }}
                            events={events}
                            eventDisplay="block"
                            dayMaxEvents={3}
                            eventClick={handleEventClick}
                            eventClassNames={() => " cursor-pointer p-1 text-xs! shadow-md"}
                            height={600}
                            locale="th"
                            firstDay={1}
                            eventTimeFormat={{
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                            }}
                            eventContent={(arg) => {
                                const time = arg.event.start;
                                let timeText = "";
                                if (time) {
                                    const hour = time.getHours().toString().padStart(2, "0");
                                    const minute = time.getMinutes().toString().padStart(2, "0");
                                    timeText = `${hour}:${minute} น.`;
                                }
                                return {
                                    html: `<b className="text-gray-500">${timeText}</b>    <span>${arg.event.title}</span>`,
                                };
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            <ListDetail
                eventDialogOpen={eventDialogOpen}
                setEventDialogOpen={setEventDialogOpen}
                selectedEvent={selectedEvent}
            />
            <div className="max-w-6xl mx-auto p-4">
                <TodayListCard todayBookings={todayBookings} getStatusColor={getStatusColor} />
            </div>
        </div>
    );
}