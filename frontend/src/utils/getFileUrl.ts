const getFileUrl = (file) => {
  if (!file) {
    return "";
  }
  const backendUrl = import.meta.env?.VITE_PUBLIC_API_URL || 
    (import.meta.env.PROD ? 'https://ikimina-backend.onrender.com' : 'http://localhost:4000');
  // remove /api
  const url = backendUrl?.replace(/\/api$/, "");
  // @ts-ignore
  return file ? (file.startsWith("/") ? `${url}${file}` : file) : undefined;
};

export default getFileUrl;
