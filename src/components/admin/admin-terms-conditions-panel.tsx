import { AdminLegalDocumentPanel } from "@/components/admin/admin-legal-document-panel";

const TERMS_CONDITIONS_FALLBACK_HTML = [
  "<h2>SafeSpeak Terms of Use</h2>",
  "<p>SafeSpeak provides safety-aware reporting, evidence organization, support navigation, and information-only AI assistance.</p>",
  "<p>If you or someone else is in immediate danger, call 000 or your local emergency number. Use SafeSpeak only when it is safe for you to do so.</p>",
  "<p>You are responsible for reviewing all AI-assisted drafts, summaries, and recommendations before saving or sharing them.</p>",
  "<p>External report submission, warm referral, and agency sharing happen only through supported workflows and required consent.</p>",
].join("");

export function AdminTermsConditionsPanel() {
  return (
    <AdminLegalDocumentPanel
      pageKey="terms-conditions"
      title="Terms & Conditions"
      fallbackHtml={TERMS_CONDITIONS_FALLBACK_HTML}
      loadErrorMessage="Could not load terms & conditions."
      saveSuccessMessage="Terms & conditions draft saved. Publish when it is ready for users."
      publishSuccessMessage="Terms & conditions published to the public frontend."
      saveErrorMessage="Could not save terms & conditions draft."
      publishErrorMessage="Could not publish terms & conditions."
    />
  );
}
