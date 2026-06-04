export function getResetPasswordEmailTemplate(name: string, url: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
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
    <h1>Reset Your Password</h1>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password for your Restoko account. Click the button below to set a new password:</p>
    <a href="${url}" class="button" target="_blank">Reset Password</a>
    <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
    <p style="word-break: break-all; color: #4f46e5;">${url}</p>
    <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Restoko. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${name},

We received a request to reset your password for your Restoko account. Click the link below to set a new password:

${url}

If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} Restoko. All rights reserved.
  `.trim();

  return { html, text };
}
