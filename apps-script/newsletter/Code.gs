/**
 * Main trigger — runs hourly via Apps Script time-driven trigger.
 * Checks the Drive folder for new PDFs and manages the newsletter state machine.
 */
function checkForNewNewsletter() {
  const rootFolder = DriveApp.getFolderById(CONFIG.NEWSLETTER_ROOT_FOLDER_ID);
  const pendingFolder = getOrCreateSubfolder(rootFolder, 'pending');
  const sentFolder = getOrCreateSubfolder(rootFolder, 'sent');
  const rejectedFolder = getOrCreateSubfolder(rootFolder, 'rejected');
  const replacedFolder = getOrCreateSubfolder(rootFolder, 'replaced');

  // Check for new PDFs in root
  const newFiles = rootFolder.getFilesByType(MimeType.PDF);
  const newPdfs = [];
  while (newFiles.hasNext()) {
    newPdfs.push(newFiles.next());
  }

  if (newPdfs.length === 0) return;

  // If there's a pending newsletter, auto-reject it
  const pendingFiles = pendingFolder.getFiles();
  while (pendingFiles.hasNext()) {
    const old = pendingFiles.next();
    deletePendingMailchimpDraft();
    old.moveTo(replacedFolder);
    Logger.log('Auto-replaced pending newsletter: ' + old.getName());
  }

  // Process the newest PDF (if multiple uploaded, take the most recent)
  newPdfs.sort((a, b) => b.getDateCreated().getTime() - a.getDateCreated().getTime());
  const pdf = newPdfs[0];

  // Move extra files to replaced
  for (let i = 1; i < newPdfs.length; i++) {
    newPdfs[i].moveTo(replacedFolder);
  }

  // Make PDF publicly accessible
  pdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const pdfUrl = pdf.getUrl();

  // Move to pending
  pdf.moveTo(pendingFolder);

  // Create Mailchimp draft
  const campaignId = createMailchimpDraft(pdf.getName(), pdfUrl);

  // Store state in script properties
  const props = PropertiesService.getScriptProperties();
  props.setProperty('pending_campaign_id', campaignId);
  props.setProperty('pending_pdf_name', pdf.getName());
  props.setProperty('pending_timestamp', new Date().toISOString());

  // Send preview email to client
  sendPreviewEmail(campaignId, pdf.getName(), pdfUrl);

  Logger.log('Newsletter pending: ' + pdf.getName());
}

/**
 * Creates a Mailchimp draft campaign via API.
 */
function createMailchimpDraft(pdfName, pdfUrl) {
  const title = pdfName.replace(/\.pdf$/i, '');
  const payload = {
    type: 'regular',
    recipients: { list_id: CONFIG.MAILCHIMP_LIST_ID },
    settings: {
      subject_line: CONFIG.EMAIL_SUBJECT_PREFIX + title,
      from_name: CONFIG.EMAIL_FROM_NAME,
      reply_to: CONFIG.ADMIN_EMAIL,
    },
  };

  const res = UrlFetchApp.fetch(
    `https://${CONFIG.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/campaigns`,
    {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + CONFIG.MAILCHIMP_API_KEY },
      payload: JSON.stringify(payload),
    }
  );

  const campaign = JSON.parse(res.getContentText());
  const campaignId = campaign.id;

  // Set campaign content — simple HTML with PDF link
  const html = buildNewsletterEmailHtml(title, pdfUrl);
  UrlFetchApp.fetch(
    `https://${CONFIG.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/campaigns/${campaignId}/content`,
    {
      method: 'put',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + CONFIG.MAILCHIMP_API_KEY },
      payload: JSON.stringify({ html: html }),
    }
  );

  return campaignId;
}

/**
 * Builds the newsletter email HTML.
 */
function buildNewsletterEmailHtml(title, pdfUrl) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
      <h1 style="font-size: 1.5rem; color: #231f20;">Building Baja's Future</h1>
      <h2 style="font-size: 1.25rem; color: #231f20;">${title}</h2>
      <p style="color: #6b6563; line-height: 1.6;">
        Our latest newsletter is ready. Click below to read it.
      </p>
      <p style="margin: 2rem 0;">
        <a href="${pdfUrl}" style="background: #d71f2b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600;">
          Read Newsletter →
        </a>
      </p>
      <hr style="border: none; border-top: 1px solid #e2ddd7; margin: 2rem 0;">
      <p style="font-size: 0.8rem; color: #9a9392;">
        Building Baja's Future — Scholarships for students in Baja California Sur
      </p>
    </body>
    </html>
  `;
}

/**
 * Sends a preview/test email to the client via Mailchimp's send-test endpoint.
 */
function sendPreviewEmail(campaignId, pdfName, pdfUrl) {
  // Send test via Mailchimp
  UrlFetchApp.fetch(
    `https://${CONFIG.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/campaigns/${campaignId}/actions/test`,
    {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + CONFIG.MAILCHIMP_API_KEY },
      payload: JSON.stringify({
        test_emails: [CONFIG.CLIENT_EMAIL],
        send_type: 'html',
      }),
    }
  );

  // Also send a plain Gmail with OK/STOP instructions
  GmailApp.sendEmail(
    CONFIG.CLIENT_EMAIL,
    '📰 Newsletter Ready for Approval: ' + pdfName,
    '',
    {
      htmlBody: `
        <p>A new newsletter is ready to send to subscribers.</p>
        <p><strong>File:</strong> ${pdfName}</p>
        <p><strong>Preview:</strong> <a href="${pdfUrl}">View PDF</a></p>
        <p>You should also receive a preview email showing how it will look to subscribers.</p>
        <hr>
        <p><strong>Reply to this email with:</strong></p>
        <ul>
          <li><strong>OK</strong> — to send the newsletter to all subscribers</li>
          <li><strong>STOP</strong> — to cancel (the newsletter will not be sent)</li>
        </ul>
        <p>If you don't reply, you'll get a reminder in 72 hours.</p>
      `,
      name: CONFIG.EMAIL_FROM_NAME,
    }
  );
}

/**
 * Sends the campaign via Mailchimp API.
 */
function sendCampaign(campaignId) {
  UrlFetchApp.fetch(
    `https://${CONFIG.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/campaigns/${campaignId}/actions/send`,
    {
      method: 'post',
      headers: { Authorization: 'Bearer ' + CONFIG.MAILCHIMP_API_KEY },
    }
  );
}

/**
 * Deletes a Mailchimp draft campaign.
 */
function deleteMailchimpDraft(campaignId) {
  UrlFetchApp.fetch(
    `https://${CONFIG.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/campaigns/${campaignId}`,
    {
      method: 'delete',
      headers: { Authorization: 'Bearer ' + CONFIG.MAILCHIMP_API_KEY },
    }
  );
}

/**
 * Deletes the currently pending Mailchimp draft, if any.
 */
function deletePendingMailchimpDraft() {
  const props = PropertiesService.getScriptProperties();
  const campaignId = props.getProperty('pending_campaign_id');
  if (campaignId) {
    try {
      deleteMailchimpDraft(campaignId);
    } catch (e) {
      Logger.log('Could not delete draft: ' + e.message);
    }
    props.deleteProperty('pending_campaign_id');
    props.deleteProperty('pending_pdf_name');
    props.deleteProperty('pending_timestamp');
  }
}

// ── Helpers ──

function getOrCreateSubfolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}
