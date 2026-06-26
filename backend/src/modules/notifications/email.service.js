const nodemailer = require("nodemailer");
const { config } = require("../../config/config");

const appName = "Screenly";
const appHomeUrl = process.env.FRONTEND_URL || "#";
const appLogo = process.env.SCREENLY_LOGO_URL || null;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.emailUsername,
    pass: config.emailPassword,
  },
});

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

const formatLongDate = (value) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return {
      dayMonthYear: value || "-",
      weekday: "",
    };
  }

  return {
    dayMonthYear: new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(parsed),
    weekday: new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
    }).format(parsed),
  };
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderBrandMark = () => {
  if (appLogo) {
    return `<img src="${escapeHtml(appLogo)}" alt="${appName}" width="44" height="44" style="display:block;border-radius:10px;background:#ffffff;padding:4px;" />`;
  }

  return `
    <div style="display:inline-flex;align-items:center;justify-content:center;min-width:44px;height:44px;padding:0 12px;border-radius:10px;background:#ffffff;color:#641bff;font-size:14px;font-weight:800;letter-spacing:0.3px;">
      ${appName}
    </div>
  `;
};

const renderFeaturePills = (features) => {
  const safeFeatures = Array.isArray(features)
    ? features.map((feature) => escapeHtml(feature)).filter(Boolean)
    : [];

  if (safeFeatures.length === 0) {
    return "";
  }

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;">
      <tr>
        ${safeFeatures
          .slice(0, 3)
          .map(
            (feature) => `
              <td style="padding-right:8px;padding-bottom:8px;">
                <div style="border:1px solid #dde7ff;border-radius:10px;background:#f7faff;padding:10px 12px;font-size:12px;font-weight:600;color:#365a9d;text-align:center;white-space:nowrap;">
                  ${feature}
                </div>
              </td>`,
          )
          .join("")}
      </tr>
    </table>
  `;
};

const buildQrCodeUrl = (value) => {
  const content = encodeURIComponent(String(value || ""));
  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${content}`;
};

