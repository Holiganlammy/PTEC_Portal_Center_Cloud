import dataConfig from '@/config/config';
import client from '@/lib/axios/interceptors';
export async function getAutoData() {
  const cacheKey = "autoData_cache";
  const cacheTimeKey = "autoData_cache_time";

  const cached = sessionStorage.getItem(cacheKey);
  const cachedTime = sessionStorage.getItem(cacheTimeKey);

  if (cached && cachedTime) {
    const age = Date.now() - parseInt(cachedTime);
    if (age < 1000 * 60 * 5) {
      return JSON.parse(cached);
    }
  }

  const urls = {
    typeGroup: '/FA_Control_Assets_TypeGroup',
    nacStatus: '/FA_Control_ListStatus',
  };

  try {
    const response = await Promise.all(
      Object.entries(urls).map(async ([key, url]) => {
        const res = await client.get(dataConfig().http + url, {
          method: 'GET',
          headers: dataConfig().header,
        });
        return { key, data: res.data };
      })
    );

    // เก็บ cache
    sessionStorage.setItem(cacheKey, JSON.stringify(response));
    sessionStorage.setItem(cacheTimeKey, Date.now().toString());

    return response;
  } catch (error) {
    console.error('ข้อผิดพลาด:', error);
  }
}

export async function getAutoDataNAC(usercode: string, role: 'user' | 'admin' | 'moderator') {
  const cacheKey = `autoDataNAC_${usercode}_${role}`;
  const cacheTimeKey = `autoDataNAC_time_${usercode}_${role}`;

  const cached = sessionStorage.getItem(cacheKey);
  const cachedTime = sessionStorage.getItem(cacheTimeKey);

  if (cached && cachedTime) {
    const age = Date.now() - parseInt(cachedTime);
    if (age < 1000 * 60 * 5) {
      return JSON.parse(cached);
    }
  }

  //  กำหนด mapping ระหว่าง role กับ API endpoint
  const apiMap: Record<string, string> = {
    admin: '/FA_Control_Select_MyNAC_Approve',
    moderator: '/FA_Control_Select_MyNAC_Approve', // ใช้ endpoint เดียวกับ admin
    user: '/FA_Control_Select_MyNAC',
  };

  const url = apiMap[role] || apiMap['user'];

  try {
    const res = await client.post(
      dataConfig().http + url,
      { usercode },
      { headers: dataConfig().header }
    );

    const response = [{ key: role, data: res.data }];
    sessionStorage.setItem(cacheKey, JSON.stringify(response));
    sessionStorage.setItem(cacheTimeKey, Date.now().toString());

    return response;
  } catch (error) {
    console.error('ข้อผิดพลาด:', error);
  }
}


