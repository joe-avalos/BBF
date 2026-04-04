/**
 * Gmail trigger — runs on a time-driven trigger (every 5 minutes).
 * Checks for OK/STOP replies from the client.
 */
function checkForReply() {
  const props = PropertiesService.getScriptProperties();
  const campaignId = props.getProperty('pending_campaign_id');
  if (!campaignId) return; // No pending newsletter

  // Search for recent replies from the client
  const threads = GmailApp.search(
    `from:${CONFIG.CLIENT_EMAIL} subject:"Newsletter Ready for Approval" newer_than:7d`,
    0, 10
  );

  for (const thread of threads) {
    const messages = thread.getMessages();
    // Check the latest reply (last message in thread)
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.getFrom().includes(CONFIG.CLIENT_EMAIL) && !msg.isInTrash()) {
        const body = msg.getPlainBody().trim().toUpperCase();

        if (body.startsWith('OK')) {
          handleApproval(campaignId);
          return;
        }

        if (body.startsWith('STOP')) {
          handleRejection(campaignId);
          return;
        }
      }
    }
  }

  // Check if reminder is due
  checkReminder();
}

function handleApproval(campaignId) {
  const props = PropertiesService.getScriptProperties();
  const pdfName = props.getProperty('pending_pdf_name');

  // Send the campaign
  sendCampaign(campaignId);

  // Move PDF to /sent/
  movePendingPdf('sent');

  // Clear state
  props.deleteProperty('pending_campaign_id');
  props.deleteProperty('pending_pdf_name');
  props.deleteProperty('pending_timestamp');
  props.deleteProperty('last_reminder_sent');

  // Notify
  GmailApp.sendEmail(
    CONFIG.CLIENT_EMAIL,
    '✅ Newsletter Sent: ' + pdfName,
    'The newsletter "' + pdfName + '" has been sent to all subscribers.',
    { name: CONFIG.EMAIL_FROM_NAME }
  );

  Logger.log('Newsletter sent: ' + pdfName);
}

function handleRejection(campaignId) {
  const props = PropertiesService.getScriptProperties();
  const pdfName = props.getProperty('pending_pdf_name');

  // Delete Mailchimp draft
  deleteMailchimpDraft(campaignId);

  // Move PDF to /rejected/
  movePendingPdf('rejected');

  // Clear state
  props.deleteProperty('pending_campaign_id');
  props.deleteProperty('pending_pdf_name');
  props.deleteProperty('pending_timestamp');
  props.deleteProperty('last_reminder_sent');

  // Notify
  GmailApp.sendEmail(
    CONFIG.CLIENT_EMAIL,
    '🚫 Newsletter Cancelled: ' + pdfName,
    'The newsletter "' + pdfName + '" has been cancelled and will not be sent.',
    { name: CONFIG.EMAIL_FROM_NAME }
  );

  Logger.log('Newsletter rejected: ' + pdfName);
}

function checkReminder() {
  const props = PropertiesService.getScriptProperties();
  const lastReminder = props.getProperty('last_reminder_sent');
  const pendingTimestamp = props.getProperty('pending_timestamp');
  const pdfName = props.getProperty('pending_pdf_name');

  if (!pendingTimestamp || !pdfName) return;

  const lastCheck = lastReminder ? new Date(lastReminder) : new Date(pendingTimestamp);
  const hoursSince = (Date.now() - lastCheck.getTime()) / (1000 * 60 * 60);

  if (hoursSince >= CONFIG.REMINDER_INTERVAL_HOURS) {
    GmailApp.sendEmail(
      CONFIG.CLIENT_EMAIL,
      '⏰ Reminder: Newsletter Awaiting Approval — ' + pdfName,
      '',
      {
        htmlBody: `
          <p>You have a newsletter waiting for your approval: <strong>${pdfName}</strong></p>
          <p>Reply <strong>OK</strong> to send it to subscribers, or <strong>STOP</strong> to cancel.</p>
        `,
        name: CONFIG.EMAIL_FROM_NAME,
      }
    );

    props.setProperty('last_reminder_sent', new Date().toISOString());
    Logger.log('Reminder sent for: ' + pdfName);
  }
}

function movePendingPdf(targetFolderName) {
  const rootFolder = DriveApp.getFolderById(CONFIG.NEWSLETTER_ROOT_FOLDER_ID);
  const pendingFolder = getOrCreateSubfolder(rootFolder, 'pending');
  const targetFolder = getOrCreateSubfolder(rootFolder, targetFolderName);

  const files = pendingFolder.getFiles();
  while (files.hasNext()) {
    files.next().moveTo(targetFolder);
  }
}
