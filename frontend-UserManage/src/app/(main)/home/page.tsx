"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';

const HomeComponent = () => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }));
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, []);
  return (
    <div className="w-full bg-white text-gray-900 px-6 py-10">
      {/* Header */}
      <header className="mb-8 p-6 flex justify-between items-center">
        <div className="text-sm text-gray-500 font-mono">เวลา : {currentTime}</div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center px-6">
        {/* Main Title */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-light text-black mb-6 tracking-tight">
            Welcome to PTEC Portal Systems
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-lvh leading-relaxed">
            ระบบจัดการภายในองค์กร Purethai Energy Co., Ltd.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full mb-16">
          {[
            { 
              title: "User Management", 
              desc: "จัดการผู้ใชังาน",
              number: "01",
              href: "/users/users_list"
            },
            {   
              title: "FA Control Create", 
              desc: "โยกย้ายทรัพย์สิน",
              number: "02",
              href: "/fa_control/forms?nac_type=2"
            },
            { 
              title: "Reservation System", 
              desc: "จองรถยนต์",
              number: "03",
              href: "/reservations/cars/reserve_list"
            }
          ].map((item, index) => (
            <Link href={item.href} key={index} className="group cursor-pointer">
              <div key={index} className="group cursor-pointer">
                <div className="border border-gray-200 rounded-lg p-8 hover:border-black transition-all duration-300 hover:shadow-lg bg-white">
                  <div className="text-xs text-gray-400 font-mono mb-4">{item.number}</div>
                  <h3 className="text-xl font-semibold text-black mb-3 group-hover:text-gray-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <button className="group relative px-8 py-4 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-300 font-medium">
          เริ่มต้นเลย
          <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300 inline-block">
            →
          </span>
        </button>
      </div>

      {/* Bottom Section */}
      {/* <div className="bottom-0 p-6">
        <div className="flex justify-center items-center text-sm text-gray-500">
          <div></div>
          <div>© 2025 Purethai All rights reserved</div>
        </div>
      </div> */}

      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
    </div>
  );
};

export default HomeComponent;