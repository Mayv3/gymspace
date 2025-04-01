import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });


// Alumnos

export async function getAlumnosFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Alumnos!A1:M', // Asegurate que el rango cubra todas las columnas
  });

  const [headers, ...rows] = res.data.values;

  const alumnos = rows.map((row) => {
    const alumno = {};
    headers.forEach((header, i) => {
      alumno[header] = row[i] || '';
    });
    return alumno;
  });

  return alumnos;
}

export async function appendAlumnoToSheet(alumno) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Alumnos!A2:A',
  });

  const totalFilas = res.data.values?.length || 0;
  const nuevoID = totalFilas + 1;

  const values = [[
    String(nuevoID),
    alumno.DNI || '',
    alumno['Nombre y Apellido'] || '',
    alumno.Email || '',
    alumno.Teléfono || '',
    alumno.Sexo || '',
    alumno['Fecha Nacimiento'] || '',
    alumno.Plan || '',
    alumno['Clases Pagadas'] || '',
    alumno['Clases Realizadas'] || '',
    alumno['Fecha Inicio'] || '',
    alumno['Fecha Vencimiento'] || '',
    alumno['Profesor Asignado'] || '',
  ]];

  sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Alumnos!A1:M1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values },
  });
}

export async function updateAlumnoByDNI(dni, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Alumnos!A1:M',
  });

  const [headers, ...rows] = res.data.values;
  const index = rows.findIndex((row) => row[1] === dni); // Columna B (índice 1) es el DNI

  if (index === -1) return false;

  // Actualizar esa fila
  const nuevaFila = headers.map((key) => nuevosDatos[key] || rows[index][headers.indexOf(key)]);

  sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Alumnos!A${index + 2}:M${index + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] },
  });

  return true;
}

export async function deleteAlumnoByDNI(dni) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Alumnos!A1:M',
  });

  const [headers, ...rows] = res.data.values;

  const rowIndex = rows.findIndex((row) => row[1] === dni);

  if (rowIndex === -1) return false;

  const sheetRowIndex = rowIndex + 2;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: sheetRowIndex - 1,
              endIndex: sheetRowIndex,
            },
          },
        },
      ],
    },
  });

  return true;
}

// Pagos

export async function getPagosFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Pagos!A1:H',
  });

  const [headers, ...rows] = res.data.values;

  const pagos = rows.map((row) => {
    const pago = {};
    headers.forEach((header, i) => {
      pago[header] = row[i] || '';
    });
    return pago;
  });

  return pagos;
}

export async function appendPagoToSheet(pago) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Pagos!A2:A', // Para contar la cantidad de pagos
  });

  const nuevoID = (res.data.values?.length || 0) + 1;

  const values = [[
    String(nuevoID),
    pago['Socio DNI'] || '',
    pago.Nombre || '',
    pago.Monto || '',
    pago['Método de Pago'] || '',
    pago['Fecha de Pago'] || '',
    pago['Fecha de Vencimiento'] || '',
    pago.Responsable || ''
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Pagos!A1:H1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values },
  });
}

// Roles 

export async function getRolesFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Roles!A1:C', // Asegurate que el nombre de la hoja sea correcto
  });

  const [headers, ...rows] = res.data.values;

  const roles = rows.map((row) => {
    const user = {};
    headers.forEach((header, i) => {
      user[header] = row[i] || '';
    });
    return user;
  });

  return roles;
}

export async function updatePagoByID(id, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Pagos!A1:H',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id); // ID está en columna A

  if (rowIndex === -1) return false;

  const nuevaFila = headers.map((header, i) => nuevosDatos[header] || rows[rowIndex][i]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Pagos!A${rowIndex + 2}:H${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] },
  });

  return true;
}

export async function deletePagoByID(id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Pagos!A1:H',
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
              sheetId: 1211942960, // ✅ tu sheetId real de la hoja Pagos
              dimension: 'ROWS',
              startIndex: rowIndex + 1, // +1 por headers
              endIndex: rowIndex + 2
            }
          }
        }
      ]
    }
  });

  return true;
}

// Asistencias 

export async function appendAsistenciaToSheet(asistencia) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Asistencias!A2:A',
  });

  const nuevoID = (res.data.values?.length || 0) + 1;

  const values = [[
    String(nuevoID),
    asistencia.Fecha,
    asistencia.Hora,
    asistencia.DNI,
    asistencia.Nombre,
    asistencia.Plan,
    asistencia.Responsable
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Asistencias!A1:G1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values },
  });
}

export async function getAsistenciasFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Asistencias!A1:G', // Ajustalo según tu hoja real
  });

  const [headers, ...rows] = res.data.values;

  const asistencias = rows.map((row) => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] || '';
    });
    return obj;
  });

  return asistencias;
}

// Clases diarias 

export async function appendClaseDiariaToSheet(clase) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ClasesDiarias!A2:A',
  });

  const nuevoID = (res.data.values?.length || 0) + 1;

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

export async function deleteClaseDiariaByID(id) {
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

export async function getClasesDiariasFromSheet() {
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

// Caja

export async function appendCajaToSheet(caja) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Caja!A2:A',
  });

  const nuevoID = (res.data.values?.length || 0) + 1;

  const values = [[
    String(nuevoID),
    caja.Fecha,
    caja.Turno,
    caja['Hora Apertura'],
    caja['Saldo Inicial'],
    caja['Total Efectivo'],
    caja['Total Tarjeta'],
    caja['Total Final'],
    caja.Responsable,
    caja['Hora Cierre']
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Caja!A1:J1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values },
  });
}

export async function updateCajaByID(id, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Caja!A1:J',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  const nuevaFila = headers.map((header, i) => nuevosDatos[header] || rows[rowIndex][i]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Caja!A${rowIndex + 2}:J${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] },
  });

  return true;
}

export async function deleteCajaByID(id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Caja!A1:J',
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
              sheetId: 404044225, 
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

export async function getCajasFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Caja!A1:J',
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

// Planes 

export async function getPlanesFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'PlanesYprecios!A1:D',
  });

  const [headers, ...rows] = res.data.values;
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] || '');
    return obj;
  });
}

export async function appendPlanToSheet(data) {
  const planes = await getPlanesFromSheet();
  const nuevoID = String((planes.length || 0) + 1);

  const values = [[
    nuevoID,
    data.Tipo,
    data['Plan o Producto'],
    data.Precio
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'PlanesYprecios!A1:D1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values }
  });
}

export async function updatePlanInSheet(id, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'PlanesYprecios!A1:D',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  const nuevaFila = headers.map((header, i) => nuevosDatos[header] || rows[rowIndex][i]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `PlanesYprecios!A${rowIndex + 2}:D${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] }
  });

  return true;
}

export async function deletePlanInSheet(id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'PlanesYprecios!A1:D',
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
              sheetId: 222062821, 
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

// Anotaciones

export async function getAnotacionesFromSheet() {
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

export async function appendAnotacionToSheet(data) {
  const registros = await getAnotacionesFromSheet();
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

export async function updateAnotacionInSheet(id, nuevosDatos) {
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

export async function deleteAnotacionInSheet(id) {
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
              sheetId: 1095798724, // Reemplazá con el ID de la hoja
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

