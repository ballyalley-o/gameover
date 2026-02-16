export const en = {
  success: {
    user_created  : 'User created',
    user_deleted  : 'User deleted',
    user_updated  : 'User updated',
    user_signed_up: 'User signed up',
    user_signed_in: 'User signed in',
  },
  error: {
    cpu_cannot_be_selected        : 'CPU team cannot be selected',
    draft_already_started         : 'Draft has already started',
    failed_find                   : 'Failed to find the requested document',
    failed_link_route             : '[mainRoute]: Failed to link Route: {linker}',
    failed_update                 : 'Failed to update this document',
    invalid_email_format          : 'Invalid email format (Unicode check failed)',
    invalid_team_abbr             : 'Invalid team provided; expected NBA 3-letter format (e.g. CLE, MIA)',
    invalie_date_format           : 'Invalid date provided; expected date YYYY-MM-DD or YYYY-MMM-DD format (e.g. 2025-01-25, 2025-JAN-12)',
    invalid_season_format         : 'Invalid format; use YYYY, YYYYPRE, YYYYPOST or YYYYSTAR',
    invalid_season_format_short   : 'Invalid format; use YYYY or YYYYPRE',
    invalid_data_response         : 'Invalid data response',
    league_full                   : 'League is full',
    league_sched_before_invite    : 'League schedule must be set before inviting',
    membership_already_processed  : 'Membership already processed',
    max_count_per_myleague        : 'Max {count} teams per myleague',
    missing_or_invalid_api_version: 'Missing or Invalid api version',
    no_id                         : 'No id or invalid id provided',
    not_found                     : `NOT FOUND: {field} not found`,
    user_not_authenticated        : 'User not authenticated',
    user_not_authorized           : 'User not authorized',
    user_not_found                : 'User not found',
    user_has_team                 : 'User already has a team',
    user_select_team_required     : 'All members must select a team before drafting',
    team_has_already_selected     : '{field} has already been selected',
    team_already_selected         : 'Team already selected'
  },
  message: {
    draft_started       : 'Draft date has already started',
    membership_expired  : 'Membership expired',
    membership_processed: 'Membership already processed',
    owner_no_myleague   : 'No MyLeague created'
  },
  validation: {
    default: {
      invalid   : 'Invalid {field}',
      length    : '{field} length ({value}) must be between {min} and {max} characters',
      max_length: '{field} length ({value}) exceeds the limit of characters',
      required  : '{field} is required',
      unique    : '{field} already exists',
    },
    max_league_allowed_user: 'Max limit ({max}) allowed for leagues owned reached ',
    password               : "Password must be 8+ characters with at least one uppercase, lowercase, number, and symbol."
  }
}