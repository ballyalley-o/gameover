export const fr = {
  "success": {
    "user_created": "Utilisateur créé",
    "user_deleted": "Utilisateur supprimé",
    "user_updated": "Utilisateur mis à jour",
    "user_signed_up": "Utilisateur inscrit",
    "user_signed_in": "Utilisateur connecté"
  },
  "error": {
    "user_not_authenticated": "Utilisateur non authentifié",
    "user_not_authorized": "Utilisateur non autorisé",
    "user_not_found": "Utilisateur introuvable",
    "invalid_team_abbr": "Équipe invalide fournie ; expected NBA 3-letter format (e.g. CLE, MIA)",
    "invalid_season_format": "Format invalide ; utilisez AAAA, YYYYPRE, YYYYPOST ou YYYYSTAR",
    "invalie_date_format": "Date fournie invalide ; date prévue au format AAAA-MM-JJ ou AAAA-MMM-JJ (par exemple 2025-01-25, 2025-JAN-12)",
    "invalid_season_format_short": "Format invalide ; utilisez AAAA ou AAAAPRÉ",
    "invalid_data_response": "Réponse de données invalide",
    "invalid_email_format": "Format d'e-mail invalide (échec de la vérification Unicode)",
    "not_found": "INTROUVABLE : {field} introuvable",
    "failed_find": "Impossible de trouver le document demandé",
    "no_id": "Aucune pièce d'identité ou pièce d'identité invalide fournie"
  },
  "validation": {
    "default": {
      "required": "{field} est requis",
      "length": "La longueur de {field} ({value}) doit être comprise entre {min} et {max} caractères.",
      "max_length": "La longueur de {field} ({value}) dépasse la limite de caractères",
      "invalid": "{field} non valide",
      "unique": "{field} existe déjà"
    },
    "password": "Le mot de passe doit comporter plus de 8 caractères avec au moins une majuscule, une minuscule, un chiffre et un symbole."
  }
} as const
