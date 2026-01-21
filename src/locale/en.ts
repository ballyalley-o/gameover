export const en = {
  success: {
    user_created  : 'User created',
    user_deleted  : 'User deleted',
    user_updated  : 'User updated',
    user_signed_up: 'User signed up',
    user_signed_in: 'User signed in',
  },
  error: {
    failed_find                : 'Failed to find the requested document',
    invalid_email_format       : 'Invalid email format (Unicode check failed)',
    invalid_team_abbr          : 'Invalid team provided; expected NBA 3-letter format (e.g. CLE, MIA)',
    invalie_date_format        : 'Invalid date provided; expected date YYYY-MM-DD or YYYY-MMM-DD format (e.g. 2025-01-25, 2025-JAN-12)',
    invalid_season_format      : 'Invalid format; use YYYY, YYYYPRE, YYYYPOST or YYYYSTAR',
    invalid_season_format_short: 'Invalid format; use YYYY or YYYYPRE',
    invalid_data_response      : 'Invalid data response',
    no_id                      : 'No id or invalid id provided',
    not_found                  : `NOT FOUND: {field} not found`,
    user_not_authenticated     : 'User not authenticated',
    user_not_authorized        : 'User not authorized',
    user_not_found             : 'User not found'
  },
  validation: {
    default: {
      invalid   : 'Invalid {field}',
      length    : '{field} length ({value}) must be between {min} and {max} characters',
      max_length: '{field} length ({value}) exceeds the limit of characters',
      required  : '{field} is required',
      unique    : '{field} already exists',
    },
    password: "Password must be 8+ characters with at least one uppercase, lowercase, number, and symbol."
  }
}