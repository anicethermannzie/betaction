'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Share2, Clock,
  Trophy, TrendingUp, BarChart3,
  Users, Activity, Repeat2,
} from 'lucide-react';

import { matchApi, predictionApi }  from '@/lib/api';
import { useLiveScores }            from '@/hooks/useLiveScores';
import { getSocket }                from '@/lib/socket';

import { PredictionChart }     from '@/components/predictions/PredictionChart';
import { PredictionBadge }     from '@/components/predictions/PredictionBadge';
import { ConfidenceMeter }     from '@/components/predictions/ConfidenceMeter';
import { AlgorithmBreakdown }  from '@/components/predictions/AlgorithmBreakdown';
import { FormDisplay }         from '@/components/predictions/FormDisplay';
import { H2HDisplay }          from '@/components/predictions/H2HDisplay';
import { StatsComparison }     from '@/components/predictions/StatsComparison';
import { OddsComparison }      from '@/components/predictions/OddsComparison';
import { LiveBadge }           from '@/components/matches/LiveBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button }              from '@/components/ui/button';

import {
  cn, formatTime, formatMatchDate,
  isMatchLive, isMatchHalftime, isMatchFinished,
  getPredictionColors, getInitials,
} from '@/lib/utils';

import {
  MOCK_FIXTURES_BY_DATE, MOCK_PREDICTION_MAP, MOCK_DETAIL, MOCK_PREDICTIONS,
} from '@/lib/mockData';
import type { ApiFixture, Prediction, LiveScorePayload } from '@/types';

// ── Loading skeleton ──────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="px-4 md:px-6 py-6 max-w-3xl mx-auto space-y-5 animate-pulse">
      <div className="h-8 w-32 bg-muted rounded-lg" />
      <div className="h-52 rounded-2xl bg-muted" />
      <div className="h-64 rounded-xl bg-muted" />
      <div className="h-48 rounded-xl bg-muted" />
    </div>
  );
}

// ── Match hero ────────────────────────────────────────────────────────────────

