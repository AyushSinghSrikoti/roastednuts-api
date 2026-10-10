import { escapeHtml } from '@/common/helpers/html.helper';
import type { WelcomeEmailOptions } from '@/common/interfaces/welcome-email.interface';

export const createWelcomeEmail = ({
  dashboardUrl,
  logoUrl,
}: WelcomeEmailOptions): string => {
  const safeDashboardUrl = escapeHtml(dashboardUrl);
  const safeLogoUrl = escapeHtml(logoUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Welcome to Roasted Almonds</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f7f3ed; color:#3e291c; font-family:Inter, Arial, Helvetica, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      Your Roasted Almonds account is ready.
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
                    <td style="vertical-align:middle; color:#3e291c; font-family:Inter, Arial, Helvetica, sans-serif; font-size:18px; line-height:24px; font-weight:600; letter-spacing:-0.2px; white-space:nowrap;">
                      Roasted Almonds
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 40px; text-align:left;">
                <div style="height:1px; background-color:#eee5dc; margin-bottom:30px;"></div>
                <p style="margin:0 0 18px; color:#3e291c; font-size:16px; line-height:25px; font-weight:600;">Dear Customer,</p>
                <p style="margin:0 0 16px; color:#705548; font-size:16px; line-height:25px;">
                  Welcome to Roasted Almonds. Your account has been created successfully, and we&rsquo;re glad to have you with us.
                </p>
                <p style="margin:0 0 28px; color:#705548; font-size:16px; line-height:25px;">
                  You can now access your dashboard and start exploring everything Roasted Almonds has to offer.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                  <tr>
                    <td align="center" bgcolor="#75452e" style="background-color:#75452e; border-radius:10px;">
                      <a href="${safeDashboardUrl}" target="_blank" style="display:inline-block; padding:12px 18px; border:1px solid #75452e; border-radius:10px; background-color:#75452e; color:#ffffff; font-family:Inter, Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; font-weight:500; text-decoration:none;">Go to your dashboard</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:28px 0 0; color:#8b7463; font-size:13px; line-height:20px; text-align:center;">
                  If you did not create this account, please contact our support team.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0; color:#9b8e84; font-size:12px; line-height:18px; text-align:center;">
            This is an automatically generated email. Please do not reply.<br>
            &copy; Roasted Almonds
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
