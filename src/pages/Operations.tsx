import { useState, useMemo } from "react";
import { Activity, MapPin, Users, Zap } from "lucide-react";

interface ZoneMetrics {
  zone: string;
  activeJeebers: number;
  pendingOrders: number;
  avgDeliveryMin: number;
  incidentCount: number;
}

interface LiveIncident {
  id: string;
  type: "delay" | "cancellation" | "sos" | "system";
  zone: string;
  description: string;
  createdAt: number;
  severity: "low" | "medium" | "high";
}

const NOW = Date.parse("2026-05-16T10:30:00Z");
const HOUR = 3_600_000;
const MIN = 60_000;

const ZONES: ZoneMetrics[] = [
  { zone: "Beirut Central", activeJeebers: 42, pendingOrders: 18, avgDeliveryMin: 22, incidentCount: 1 },
  { zone: "Jounieh", activeJeebers: 15, pendingOrders: 7, avgDeliveryMin: 28, incidentCount: 0 },
  { zone: "Sidon", activeJeebers: 9, pendingOrders: 4, avgDeliveryMin: 35, incidentCount: 2 },
  { zone: "Tripoli", activeJeebers: 22, pendingOrders: 11, avgDeliveryMin: 25, incidentCount: 0 },
  { zone: "Byblos", activeJeebers: 6, pendingOrders: 2, avgDeliveryMin: 40, incidentCount: 0 },
];

const INCIDENTS: LiveIncident[] = [
  { id: "inc_01", type: "delay", zone: "Beirut Central", description: "3 orders delayed >45min in Hamra sector", createdAt: NOW - 15 * MIN, severity: "medium" },
  { id: "inc_02", type: "sos", zone: "Sidon", description: "Jeeber triggered emergency SOS button", createdAt: NOW - 22 * MIN, severity: "high" },
  { id: "inc_03", type: "cancellation", zone: "Sidon", description: "Spike in client cancellations (8 in 1hr)", createdAt: NOW - 45 * MIN, severity: "medium" },
  { id: "inc_04", type: "system", zone: "All", description: "GPS accuracy degraded — cloud cover", createdAt: NOW - 2 * HOUR, severity: "low" },
];

export function OperationsDashboardPage() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const totals = useMemo(() => ({
    jeebers: ZONES.reduce((s, z) => s + z.activeJeebers, 0),
    pending: ZONES.reduce((s, z) => s + z.pendingOrders, 0),
    avgTime: Math.round(ZONES.reduce((s, z) => s + z.avgDeliveryMin, 0) / ZONES.length),
    incidents: INCIDENTS.filter((i) => i.severity !== "low").length,
  }), []);

  return (
    <section className="mx-auto max-w-7xl px-8 py-10">
      <header className="border-b border-border-subtle pb-5">
        <h1 className="text-xl font-semibold text-fg">Live operations dashboard</h1>
        <p className="mt-1 text-sm text-fg-muted">Real-time view of active zones, Jeebers, and incidents.</p>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Active Jeebers" value={String(totals.jeebers)} icon={<Users size={18} />} />
        <MetricCard label="Pending orders" value={String(totals.pending)} icon={<Zap size={18} />} />
        <MetricCard label="Avg delivery" value={`${totals.avgTime} min`} icon={<Activity size={18} />} />
        <MetricCard label="Active incidents" value={String(totals.incidents)} icon={<MapPin size={18} />} accent={totals.incidents > 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-base font-semibold text-fg">Zone breakdown</h2>
          <div className="mt-3 overflow-hidden rounded-md border border-border-subtle bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-fg-faint">
                <tr>
                  <th className="px-4 py-2 font-medium">Zone</th>
                  <th className="px-4 py-2 font-medium">Jeebers</th>
                  <th className="px-4 py-2 font-medium">Pending</th>
                  <th className="px-4 py-2 font-medium">Avg time</th>
                  <th className="px-4 py-2 font-medium">Incidents</th>
                </tr>
              </thead>
              <tbody>
                {ZONES.map((z) => (
                  <tr
                    key={z.zone}
                    onClick={() => setSelectedZone(selectedZone === z.zone ? null : z.zone)}
                    className={`cursor-pointer border-t border-border-subtle align-middle hover:bg-hover ${selectedZone === z.zone ? "bg-selected" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium text-fg">{z.zone}</td>
                    <td className="px-4 py-3 text-fg-muted">{z.activeJeebers}</td>
                    <td className="px-4 py-3 text-fg-muted">{z.pendingOrders}</td>
                    <td className="px-4 py-3 text-fg-muted">{z.avgDeliveryMin} min</td>
                    <td className="px-4 py-3">
                      {z.incidentCount > 0 ? (
                        <span className="inline-flex h-5 items-center rounded-pill bg-danger/12 px-2 text-[10px] font-semibold text-danger">{z.incidentCount}</span>
                      ) : (
                        <span className="text-xs text-fg-faint">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-fg">Live incidents</h2>
          <div className="mt-3 space-y-2">
            {INCIDENTS.map((inc) => (
              <article key={inc.id} className={`rounded-md border p-4 ${inc.severity === "high" ? "border-danger/30 bg-danger/5" : inc.severity === "medium" ? "border-warning/30 bg-warning/5" : "border-border-subtle bg-surface"}`}>
                <div className="flex items-center gap-2">
                  <SeverityDot severity={inc.severity} />
                  <span className="text-xs font-medium uppercase text-fg-faint">{inc.type}</span>
                  <span className="text-xs text-fg-faint">· {inc.zone}</span>
                  <span className="ml-auto text-xs text-fg-faint">{formatRelative(inc.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-fg">{inc.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid h-64 place-items-center rounded-md border border-dashed border-border-subtle bg-surface-2">
        <div className="text-center">
          <MapPin size={32} className="mx-auto text-fg-faint" />
          <p className="mt-2 text-sm font-medium text-fg-muted">Live map view</p>
          <p className="text-xs text-fg-faint">Google Maps / Mapbox integration (T-web-006.1)</p>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <article className="rounded-md border border-border-subtle bg-surface p-4 shadow-elev-1">
      <div className={`flex items-center gap-2 ${accent ? "text-danger" : "text-fg-faint"}`}>{icon}<h2 className="text-xs font-medium uppercase tracking-wide">{label}</h2></div>
      <p className={`mt-1.5 text-lg font-semibold ${accent ? "text-danger" : "text-fg"}`}>{value}</p>
    </article>
  );
}

function SeverityDot({ severity }: { severity: LiveIncident["severity"] }) {
  const cls = severity === "high" ? "bg-danger" : severity === "medium" ? "bg-warning" : "bg-fg-faint";
  return <span className={`inline-block size-2 rounded-full ${cls}`} aria-label={`Severity: ${severity}`} />;
}

function formatRelative(ms: number): string {
  const diff = NOW - ms;
  if (diff < HOUR) return `${Math.max(1, Math.round(diff / MIN))}m ago`;
  if (diff < 24 * HOUR) return `${Math.floor(diff / HOUR)}h ago`;
  return new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}