function MatchHero({ fixture, prediction }: { fixture: ApiFixture; prediction: Prediction | null }) {
  const { fixture: f, league, teams, goals } = fixture;
  const live     = isMatchLive(f.status.short);
  const halftime = isMatchHalftime(f.status.short);
  const finished = isMatchFinished(f.status.short);
  const inPlay   = live || halftime;
  const hasScore = goals.home !== null && goals.away !== null;

  const gradientClass =
    prediction?.prediction === 'HOME_WIN' ? 'from-emerald-950/70 via-slate-900/95 to-slate-900/90' :
    prediction?.prediction === 'AWAY_WIN' ? 'from-slate-900/90 via-slate-900/95 to-red-950/70'    :
    prediction?.prediction === 'DRAW'     ? 'from-amber-950/40 via-slate-900/95 to-amber-950/40'   :
    'from-slate-900/95 via-slate-900/90 to-slate-900/95';

  return (
    <div className={cn(
      'relative rounded-2xl overflow-hidden border border-border/50 p-6',
      `bg-gradient-to-r ${gradientClass}`
    )}>
      {/* Ambient glow */}
      {prediction?.prediction === 'HOME_WIN' && (
        <div className="absolute -left-12 -top-12 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      )}
      {prediction?.prediction === 'AWAY_WIN' && (
        <div className="absolute -right-12 -top-12 w-44 h-44 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* League + date */}
      <div className="flex items-center justify-center gap-2 mb-5 text-sm text-muted-foreground">
        {league.logo && (
          <Image src={league.logo} alt={league.name} width={16} height={16} className="object-contain opacity-80" />
        )}
        <span>{league.name}</span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {inPlay ? `${f.status.elapsed ?? 0}'` : formatMatchDate(f.date)}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Home */}
        <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
          {teams.home.logo ? (
            <Image src={teams.home.logo} alt={teams.home.name} width={72} height={72} className="object-contain drop-shadow-lg" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center text-lg font-black text-muted-foreground">
              {getInitials(teams.home.name)}
            </div>
          )}
          <p className="text-sm sm:text-base font-bold text-center leading-tight">{teams.home.name}</p>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Home</span>
        </div>

        {/* Centre */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          {inPlay && <LiveBadge elapsed={f.status.elapsed} />}
          {hasScore ? (
            <p className={cn(
              'font-black tabular-nums',
              inPlay ? 'text-3xl sm:text-4xl text-primary' : 'text-2xl sm:text-3xl text-foreground'
            )}>
              {goals.home} – {goals.away}
            </p>
          ) : (
            <p className="text-xl sm:text-2xl font-bold text-primary">{formatTime(f.date)}</p>
          )}
          {halftime && <span className="text-[11px] text-amber-400 font-semibold">Half Time</span>}
          {finished && <span className="text-xs text-muted-foreground font-medium">Full Time</span>}
        </div>

        {/* Away */}
        <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
          {teams.away.logo ? (
            <Image src={teams.away.logo} alt={teams.away.name} width={72} height={72} className="object-contain drop-shadow-lg" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center text-lg font-black text-muted-foreground">
              {getInitials(teams.away.name)}
            </div>
          )}
          <p className="text-sm sm:text-base font-bold text-center leading-tight">{teams.away.name}</p>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Away</span>
        </div>
      </div>
    </div>
  );
}

// ── Similar prediction card ───────────────────────────────────────────────────

function SimilarCard({ prediction }: { prediction: Prediction }) {
  const colors = getPredictionColors(prediction.prediction);
  const outcomeLabel =
    prediction.prediction === 'HOME_WIN' ? 'Home Win' :
    prediction.prediction === 'AWAY_WIN' ? 'Away Win' : 'Draw';
  const confColor =
    prediction.confidence === 'high'   ? 'text-emerald-400' :
    prediction.confidence === 'medium' ? 'text-amber-400'   :
    'text-red-400';

  return (
    <Link href={`/predictions/${prediction.fixture_id}`}>
      <div className="w-44 shrink-0 rounded-xl border border-border/60 bg-card/50 p-3.5 space-y-3 hover:border-primary/40 transition-colors cursor-pointer">
        <div className="space-y-1 text-center">
          <p className="text-xs font-semibold truncate">{prediction.home_team}</p>
          <p className="text-[10px] text-muted-foreground">vs</p>
          <p className="text-xs font-semibold truncate">{prediction.away_team}</p>
        </div>
        <div className="text-center">
          <span className={cn('text-[11px] font-bold rounded-full px-2.5 py-1 border', colors.text, colors.bg, colors.border)}>
            {outcomeLabel}
          </span>
        </div>
        <p className={cn('text-[10px] text-center capitalize', confColor)}>
          {prediction.confidence} confidence
        </p>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PredictionPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const router      = useRouter();
  const fixtureId   = parseInt(matchId, 10);

  const [fixture,    setFixture]    = useState<ApiFixture | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [copied,     setCopied]     = useState(false);

  // ── Fetch fixture + prediction ────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    const allMock = Object.values(MOCK_FIXTURES_BY_DATE).flat();

    Promise.allSettled([
      matchApi.byId(fixtureId),
      predictionApi.forMatch(fixtureId),
    ]).then(([fixRes, predRes]) => {
      if (fixRes.status === 'fulfilled') {
        const d   = fixRes.value.data;
        const res = (d as { response: ApiFixture[] }).response;
        setFixture(res?.[0] ?? null);
      } else {
        setFixture(allMock.find((f) => f.fixture.id === fixtureId) ?? null);
      }

      if (predRes.status === 'fulfilled') {
        const d = predRes.value.data;
        setPrediction((d as { data?: Prediction })?.data ?? (d as Prediction) ?? null);
      } else {
        setPrediction(MOCK_PREDICTION_MAP.get(fixtureId) ?? null);
      }
    }).finally(() => setIsLoading(false));
  }, [fixtureId]);

  // ── Live score updates ────────────────────────────────────────────────────
  useLiveScores(fixtureId);

  useEffect(() => {
    const socket = getSocket();
    const handler = (payload: LiveScorePayload) => {
      if (payload.matchId !== fixtureId) return;
      setFixture((prev) => prev ? {
        ...prev,
        goals: { home: payload.score.home, away: payload.score.away },
        fixture: {
          ...prev.fixture,
          status: { ...prev.fixture.status, elapsed: payload.minute, short: payload.status },
        },
      } : prev);
    };
    socket.on('live:score', handler);
    return () => { socket.off('live:score', handler); };
  }, [fixtureId]);

  // ── Share ─────────────────────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const detail  = MOCK_DETAIL[fixtureId] ?? null;
  const similar = MOCK_PREDICTIONS.filter((p) => p.fixture_id !== fixtureId).slice(0, 5);

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) return <PageSkeleton />;

  if (!fixture && !prediction) {
    return (
      <div className="px-4 md:px-6 py-16 max-w-3xl mx-auto flex flex-col items-center gap-4 text-center">
        <Trophy className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">Match not found.</p>
        <Button variant="outline" onClick={() => router.push('/matches')}>Back to matches</Button>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-3xl mx-auto space-y-5">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/matches" className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
          <Share2 className="h-3.5 w-3.5" />
          {copied ? 'Copied!' : 'Share'}
        </Button>
      </div>

      {/* ── 1. Match hero ── */}
      {fixture && <MatchHero fixture={fixture} prediction={prediction} />}

      {prediction && (
        <>
          {/* ── 2. Prediction overview ── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">AI Prediction</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <PredictionChart prediction={prediction} />
              <div className="flex flex-col items-center gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground">Our Prediction</span>
                <PredictionBadge
                  prediction={prediction.prediction}
                  homeTeam={prediction.home_team}
                  awayTeam={prediction.away_team}
                  className="text-sm px-4 py-1.5"
                />
              </div>
              <ConfidenceMeter confidence={prediction.confidence} />
            </CardContent>
          </Card>

          {/* ── 3. Algorithm breakdown ── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">How We Predicted This</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <AlgorithmBreakdown prediction={prediction} />
            </CardContent>
          </Card>
        </>
      )}

      {/* ── 4. Recent form ── */}
      {detail && fixture && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Recent Form (Last 5)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <FormDisplay
              homeTeam={fixture.teams.home.name}
              awayTeam={fixture.teams.away.name}
              homeForm={detail.homeForm}
              awayForm={detail.awayForm}
            />
          </CardContent>
        </Card>
      )}

      {/* ── 5. Head to head ── */}
      {detail && fixture && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Repeat2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Head to Head</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <H2HDisplay
              homeTeam={fixture.teams.home.name}
              awayTeam={fixture.teams.away.name}
              h2h={detail.h2h}
            />
          </CardContent>
        </Card>
      )}

      {/* ── 6. Team statistics ── */}
      {detail && prediction && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Team Statistics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <StatsComparison
              homeTeam={prediction.home_team}
              awayTeam={prediction.away_team}
              homeStats={detail.homeStats}
              awayStats={detail.awayStats}
            />
          </CardContent>
        </Card>
      )}

      {/* ── 7. Odds comparison ── */}
      {detail?.odds && prediction && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bookmaker Odds</CardTitle>
          </CardHeader>
          <CardContent>
            <OddsComparison odds={detail.odds} prediction={prediction} />
          </CardContent>
        </Card>
      )}

      {/* ── 8. Similar predictions ── */}
      {similar.length > 0 && (
        <section>
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            More Predictions
          </h2>
          <div
            className="flex gap-3 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {similar.map((p) => (
              <SimilarCard key={p.fixture_id} prediction={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Disclaimer ── */}
      <p className="text-[11px] text-muted-foreground/50 text-center pb-4 px-4">
        Predictions are generated by an algorithm for informational purposes only
        and do not constitute betting advice.
      </p>

    </div>
  );
}
