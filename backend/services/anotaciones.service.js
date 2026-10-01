// Anotaciones (Google Sheets, hoja "Anotaciones").

import { sheets } from './googleSheetsClient.js';

export async function listAnotaciones() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Anotaciones!A1:F1000',
  });

  const [headers, ...rows] = res.data.values;
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] || '');
    return obj;
  });
}

export async function insertAnotacion(data) {
  const registros = await listAnotaciones();
  const nuevoID = String((registros.length || 0) + 1);

  const values = [[
    nuevoID,
    data.Fecha,
    data.Hora,
    data['Alumno DNI'],
    data.Nota,
    data.ProfeaCargo
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Anotaciones!A1:F1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values }
  });
}

export async function updateAnotacion(id, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Anotaciones!A1:F',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);
  if (rowIndex === -1) return false;

  const nuevaFila = headers.map((h, i) => nuevosDatos[h] || rows[rowIndex][i]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Anotaciones!A${rowIndex + 2}:F${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] }
  });

  return true;
}

export async function removeAnotacion(id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Anotaciones!A1:F',
  });

  const rows = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);
  if (rowIndex === -1) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 1095798724,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1
            }
          }
        }
      ]
    }
  });

  return true;
}


// Puntos
