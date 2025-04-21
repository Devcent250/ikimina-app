function cleanObject(obj: any) {
  for (const key in obj) {
    if (obj[key] === undefined || obj[key] === null || obj[key] === "") {
      delete obj[key];
    }
  }
  console.log(obj);
  return obj;
}
export default cleanObject;
