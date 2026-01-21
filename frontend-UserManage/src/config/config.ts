const http = process.env.NEXT_PUBLIC_API_URL;

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
    http: http
  };
}

export default dataConfig;
