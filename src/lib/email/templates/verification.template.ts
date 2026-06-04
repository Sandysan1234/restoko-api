export function getVerificationEmailTemplate(name: string, url: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify Your Email</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      padding: 32px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #111827;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 24px;
    }
    p {
      color: #374151;
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .button {
      display: inline-block;
      background-color: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    .footer {
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      margin-top: 32px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Verify Your Email Address</h1>
    <p>Hi ${name},</p>
    <p>Thank you for signing up for Restoko! Please verify your email address by clicking the button below:</p>
    <a href="${url}" class="button" target="_blank">Verify Email</a>
    <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
    <p style="word-break: break-all; color: #4f46e5;">${url}</p>
    <p>If you didn't create an account, you can safely ignore this email.</p>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Restoko. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${name},

Thank you for signing up for Restoko! Please verify your email address by clicking the link below:

${url}

If you didn't create an account, you can safely ignore this email.

© ${new Date().getFullYear()} Restoko. All rights reserved.
  `.trim();

  return { html, text };
}
