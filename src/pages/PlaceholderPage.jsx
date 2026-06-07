import { Icon } from "../components/ui/Icon";

export function PlaceholderPage({ activePage }) {
  const title = {
    environments: "Environments",
    releases: "Releases",
    settings: "Project Settings",
  }[activePage];

  return (
    <section className="page">
      <div className="empty-panel">
        <Icon name={activePage === "releases" ? "rocket" : activePage === "settings" ? "gear" : "cloud"} size={42} />
        <h1>{title}</h1>
        <p>Placeholder UI untuk demo. Konfigurasi backend dan detail setup bisa kita lanjutkan setelah tampilan disetujui.</p>
      </div>
    </section>
  );
}
