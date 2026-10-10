import { escapeHtml } from '@/common/helpers/html.helper';
import type { PasswordResetEmailOptions } from '@/common/interfaces/password-reset-email.interface';

export const createPasswordResetEmail = ({
  resetUrl,
  logoUrl,
}: PasswordResetEmailOptions): string => {
  const safeResetUrl = escapeHtml(resetUrl);
  const safeLogoUrl = escapeHtml(logoUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reset your Roasted Almonds password</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f7f3ed; color:#2f241d; font-family:Inter, Arial, Helvetica, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      Reset your Roasted Almonds password. This secure link expires shortly.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; background-color:#f7f3ed;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:560px; background-color:#ffffff; border:1px solid #e7ddd2; border-radius:18px; border-collapse:separate; overflow:hidden; box-shadow:0 8px 24px rgba(79, 53, 35, 0.08);">
            <tr>
              <td align="center" style="padding:36px 32px 22px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                  <tr>
                    <td style="padding-right:12px; vertical-align:middle;">
                      <img src="${safeLogoUrl}" width="36" height="36" alt="" style="display:block; width:36px; height:36px; object-fit:contain; border:0;">
                    </td>
                    <td style="vertical-align:middle; color:#2f241d; font-family:Inter, Arial, Helvetica, sans-serif; font-size:18px; line-height:24px; font-weight:600; letter-spacing:-0.2px; white-space:nowrap;">
                      Roasted Almonds
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 40px; text-align:center;">
                <div style="height:1px; background-color:#eee5dc; margin-bottom:30px;"></div>
                <h1 style="margin:0 0 14px; color:#2f241d; font-size:26px; line-height:34px; font-weight:700;">Reset your password</h1>
                <p style="margin:0 auto 28px; max-width:420px; color:#6d625b; font-size:16px; line-height:25px;">
                  We have received a request to reset your password. Use the link below to reset it.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                  <tr>
                    <td align="center" bgcolor="#75452e" style="background-color:#75452e; border-radius:10px;">
                      <a href="${safeResetUrl}" target="_blank" style="display:inline-block; padding:12px 18px; border:1px solid #75452e; border-radius:10px; background-color:#75452e; color:#ffffff; font-family:Inter, Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; font-weight:500; text-decoration:none;">Click here to reset your password</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:26px 0 0; color:#8a7d74; font-size:13px; line-height:20px;">
                  This link expires shortly and can only be used once.<br>
                  If you did not request a password reset, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0; color:#9b8e84; font-size:12px; line-height:18px;">
            This is an automatically generated email. Please do not reply.<br>
            &copy; Roasted Almonds
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
