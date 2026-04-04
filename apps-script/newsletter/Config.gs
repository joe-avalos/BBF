// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURATION — Update these values
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CONFIG = {
  // Google Drive folder IDs
  NEWSLETTER_ROOT_FOLDER_ID: 'YOUR_FOLDER_ID',  // Where client drops PDFs

  // Mailchimp
  MAILCHIMP_API_KEY: 'YOUR_API_KEY',
  MAILCHIMP_SERVER_PREFIX: 'us1',  // e.g., us1, us2, etc.
  MAILCHIMP_LIST_ID: 'YOUR_LIST_ID',  // Audience ID

  // Email addresses
  CLIENT_EMAIL: 'client@example.com',  // Who receives preview and sends OK/STOP
  ADMIN_EMAIL: 'admin@example.com',    // Jose — gets notified of errors

  // Newsletter email template
  EMAIL_FROM_NAME: 'Building Baja\'s Future',
  EMAIL_SUBJECT_PREFIX: 'BBF Newsletter: ',

  // Timing
  REMINDER_INTERVAL_HOURS: 72,
};
