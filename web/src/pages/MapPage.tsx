import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, PartyBadge } from "@/components/ui/badge";
import { getParty } from "@/lib/parties";
import { useCandidateRuns, useConstituencies } from "@/lib/data";

const DISTRICT_ORDER = [
  "Gilgit",
  "Nagar",
  "Hunza",
  "Ghizer",
  "Skardu",
  "Shigar",
  "Kharmang",
  "Ghanche",
  "Astore",
  "Diamer",
];

export function MapPage() {
  const constituenciesQ = useConstituencies();
  const runsQ = useCandidateRuns();

  const constituencies = constituenciesQ.data ?? [];
  const winners = (runsQ.data ?? []).filter(
    (r) => r.election_year === 2020 && r.won,
  );
  const winnerByCz = new Map(
    winners.map((w) => [w.constituency_id, w] as const),
  );

  const byDistrict = new Map<string, typeof constituencies>();
  for (const c of constituencies) {
    const arr = byDistrict.get(c.district) ?? [];
    arr.push(c);
    byDistrict.set(c.district, arr);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Map</h1>
        <p className="text-[color:var(--color-muted-foreground)] mt-2 max-w-xl">
          Interactive geographic map is a Day-10 deliverable (needs a GB
          GeoJSON file we have not sourced yet). In the meantime, this page
          groups the 24 constituencies by district with their 2020 winner.
        </p>
      </div>
      <Badge variant="muted">Awaiting GeoJSON</Badge>

      <div className="space-y-6">
        {DISTRICT_ORDER.filter((d) => byDistrict.has(d)).map((district) => {
          const items = (byDistrict.get(district) ?? []).slice().sort(
            (a, b) => {
              const ai = parseInt(a.constituency_id.split("-")[1], 10);
              const bi = parseInt(b.constituency_id.split("-")[1], 10);
              return ai - bi;
            },
          );
          return (
            <section key={district} className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight">{district}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((c) => {
                  const w = winnerByCz.get(c.constituency_id);
                  const meta = w ? getParty(w.party) : null;
                  return (
                    <Link key={c.constituency_id} to={`/constituency/${c.constituency_id}`}>
                      <Card className="hover:bg-[color:var(--color-muted)] transition-colors">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-mono text-sm">
                                {c.constituency_id}
                              </p>
                              <p className="text-base">{c.name}</p>
                            </div>
                            {meta && (
                              <PartyBadge
                                party={meta.shortDisplay}
                                color={meta.color}
                                textOnColor={meta.textOnColor}
                              />
                            )}
                          </div>
                          {w && (
                            <p className="text-xs text-[color:var(--color-muted-foreground)] mt-2">
                              2020: {w.candidate_name}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
