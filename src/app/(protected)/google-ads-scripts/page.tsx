import { GoogleAdsScriptsLibrary } from "@/components/google-ads-scripts-library";

export default function GoogleAdsScriptsPage() {
  return (
    <section className="tool-page">
      <div className="page-head">
        <h1>Google Ads Scripts</h1>
        <p>Na tejto stránke nájdeš skripty, ktoré si kolegovia môžu skopírovať a vložiť do Google Ads.</p>
      </div>
      <GoogleAdsScriptsLibrary />
    </section>
  );
}
