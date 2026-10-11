import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey || apiKey === "re_xxxxxxxxx" || !apiKey.startsWith("re_")) {
  console.error("\n❌ Error: Please set your real RESEND_API_KEY in your .env file!");
  console.error("   Open .env and replace 'RESEND_API_KEY=' with 'RESEND_API_KEY=re_your_real_key'\n");
  process.exit(1);
}

const resend = new Resend(apiKey);

async function main() {
  console.log("📨 Sending test email via Resend...");
  
  const from = "onboarding@resend.dev";
  const to = "abhijith.bloombiz@gmail.com";

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: "Hello World",
    html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
  });

  if (error) {
    console.error("❌ Email send failed:", error);
    process.exit(1);
  }

  console.log("✅ Email sent successfully!");
  console.log("   Message ID:", data?.id);
  console.log(`   Check your inbox at: ${to}`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
