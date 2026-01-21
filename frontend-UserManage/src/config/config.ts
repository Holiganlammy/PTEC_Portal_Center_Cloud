const http = process.env.NEXT_PUBLIC_API_URL;
// export const httpPortalDomain = process.env.NEXT_PUBLIC_PORTAL_DOMAIN;
// export const httpSmartBillDomain = process.env.NEXT_PUBLIC_SMARTBILL_DOMAIN;

// const PORTAL_ORIGIN = 'https://portal.purethai.co.th';
// const SMARTBILL_ORIGIN = 'https://smartbill.purethai.co.th';

// function safeGetOrigin(url: string): string {
//   try {
//     return new URL(url).origin;
//   } catch {
//     return url.replace(/\/+$/, '');
//   }
// }

// export function getDomainByUrl(url?: string): string | undefined {
//   if (!url) return undefined;

//   const origin = safeGetOrigin(url);
//   if (origin === SMARTBILL_ORIGIN) return httpSmartBillDomain;
//   if (origin === PORTAL_ORIGIN) return httpPortalDomain;
//   return undefined;
// }

// export function getDomainByCurrentLocation(): string | undefined {
//   if (typeof window === 'undefined') return httpPortalDomain ?? httpSmartBillDomain;
//   return getDomainByUrl(window.location.href) ?? httpPortalDomain ?? httpSmartBillDomain;
// }

function dataConfig(access_token?: string) {
  const headerDetail = access_token ? `Bearer ${access_token}` : null;

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
    http: http,
    // httpPortalDomain,
    // httpSmartBillDomain,
    // httpDomain: getDomainByCurrentLocation(),
  };
}

export default dataConfig;
