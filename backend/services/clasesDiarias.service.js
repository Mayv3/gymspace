// Clases diarias (Google Sheets, hoja "ClasesDiarias").

import { getNextId, sheets } from './googleSheetsClient.js';

export async function insertClaseDiaria(clase) {
  const nuevoID = await getNextId('ClasesDiarias!A2:A');

  const values = [[
    String(nuevoID),
    clase.Fecha,
    clase.Tipo,
    String(clase.Cantidad),
    clase.Responsable
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ClasesDiarias!A1:E1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values },
  });
}

export async function updateClaseDiariaByID(id, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ClasesDiarias!A1:E',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  const nuevaFila = headers.map((header, i) => nuevosDatos[header] || rows[rowIndex][i]);

  sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `ClasesDiarias!A${rowIndex + 2}:E${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] },
  });

  return true;
}

export async function removeClaseDiariaByID(id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ClasesDiarias!A1:E',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 801252478,
              dimension: 'ROWS',
              startIndex: rowIndex + 1,
              endIndex: rowIndex + 2
            }
          }
        }
      ]
    }
  });

  return true;
}

export async function listClasesDiarias() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ClasesDiarias!A1:E',
  });

  const [headers, ...rows] = res.data.values;

  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] || '';
    });
    return obj;
  });
}


// Anotaciones