const getBaseEmailHtml = ({ preheader, title, subtitle, body, footer }) => {
  return `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0;padding:0;background:#f4efff;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#1f1636;">
      <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(preheader)}</span>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;background:#f4efff;">
        <tr>
          <td align="center">
            <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #eadfff;box-shadow:0 14px 44px rgba(100,27,255,0.12);">
              <tr>
                <td style="padding:28px 28px 20px;background:linear-gradient(125deg,#641bff 0%,#8f46ff 55%,#d45cff 100%);color:#ffffff;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="left" style="vertical-align:middle;">
                        ${renderBrandMark()}
                      </td>
                      <td align="right" style="font-size:12px;letter-spacing:0.6px;text-transform:uppercase;opacity:0.8;">Movie Ticketing</td>
                    </tr>
                  </table>
                  <h1 style="margin:18px 0 8px;font-size:28px;line-height:1.2;">${escapeHtml(title)}</h1>
                  <p style="margin:0;font-size:15px;line-height:1.6;opacity:0.92;">${escapeHtml(subtitle)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:26px 28px 12px;background:#ffffff;">${body}</td>
              </tr>
              <tr>
                <td style="padding:12px 28px 28px;color:#5e6f83;font-size:12px;line-height:1.6;border-top:1px solid #e6edf5;">${footer}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
};

const sendEmail = async ({ to, bcc, subject, html }) => {
  if (!config.emailUsername || !config.emailPassword) {
    console.warn("Email credentials are missing. Skipping email notification.");
    return null;
  }

  const message = {
    from: `${appName} <${config.emailUsername}>`,
    subject,
    html,
  };

  if (to) {
    message.to = to;
  }

  if (Array.isArray(bcc) && bcc.length > 0) {
    const uniqueBcc = [...new Set(bcc.map((email) => String(email).trim().toLowerCase()))]
      .filter(Boolean);
    message.to = message.to || config.emailUsername;
    message.bcc = uniqueBcc;
  }

  if (!message.to && !message.bcc) {
    return null;
  }

  return transporter.sendMail(message);
};

const sendBookingConfirmationEmail = async ({
  userEmail,
  userName,
  bookingRef,
  movieTitle,
  posterUrl,
  theaterName,
  theaterLocation,
  showDate,
  showTime,
  screen,
  audioType,
  seats,
  paymentMethod,
  ticketPrice,
  convenienceFee,
  totalAmount,
}) => {
  if (!userEmail) {
    return null;
  }

  const safeSeats = Array.isArray(seats) ? seats.map((seat) => escapeHtml(seat)).join(", ") : "-";
  const safeBookingRef = escapeHtml(bookingRef || "-");
  const safeMovieTitle = escapeHtml(movieTitle || "Your movie");
  const safePosterUrl = posterUrl ? escapeHtml(posterUrl) : "";
  const safeTheaterName = escapeHtml(theaterName || "-");
  const safeTheaterLocation = escapeHtml(theaterLocation || "");
  const safeShowDate = escapeHtml(showDate || "-");
  const safeShowTime = escapeHtml(showTime || "-");
  const safeScreen = escapeHtml(screen || "-");
  const safeAudioType = escapeHtml(audioType || "Dolby Atmos");
  const safePaymentMethod = escapeHtml(paymentMethod || "-");
  const qrCodeUrl = buildQrCodeUrl(`${appName}|${bookingRef}|${movieTitle}|${showDate}|${showTime}|${safeSeats}`);
  const html = getBaseEmailHtml({
    preheader: `Booking ${bookingRef} is confirmed for ${movieTitle}`,
    title: "Booking Confirmed!",
    subtitle: "Your tickets are booked. Get ready for an amazing experience!",
    body: `
      <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#233a74;">Hi ${escapeHtml(userName || "there")},</p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#6c7ea8;">
        Your booking has been confirmed. We can't wait to see you at the movies!
      </p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:18px;border:1px solid #dbe5ff;border-radius:18px;background:#ffffff;box-shadow:0 10px 30px rgba(28,70,160,0.08);">
        <tr>
          <td style="padding:18px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                ${
                  safePosterUrl
                    ? `<td width="118" style="width:118px;vertical-align:top;padding-right:16px;">
                        <img src="${safePosterUrl}" alt="${safeMovieTitle}" width="118" style="display:block;width:118px;max-width:118px;border-radius:12px;border:1px solid #dbe5ff;box-shadow:0 8px 18px rgba(19,39,78,0.16);" />
                      </td>`
                    : ""
                }
                <td style="vertical-align:top;">
                  <div style="display:inline-block;border-radius:999px;background:#eefaf1;padding:6px 10px;font-size:11px;font-weight:800;letter-spacing:0.03em;color:#1ca14c;text-transform:uppercase;">
                    Booking ID&nbsp;&nbsp;#${safeBookingRef}
                  </div>
                  <p style="margin:12px 0 6px;font-size:18px;font-weight:800;color:#223864;">${safeMovieTitle}</p>

                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:10px;border-top:1px solid #e7eeff;border-bottom:1px solid #e7eeff;">
                    <tr>
                      <td style="width:50%;padding:12px 10px 12px 0;border-right:1px solid #e7eeff;vertical-align:top;">
                        <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.06em;color:#7b8fb8;text-transform:uppercase;">Date</p>
                        <p style="margin:0;font-size:14px;font-weight:700;color:#233a74;">${safeShowDate}</p>
                      </td>
                      <td style="width:50%;padding:12px 0 12px 10px;vertical-align:top;">
                        <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.06em;color:#7b8fb8;text-transform:uppercase;">Time</p>
                        <p style="margin:0;font-size:14px;font-weight:700;color:#233a74;">${safeShowTime}</p>
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:10px;">
                    <tr>
                      <td style="padding:0 0 10px;">
                        <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.06em;color:#7b8fb8;text-transform:uppercase;">Theatre</p>
                        <p style="margin:0;font-size:14px;font-weight:700;color:#233a74;">${safeTheaterName}</p>
                        <p style="margin:4px 0 0;font-size:12px;line-height:1.5;color:#6c7ea8;">${safeTheaterLocation}</p>
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:2px;">
                    <tr>
                      <td style="width:50%;padding:0 10px 10px 0;vertical-align:top;">
                        <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.06em;color:#7b8fb8;text-transform:uppercase;">Screen</p>
                        <p style="margin:0;font-size:14px;font-weight:700;color:#233a74;">${safeScreen}</p>
                      </td>
                      <td style="width:50%;padding:0 0 10px 10px;vertical-align:top;">
                        <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.06em;color:#7b8fb8;text-transform:uppercase;">Audio</p>
                        <p style="margin:0;font-size:14px;font-weight:700;color:#233a74;">${safeAudioType}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="width:50%;padding:0 10px 10px 0;vertical-align:top;">
                        <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.06em;color:#7b8fb8;text-transform:uppercase;">Seats</p>
                        <p style="margin:0;font-size:14px;font-weight:700;color:#233a74;">${safeSeats}</p>
                      </td>
                      <td style="width:50%;padding:0 0 10px 10px;vertical-align:top;">
                        <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.06em;color:#7b8fb8;text-transform:uppercase;">Tickets</p>
                        <p style="margin:0;font-size:14px;font-weight:700;color:#233a74;">${Array.isArray(seats) ? seats.length : 0} Ticket(s)</p>
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:2px;border-top:1px solid #e7eeff;padding-top:10px;">
                    <tr>
                      <td style="width:50%;padding-top:10px;vertical-align:top;">
                        <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.06em;color:#7b8fb8;text-transform:uppercase;">Payment</p>
                        <p style="margin:0;font-size:14px;font-weight:700;color:#233a74;text-transform:capitalize;">${safePaymentMethod}</p>
                      </td>
                      <td align="right" style="width:50%;padding-top:10px;vertical-align:top;">
                        <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.06em;color:#7b8fb8;text-transform:uppercase;">Amount Paid</p>
                        <p style="margin:0;font-size:24px;font-weight:800;color:#1ca14c;">${formatCurrency(totalAmount)}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:14px;border:1px solid #dbe5ff;border-radius:16px;background:#f9fbff;">
        <tr>
          <td style="padding:18px 18px 18px 20px;vertical-align:middle;">
            <p style="margin:0 0 6px;font-size:20px;font-weight:800;color:#2f68d8;">Your E-Ticket</p>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#6c7ea8;">Show this QR code at the theatre entrance.</p>
          </td>
          <td width="154" style="width:154px;padding:14px 18px 14px 0;vertical-align:middle;">
            <div style="border-left:2px dashed #c8d8ff;padding-left:18px;">
              <img src="${qrCodeUrl}" alt="Booking QR Code" width="120" height="120" style="display:block;width:120px;height:120px;border-radius:10px;border:1px solid #dbe5ff;background:#ffffff;" />
            </div>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:10px;border:1px solid #dff1e4;border-radius:12px;background:#f4fbf6;">
        <tr>
          <td style="padding:14px 16px;">
            <p style="margin:0 0 4px;font-size:14px;font-weight:800;color:#2e8d4f;">Important Note</p>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#547262;">Arrive at least 15 minutes before the showtime. Carry a valid ID proof.</p>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:16px;border:1px solid #dbe5ff;border-radius:12px;background:#f9fbff;">
        <tr>
          <td style="padding:14px 16px;">
            <p style="margin:0 0 4px;font-size:14px;font-weight:800;color:#2f68d8;">Need help?</p>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#6c7ea8;">Reply to this email or open ${appName} for support.</p>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;">
        <tr>
          <td style="border-radius:10px;background:#641bff;">
            <a href="${escapeHtml(appHomeUrl)}" style="display:inline-block;padding:13px 24px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;">Open ${appName}</a>
          </td>
        </tr>
      </table>
    `,
    footer:
      "Please carry a valid ID at entry and arrive 15 minutes early. Need help? Reply to this email and our team will assist you.",
  });

  return sendEmail({
    to: userEmail,
    subject: `${appName} Booking Confirmed | ${movieTitle}`,
    html,
  });
};

const sendNewShowPublishedEmail = async ({
  recipients,
  movieTitle,
  posterUrl,
  theaterName,
  theaterLocation,
  screen,
  format,
  audioType,
  shows,
}) => {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return null;
  }

  const validShows = Array.isArray(shows)
    ? shows.filter((show) => show?.date && show?.time)
    : [];

  if (validShows.length === 0) {
    return null;
  }

  const maxVisibleShows = 2;
  const visibleShows = validShows.slice(0, maxVisibleShows);
  const remainingShows = validShows.length - visibleShows.length;
  const primaryShow = visibleShows[0];
  const primaryShowDate = formatLongDate(primaryShow?.date);
  const showRows = visibleShows
    .map(
      (show) => `<tr>
        <td style="font-size:14px;font-weight:600;color:#2f185f;padding:8px 0;">${escapeHtml(show.date)}</td>
        <td align="right" style="font-size:14px;font-weight:600;color:#2f185f;padding:8px 0;">${escapeHtml(show.time)}</td>
      </tr>`,
    )
    .join("");

  const safeMovieTitle = escapeHtml(movieTitle || "New show");
  const safePosterUrl = posterUrl ? escapeHtml(posterUrl) : "";
  const safeTheaterName = escapeHtml(theaterName || "your selected theater");
  const safeTheaterLocation = escapeHtml(theaterLocation || "");
  const safeScreen = escapeHtml(screen || "Premium Screens");
  const safeFormat = escapeHtml(format || "Movie Experience");
  const safeAudioType = escapeHtml(audioType || "Dolby Atmos");
  const featurePills = renderFeaturePills([safeScreen, safeAudioType, safeFormat]);
  const html = getBaseEmailHtml({
    preheader: `New shows added on ${appName}`,
    title: "New shows are live",
    subtitle: `Fresh slots are available now. Open ${appName} and book your seats.`,
    body: `
      <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#233a74;">Hello there,</p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#6c7ea8;">
        Exciting news! New shows have been added for your favorite movie.
      </p>

      <p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#1f1636;">
        <strong style="font-size:19px;color:#1850b8;">${safeMovieTitle}</strong> at <strong>${safeTheaterName}</strong>
      </p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dbe5ff;border-radius:18px;background:#ffffff;margin-bottom:18px;box-shadow:0 10px 30px rgba(28,70,160,0.08);">
        <tr>
          <td style="padding:18px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="vertical-align:top;padding-right:18px;">
                  <div style="display:inline-block;border-radius:999px;background:#edf4ff;padding:6px 10px;font-size:11px;font-weight:800;letter-spacing:0.03em;color:#2f68d8;text-transform:uppercase;">
                    New Show Added
                  </div>

                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;">
                    <tr>
                      <td style="font-size:22px;font-weight:800;color:#223864;line-height:1.3;">${safeTheaterName}</td>
                    </tr>
                    <tr>
                      <td style="padding-top:6px;font-size:13px;line-height:1.6;color:#6c7ea8;">${safeTheaterLocation}</td>
                    </tr>
                  </table>

                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;border-top:1px solid #e7eeff;border-bottom:1px solid #e7eeff;">
                    <tr>
                      <td style="width:50%;padding:14px 12px 14px 0;border-right:1px solid #e7eeff;vertical-align:top;">
                        <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:0.06em;color:#7b8fb8;text-transform:uppercase;">Date</p>
                        <p style="margin:0;font-size:18px;font-weight:800;color:#233a74;">${escapeHtml(primaryShowDate.dayMonthYear)}</p>
                        <p style="margin:5px 0 0;font-size:12px;color:#6c7ea8;">${escapeHtml(primaryShowDate.weekday)}</p>
                      </td>
                      <td style="width:50%;padding:14px 0 14px 12px;vertical-align:top;">
                        <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:0.06em;color:#7b8fb8;text-transform:uppercase;">Time</p>
                        <p style="margin:0;font-size:18px;font-weight:800;color:#233a74;">${escapeHtml(primaryShow?.time || "-")}</p>
                        <p style="margin:5px 0 0;font-size:12px;color:#6c7ea8;">Evening Show</p>
                      </td>
                    </tr>
                  </table>

                  ${featurePills}

                  ${
                    remainingShows > 0
                      ? `<p style="margin:10px 0 0;font-size:13px;color:#6c7ea8;">+${remainingShows} more shows available on ${appName}.</p>`
                      : ""
                  }
                </td>
                ${
                  safePosterUrl
                    ? `<td width="150" style="width:150px;vertical-align:top;">
                        <img src="${safePosterUrl}" alt="${safeMovieTitle}" width="150" style="display:block;width:150px;max-width:150px;border-radius:14px;border:1px solid #dbe5ff;box-shadow:0 10px 22px rgba(19,39,78,0.18);" />
                      </td>`
                    : ""
                }
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${
        validShows.length > 1
          ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:16px;border:1px solid #e7eeff;border-radius:14px;background:#f9fbff;">
              <tr>
                <td style="padding:14px 16px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="font-size:12px;letter-spacing:0.05em;text-transform:uppercase;color:#7b8fb8;padding-bottom:6px;">More Showtimes</td>
                      <td align="right" style="font-size:12px;letter-spacing:0.05em;text-transform:uppercase;color:#7b8fb8;padding-bottom:6px;">Available</td>
                    </tr>
                    ${showRows}
                  </table>
                </td>
              </tr>
            </table>`
          : ""
      }

      <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;">
        <tr>
          <td style="border-radius:10px;background:#641bff;">
            <a href="${escapeHtml(appHomeUrl)}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;">Open ${appName} &amp; Book Now</a>
          </td>
        </tr>
      </table>

      <p style="margin:12px 0 0;text-align:center;font-size:13px;color:#ff7a00;">
        Seats are limited. Book now to secure your spot.
      </p>
    `,
    footer:
      `You are receiving this because you have an account on ${appName}. You can ignore this email if this update is not relevant to you.`,
  });

  return sendEmail({
    bcc: recipients,
    subject: `${appName} New Shows Added`,
    html,
  });
};

module.exports = {
  sendBookingConfirmationEmail,
  sendNewShowPublishedEmail,
};
