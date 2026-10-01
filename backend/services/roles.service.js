// Roles del staff (Google Sheets, hoja "Roles").

import { sheets } from './googleSheetsClient.js';

export async function listRoles() {
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

// Clases diarias 
