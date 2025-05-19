import * as XLSX from "xlsx";

export const parseExcelFile = async (file) => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet);

  const portafolios = {};
  json.forEach((row) => {
    const portafolio = row["Portafolio"];
    const actividad = row["Actividad"];
    if (portafolio && actividad) {
      if (!portafolios[portafolio]) {
        portafolios[portafolio] = [];
      }
      portafolios[portafolio].push(actividad);
    }
  });

  return portafolios;
};
