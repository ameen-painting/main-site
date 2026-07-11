export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route API requests for lead submissions
    if (url.pathname === '/api/submit-quote' && request.method === 'POST') {
      return handleQuoteSubmit(request, env);
    }

    // Fallback: serve static assets directly from binding
    return env.ASSETS.fetch(request);
  }
};

async function handleQuoteSubmit(request, env) {
  try {
    // 1. Verify Resend API Key
    const resendApiKey = env.RESEND_API_KEY;
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Resend API Key is not configured on the server.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse request payload (JSON or FormData)
    let data;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      const formData = await request.formData();
      data = Object.fromEntries(formData.entries());
    }

    const { name, phone, email, address, projectType, details } = data;

    // Validation
    if (!name || !phone || !email || !projectType) {
      return new Response(
        JSON.stringify({ error: 'Please provide all required fields (Name, Phone, Email, Project Type).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Helper to safely format text for HTML
    const escapeHtml = (unsafe) => {
      if (!unsafe) return '';
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const safeName = escapeHtml(name);
    const safePhone = escapeHtml(phone);
    const safeEmail = escapeHtml(email);
    const safeAddress = escapeHtml(address);
    const safeProjectType = escapeHtml(projectType);
    const safeDetails = escapeHtml(details);

    // 3. Construct premium brand-matching HTML template
    // Color Palette: Forest Green (#0C1C0C), Gold (#C9A84C), Gold Accent (#E2C97E), Card Dark Green (#192819)
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead - Ameen Painting</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f4f6f4;
      color: #1a261a;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      width: 100%;
      background-color: #f4f6f4;
      padding: 30px 15px;
      box-sizing: border-box;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(12, 28, 12, 0.08);
      border: 1px solid #dce4dc;
    }
    .email-header {
      background-color: #0C1C0C;
      padding: 35px 40px;
      text-align: center;
      border-bottom: 4px solid #C9A84C;
    }
    .email-header h1 {
      color: #F0EDE4;
      font-family: Georgia, serif;
      font-size: 26px;
      font-weight: 700;
      margin: 0;
      letter-spacing: 1px;
    }
    .email-header p {
      color: #C9A84C;
      font-size: 13px;
      margin: 8px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 600;
    }
    .email-body {
      padding: 40px;
    }
    .email-intro {
      font-size: 16px;
      line-height: 1.6;
      margin-top: 0;
      margin-bottom: 30px;
      color: #2b3a2b;
    }
    .field-card {
      background-color: #f9faf9;
      border: 1px solid #eef2ee;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
    }
    .field-row {
      margin-bottom: 20px;
      border-bottom: 1px solid #eef2ee;
      padding-bottom: 12px;
    }
    .field-row:last-child {
      margin-bottom: 0;
      border-bottom: none;
      padding-bottom: 0;
    }
    .field-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #7a827a;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .field-value {
      font-size: 16px;
      color: #0C1C0C;
      font-weight: 500;
    }
    .field-value a {
      color: #2D6A2D;
      text-decoration: none;
      font-weight: 600;
    }
    .field-value.highlight {
      color: #C9A84C;
      font-weight: 600;
    }
    .details-box {
      font-size: 15px;
      color: #2b3a2b;
      background-color: #ffffff;
      border: 1px solid #eef2ee;
      border-left: 4px solid #C9A84C;
      padding: 15px;
      border-radius: 4px;
      white-space: pre-wrap;
      margin-top: 8px;
      line-height: 1.6;
    }
    .action-container {
      text-align: center;
      margin-top: 35px;
      margin-bottom: 10px;
    }
    .btn-reply {
      background-color: #2D6A2D;
      color: #ffffff !important;
      padding: 14px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      display: inline-block;
      box-shadow: 0 4px 10px rgba(45, 106, 45, 0.2);
    }
    .email-footer {
      background-color: #0C1C0C;
      color: #9A9B8F;
      text-align: center;
      padding: 25px 40px;
      font-size: 12px;
      border-top: 1px solid #142014;
    }
    .email-footer a {
      color: #C9A84C;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <h1>Ameen Painting LLC</h1>
        <p>New Website Lead</p>
      </div>
      <div class="email-body">
        <p class="email-intro">Hi Nikita,</p>
        <p class="email-intro">A new free quote request has been submitted. Below are the customer and project details:</p>
        
        <div class="field-card">
          <div class="field-row">
            <div class="field-label">Customer Name</div>
            <div class="field-value">${safeName}</div>
          </div>
          
          <div class="field-row">
            <div class="field-label">Phone Number</div>
            <div class="field-value"><a href="tel:${safePhone}">${safePhone}</a></div>
          </div>
          
          <div class="field-row">
            <div class="field-label">Email Address</div>
            <div class="field-value"><a href="mailto:${safeEmail}">${safeEmail}</a></div>
          </div>
          
          <div class="field-row">
            <div class="field-label">Property Address</div>
            <div class="field-value">${safeAddress ? safeAddress : '<i>Not provided</i>'}</div>
          </div>

          <div class="field-row">
            <div class="field-label">Project Type</div>
            <div class="field-value highlight">${safeProjectType}</div>
          </div>

          <div class="field-row">
            <div class="field-label">Project Details</div>
            <div class="details-box">${safeDetails ? safeDetails : '<i>No additional details provided.</i>'}</div>
          </div>
        </div>

        <div class="action-container">
          <a href="mailto:${safeEmail}?subject=Re: Ameen Painting Quote Request&body=Hi ${safeName},%0D%0A%0D%0AThank you for contacting Ameen Painting! We received your quote request for ${safeProjectType.toLowerCase()} and we would love to learn more...%0D%0A%0D%0ABest regards,%0D%0AAmeen Painting Team" class="btn-reply">Reply directly to Customer</a>
        </div>
      </div>
      <div class="email-footer">
        <p>Sent via Ameen Painting Website Lead System &bull; Powered by Resend</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // 4. Submit POST to Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ameen Painting Leads <onboarding@resend.dev>',
        to: ['ameenpaintingteam@gmail.com'],
        reply_to: email, // Click reply to directly write back to the customer's email
        subject: `New Lead: ${name} (${projectType})`,
        html: htmlContent,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      return new Response(
        JSON.stringify({ error: `Resend API Error: ${errorText}` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resendData = await resendResponse.json();
    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Server Error: ${error.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
