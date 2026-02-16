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
    "no_id": "Aucune pièce d'identité ou pièce d'identité invalide fournie",
    "no_or_invalid_api_version": "Version API non valide ou non valide",
    "missing_or_invalid_api_version": "Version de l'API manquante ou invalide",
    "failed_link_route": "[mainRoute] : échec de la liaison de l'itinéraire : {linker}",
    "league_full": "La ligue est pleine",
    "membership_already_processed": "Adhésion déjà traitée",
    "failed_update": "Échec de la mise à jour de ce document",
    "user_has_team": "L'utilisateur a déjà une équipe",
    "team_already_selected": "Equipe déjà sélectionnée",
    "cpu_cannot_be_selected": "L'équipe CPU ne peut pas être sélectionnée",
    "team_has_already_selected": "{field} a déjà été sélectionné",
    "max_count_per_myleague": "Max {count} équipes par ma ligue",
    "user_select_team_required": "Tous les membres doivent sélectionner une équipe avant de rédiger",
    "league_sched_before_invite": "Le calendrier de la ligue doit être établi avant d'inviter",
    "draft_already_started": "Le brouillon a déjà commencé"
  },
  "validation": {
    "default": {
      "required": "{field} est requis",
      "length": "La longueur de {field} ({value}) doit être comprise entre {min} et {max} caractères.",
      "max_length": "La longueur de {field} ({value}) dépasse la limite de caractères",
      "invalid": "{field} non valide",
      "unique": "{field} existe déjà"
    },
    "password": "Le mot de passe doit comporter plus de 8 caractères avec au moins une majuscule, une minuscule, un chiffre et un symbole.",
    "max_league_allowed_user": "Limite maximale ({max}) autorisée pour les ligues détenues atteinte"
  },
  "message": {
    "owner_no_myleague": "Aucune MyLeague créée",
    "membership_expired": "Adhésion expirée",
    "membership_processed": "Adhésion déjà traitée",
    "draft_started": "La date de draft a déjà commencé"
  }
} as const
