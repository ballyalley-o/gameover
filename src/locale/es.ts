export const es = {
  "success": {
    "user_created": "Usuario creada",
    "user_deleted": "Usuario eliminada",
    "user_updated": "Usuario actualizada",
    "user_signed_up": "Usuario registrada",
    "user_signed_in": "Usuario registrado"
  },
  "error": {
    "user_not_authenticated": "Usuario no autenticada",
    "user_not_authorized": "Usuario no autorizada",
    "user_not_found": "Usuario no encontrado",
    "invalid_team_abbr": "Equipo proporcionado no válido; formato esperado de 3 letras de la NBA (por ejemplo, CLE, MIA)",
    "invalid_season_format": "Formato no válido; utilice AAAA, AAAYPRE, AAAAPOST o AAAASTAR",
    "invalie_date_format": "Fecha proporcionada no válida; fecha prevista AAAA-MM-DD o formato AAAA-MMM-DD (por ejemplo, 2025-01-25, 2025-JAN-12)",
    "invalid_season_format_short": "Formato no válido; utilizar AAAA o AAAYYPRE",
    "invalid_data_response": "Respuesta de datos no válida",
    "invalid_email_format": "Formato de correo electrónico no válido (falló la verificación Unicode)",
    "not_found": "NO ENCONTRADO: {field} no encontrado",
    "failed_find": "No se pudo encontrar el documento solicitado",
    "no_id": "No se ha proporcionado ninguna identificación o ésta no es válida",
    "no_or_invalid_api_version": "Versión de API nula o no válida",
    "missing_or_invalid_api_version": "Versión de API faltante o no válida",
    "failed_link_route": "[mainRoute]: No se pudo vincular la ruta: {linker}"
  },
  "validation": {
    "default": {
      "required": "{field} es obligatorio",
      "length": "La longitud de {field} ({value}) debe estar entre {min} y {max} caracteres",
      "max_length": "{field} longitud ({value}) excede el límite de caracteres",
      "invalid": "Inválida {field}",
      "unique": "{field} ya existe"
    },
    "password": "La contraseña debe tener más de 8 caracteres con al menos una mayúscula, una minúscula, un número y un símbolo."
  }
} as const
