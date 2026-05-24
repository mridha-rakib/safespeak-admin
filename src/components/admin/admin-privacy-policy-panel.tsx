import { AdminLegalDocumentPanel } from "@/components/admin/admin-legal-document-panel";

const PRIVACY_POLICY_FALLBACK_HTML = [
  "<h2>SafeSpeak Privacy Policy</h2>",
  "<p>SafeSpeak collects only the information needed to provide secure reporting, support navigation, consent management, and account services.</p>",
  "<p>You can use SafeSpeak with an account or through supported anonymous sessions. Where anonymous use is available, personal identifying details are optional unless you choose to provide them.</p>",
  "<p>SafeSpeak asks for explicit consent before cloud sync, AI processing, transcription, analytics use, warm referrals, or external agency sharing.</p>",
  "<p>You may request access, export, correction, or deletion of eligible personal information from the privacy controls in your account.</p>",
].join("");

export function AdminPrivacyPolicyPanel() {
  return (
    <AdminLegalDocumentPanel
      pageKey="privacy-policy"
      title="Privacy Policy"
      fallbackHtml={PRIVACY_POLICY_FALLBACK_HTML}
      loadErrorMessage="Could not load privacy policy."
      saveSuccessMessage="Privacy policy draft saved. Publish when it is ready for users."
      publishSuccessMessage="Privacy policy published to the public frontend."
      saveErrorMessage="Could not save privacy policy draft."
      publishErrorMessage="Could not publish privacy policy."
    />
  );
}
