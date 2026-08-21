const nodemailer = require('nodemailer');
const sharp = require('sharp');
const prisma = require('../db');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_PORT === '465' || process.env.SMTP_PORT === '465' ? true : false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

/**
 * Generate Event Pass Image using Sharp
 */
async function generateEventPassBuffer(event, student, registration) {
  // Fetch QR Code
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${event.id}:${student.id}`;
  const qrResponse = await fetch(qrUrl);
  if (!qrResponse.ok) throw new Error('Failed to fetch QR code');
  const qrBuffer = Buffer.from(await qrResponse.arrayBuffer());

  const TextToSVG = require('text-to-svg');
  const path = require('path');
  
  // Load fonts
  const fontRegular = TextToSVG.loadSync(path.join(__dirname, '../../fonts/Roboto-Regular.ttf'));
  const fontBold = TextToSVG.loadSync(path.join(__dirname, '../../fonts/Roboto-Bold.ttf'));

  const width = 600;
  const height = 400;

  // Helper to generate SVG path from text
  const getTextPath = (textToSvg, text, options) => {
    return textToSvg.getPath(text, options);
  };

  const svgTemplate = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#ffffff" rx="16" ry="16"/>
      <rect x="0" y="0" width="${width}" height="100" fill="#FF5A1F" rx="16" ry="16"/>
      
      ${getTextPath(fontBold, 'EVENT PASS', { x: 30, y: 45, fontSize: 20, anchor: 'left top', attributes: { fill: '#ffffff' } })}
      ${getTextPath(fontBold, event.title.substring(0, 35), { x: 30, y: 75, fontSize: 28, anchor: 'left top', attributes: { fill: '#ffffff' } })}
      
      ${getTextPath(fontRegular, 'ATTENDEE', { x: 30, y: 140, fontSize: 14, anchor: 'left top', attributes: { fill: '#64748B' } })}
      ${getTextPath(fontBold, student.name, { x: 30, y: 165, fontSize: 22, anchor: 'left top', attributes: { fill: '#172033' } })}
      
      ${getTextPath(fontRegular, 'DATE & TIME', { x: 30, y: 210, fontSize: 14, anchor: 'left top', attributes: { fill: '#64748B' } })}
      ${getTextPath(fontBold, `${new Date(event.eventDate).toLocaleDateString()} at ${event.startTime}`, { x: 30, y: 235, fontSize: 16, anchor: 'left top', attributes: { fill: '#172033' } })}
      
      ${getTextPath(fontRegular, 'VENUE', { x: 30, y: 280, fontSize: 14, anchor: 'left top', attributes: { fill: '#64748B' } })}
      ${getTextPath(fontBold, event.venue.substring(0, 40), { x: 30, y: 305, fontSize: 16, anchor: 'left top', attributes: { fill: '#172033' } })}

      ${getTextPath(fontRegular, 'REGISTRATION ID', { x: 30, y: 350, fontSize: 14, anchor: 'left top', attributes: { fill: '#64748B' } })}
      ${getTextPath(fontBold, registration.id.split('-')[0], { x: 30, y: 375, fontSize: 16, anchor: 'left top', attributes: { fill: '#172033' } })}
    </svg>
  `;

  const passBuffer = await sharp(Buffer.from(svgTemplate))
    .composite([
      { input: qrBuffer, top: 120, left: 390 }
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
    
  return passBuffer;
}

/**
 * Send Registration Confirmation Email
 */
async function sendRegistrationConfirmationEmail({ student, event, registration }) {
  try {
    const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    if (!senderEmail) {
      console.log('[EMAIL] Skipping email send. SMTP configuration missing.');
      return { success: false, error: 'SMTP missing' };
    }

    const passBuffer = await generateEventPassBuffer(event, student, registration);
    const portalUrl = process.env.FRONTEND_URL || 'https://clg-mini.vercel.app';
    const passUrl = `${portalUrl}/student/registrations`;
    
    // Some basic retry logic for sending
    let attempts = 0;
    const maxAttempts = 3;
    let info = null;
    let lastError = null;
    
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Campus Events'}" <${senderEmail}>`,
      to: student.email,
      subject: `Registration Confirmed – ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #172033; padding: 20px;">
          <div style="background-color: #FF5A1F; padding: 20px; border-radius: 12px 12px 0 0; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Registration Confirmed!</h1>
          </div>
          <div style="background-color: #F8FAFC; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #E2E8F0; border-top: none;">
            <p style="font-size: 16px; margin-top: 0;">Hi <strong>${student.name}</strong>,</p>
            <p style="color: #64748B; line-height: 1.5;">Your registration for <strong>${event.title}</strong> has been successfully confirmed.</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #E2E8F0; margin: 25px 0;">
              <h3 style="margin-top: 0; color: #172033; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px;">Event Details</h3>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${new Date(event.eventDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${event.startTime}</p>
              <p><strong>Venue:</strong> ${event.venue}</p>
              <p><strong>Registration ID:</strong> ${registration.id}</p>
              <p><strong>Status:</strong> <span style="color: #16A34A; font-weight: bold;">CONFIRMED</span></p>
            </div>

            <p style="color: #64748B; line-height: 1.5;">Your event pass is attached to this email and is also available in your student portal. Please present the pass/QR code during event check-in.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${passUrl}" style="background-color: #172033; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; display: inline-block;">View My Event Pass</a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #94A3B8; font-size: 12px;">
            <p>Regards,<br>Campus Events Portal</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Event_Pass_${registration.id.split('-')[0]}.jpg`,
          content: passBuffer,
          contentType: 'image/jpeg'
        }
      ]
    };

    while (attempts < maxAttempts) {
      try {
        attempts++;
        info = await transporter.sendMail(mailOptions);
        break; // Success
      } catch (err) {
        lastError = err;
        console.error(`[EMAIL] Attempt ${attempts} failed for registration: ${registration.id}`, err);
        if (attempts >= maxAttempts) throw err;
        // Wait 2s before retry
        await new Promise(res => setTimeout(res, 2000));
      }
    }

    console.log(`[EMAIL] Confirmation sent successfully to ${student.email}. MessageId: ${info.messageId}`);
    
    // Update db status to SENT
    await prisma.registration.update({
      where: { id: registration.id },
      data: { emailStatus: 'SENT', emailSentAt: new Date() }
    });

    return { success: true };
  } catch (error) {
    console.error(`[EMAIL] Registration email failed completely for registration: ${registration.id}`, error);
    
    // Update db status to FAILED
    await prisma.registration.update({
      where: { id: registration.id },
      data: { emailStatus: 'FAILED', emailError: error.message.substring(0, 200) }
    });
    
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendRegistrationConfirmationEmail
};
