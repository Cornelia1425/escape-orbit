export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 50%, #080e2a 0%, #020408 70%)",
      color: "#e0e8ff",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "60px 24px",
      boxSizing: "border-box",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <a
          href="/"
          style={{
            color: "#7a9fff",
            textDecoration: "none",
            fontSize: 14,
            letterSpacing: "0.04em",
          }}
        >
          ← Back to Escape Orbit
        </a>

        <h1 style={{
          marginTop: 40,
          fontSize: 32,
          fontWeight: 700,
          color: "#ffffff",
          letterSpacing: "-0.02em",
        }}>
          Privacy Policy
        </h1>
        <p style={{ color: "#7a9fff", fontSize: 14, marginTop: 4 }}>
          Escape Orbit Focus — Chrome Extension &amp; Website
        </p>
        <p style={{ color: "#8090b0", fontSize: 13, marginTop: 2 }}>
          Last updated: June 8, 2026
        </p>

        <Section title="Overview">
          Escape Orbit Focus is a Chrome extension that helps you stay focused by blocking
          Instagram while you run a mission on{" "}
          <a href="https://escape-orbit.vercel.app" style={{ color: "#7a9fff" }}>
            escape-orbit.vercel.app
          </a>
          . This page describes what data the extension and website collect — which is
          essentially nothing.
        </Section>

        <Section title="Data collected by the extension">
          The extension stores one piece of information locally on your device using{" "}
          <code style={codeStyle}>chrome.storage.local</code>:
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.9 }}>
            <li>Whether focus mode is currently active (a true/false flag)</li>
            <li>The source of focus mode ("manual" or "mission")</li>
            <li>A timestamp for when the current mission lease expires</li>
          </ul>
          This data never leaves your device. It is not sent to any server, is not shared
          with any third party, and is cleared automatically when focus mode ends.
        </Section>

        <Section title="Data collected by the website">
          The website stores a player name and mission state in a real-time multiplayer
          database (SpacetimeDB) so other pilots can see your ship flying alongside theirs.
          No account, email address, or personal information is required. The player name
          you choose is visible to other players in the same session.
        </Section>

        <Section title="Permissions used by the extension">
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.9 }}>
            <li>
              <strong style={{ color: "#c0d0ff" }}>declarativeNetRequest</strong> — redirects
              instagram.com to a blocked page while focus mode is active
            </li>
            <li>
              <strong style={{ color: "#c0d0ff" }}>storage</strong> — saves focus state locally
              on your device
            </li>
            <li>
              <strong style={{ color: "#c0d0ff" }}>tabs / webNavigation</strong> — detects when
              you navigate to Instagram so it can redirect you
            </li>
          </ul>
          The extension does not read the content of any web pages. It only redirects
          navigation to instagram.com.
        </Section>

        <Section title="Third-party services">
          The extension communicates only with{" "}
          <code style={codeStyle}>escape-orbit.vercel.app</code> (via{" "}
          <code style={codeStyle}>externally_connectable</code>) to receive enable/disable
          commands when you launch or end a mission. No data is sent — only simple control
          messages (enable focus, disable focus).
        </Section>

        <Section title="Contact">
          Questions? Reach out at{" "}
          <a href="mailto:yiranshu11@gmail.com" style={{ color: "#7a9fff" }}>
            yiranshu11@gmail.com
          </a>
          .
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 40 }}>
      <h2 style={{
        fontSize: 18,
        fontWeight: 600,
        color: "#c0d0ff",
        marginBottom: 12,
        letterSpacing: "-0.01em",
      }}>
        {title}
      </h2>
      <p style={{ lineHeight: 1.8, color: "#a0b4d0", fontSize: 15 }}>{children}</p>
    </div>
  );
}

const codeStyle: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: 13,
  background: "rgba(120,160,255,0.1)",
  padding: "1px 6px",
  borderRadius: 4,
  color: "#a0c4ff",
};
