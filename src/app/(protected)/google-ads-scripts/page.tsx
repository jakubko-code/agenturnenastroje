import { GoogleAdsScriptsLibrary } from "@/components/google-ads-scripts-library";

export default function GoogleAdsScriptsPage() {
  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>Google Ads Scripts</h1>
        <p>Tu nájdeš skripty, ktoré využiješ na stiahnutie dát pre potreby AI analýz.</p>
      </div>
      <GoogleAdsScriptsLibrary />
    </section>
  );
}
