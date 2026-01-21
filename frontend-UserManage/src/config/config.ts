const http = process.env.NEXT_PUBLIC_API_URL;
// export const httpPortalDomain = process.env.NEXT_PUBLIC_PORTAL_DOMAIN;
// export const httpSmartBillDomain = process.env.NEXT_PUBLIC_SMARTBILL_DOMAIN;


// function safeGetOrigin(url: string): string {
//   try {
//     return new URL(url).origin;
//   } catch {
//     return url.replace(/\/+$/, '');
//   }
// }

// const portalOrigin = process.env.NEXT_PUBLIC_PORTAL_ORIGIN
//   ? safeGetOrigin(process.env.NEXT_PUBLIC_PORTAL_ORIGIN)
//   : undefined;

// const smartbillOrigin = process.env.NEXT_PUBLIC_SMARTBILL_ORIGIN
//   ? safeGetOrigin(process.env.NEXT_PUBLIC_SMARTBILL_ORIGIN)
//   : undefined;

// export function getDomainByUrl(url?: string): string | undefined {
//   if (!url) return undefined;

//   const origin = safeGetOrigin(url);
//   if (smartbillOrigin && origin === smartbillOrigin) return httpSmartBillDomain;
//   if (portalOrigin && origin === portalOrigin) return httpPortalDomain;
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
