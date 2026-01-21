// const http = process.env.NEXT_PUBLIC_API_URL;

function dataConfig(access_token?: string) {
  const headerDetail = access_token ? `Bearer ${access_token}` : null;

  // เช็ค URL ที่เข้าเว็บแล้วเลือก API domain
  const getApiDomain = (): string => {
    // ถ้าเป็น server-side ให้ใช้ค่า default
    if (typeof window === 'undefined') {
      return process.env.NEXT_PUBLIC_API_URL || 'https://portal.purethai.co.th/api';
    }
    
    const currentUrl = window.location.href;
    
    // เช็คว่าเข้า SmartBill หรือเปล่า
    if (currentUrl.includes('smartbill.purethai.co.th')) {
      return 'https://smartbill.purethai.co.th/api';
    }
    
    // เช็กว่าเข้า Portal หรือเปล่า
    if (currentUrl.includes('portal.purethai.co.th')) {
      return 'https://portal.purethai.co.th/api';
    }
    
    // ถ้าไม่ตรงทั้งสอง (เช่น localhost) ใช้ค่า default
    return process.env.NEXT_PUBLIC_API_URL || 'https://portal.purethai.co.th/api';
  };

  const http = getApiDomain();

  return {
    header: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': headerDetail,
      'Accept': 'application/json',
      credentials: "include",
    },
    headerUploadFile: {
      'Content-Type': 'multipart/form-data',
      'Authorization': headerDetail,
      'Accept': 'application/json'
    },
    http: http
  };
}

export default dataConfig;
