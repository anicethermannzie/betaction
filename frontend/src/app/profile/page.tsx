'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Target, CheckCircle2, Flame, Trophy,
  Edit, LogOut, KeyRound, Trash2, Bell, BellRing, X,
} from 'lucide-react';
import { Button }    from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth }   from '@/hooks/useAuth';
import { cn, getInitials, formatFullDate } from '@/lib/utils';

import { StatsCard }         from '@/components/profile/StatsCard';
import { AccuracyChart }     from '@/components/profile/AccuracyChart';
import { PredictionHistory } from '@/components/profile/PredictionHistory';
import { FavoriteLeagues }   from '@/components/profile/FavoriteLeagues';
import type { AccuracyPoint }    from '@/components/profile/AccuracyChart';
import type { PredictionRecord } from '@/components/profile/PredictionHistory';
import type { UserLeague }       from '@/components/profile/FavoriteLeagues';

// ── Avatar color (hash-based, deterministic) ──────────────────────────────────

const AVATAR_COLORS = [
  'bg-emerald-600', 'bg-blue-600', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600',
];

function getAvatarBg(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Toggle (settings switch) ──────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full',
        'border-2 border-transparent transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        checked ? 'bg-emerald-500' : 'bg-slate-700'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md',
          'transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  );
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const ACCURACY_DATA: AccuracyPoint[] = [
  { period: 'W1', accuracy: 55 },
  { period: 'W2', accuracy: 62 },
  { period: 'W3', accuracy: 71 },
  { period: 'W4', accuracy: 58 },
  { period: 'W5', accuracy: 75 },
  { period: 'W6', accuracy: 68 },
  { period: 'W7', accuracy: 72 },
  { period: 'W8', accuracy: 70 },
];

const MOCK_HISTORY: PredictionRecord[] = [
  // ── Finished (W1-W2) ──────────────────────────────────────────────────────
  { id: 1,  fixtureId: 100301, homeTeam: 'Arsenal',          awayTeam: 'Chelsea',       leagueName: 'Premier League', date: '2026-03-02', prediction: 'HOME_WIN', probability: 0.64, actualScore: '2-1', status: 'correct'   },
  { id: 2,  fixtureId: 100302, homeTeam: 'Barcelona',        awayTeam: 'Real Madrid',   leagueName: 'La Liga',        date: '2026-03-02', prediction: 'DRAW',     probability: 0.35, actualScore: '1-1', status: 'correct'   },
  { id: 3,  fixtureId: 100303, homeTeam: 'Bayern Munich',    awayTeam: 'B. Dortmund',   leagueName: 'Bundesliga',     date: '2026-03-02', prediction: 'HOME_WIN', probability: 0.72, actualScore: '3-0', status: 'correct'   },
  { id: 4,  fixtureId: 100304, homeTeam: 'PSG',              awayTeam: 'Lyon',          leagueName: 'Ligue 1',        date: '2026-03-02', prediction: 'HOME_WIN', probability: 0.68, actualScore: '1-2', status: 'incorrect' },
  { id: 5,  fixtureId: 100305, homeTeam: 'Juventus',         awayTeam: 'AC Milan',      leagueName: 'Serie A',        date: '2026-03-02', prediction: 'DRAW',     probability: 0.38, actualScore: '0-0', status: 'correct'   },
  { id: 6,  fixtureId: 100306, homeTeam: 'Man City',         awayTeam: 'Liverpool',     leagueName: 'Premier League', date: '2026-02-23', prediction: 'HOME_WIN', probability: 0.55, actualScore: '1-2', status: 'incorrect' },
  { id: 7,  fixtureId: 100307, homeTeam: 'Atletico Madrid',  awayTeam: 'Valencia',      leagueName: 'La Liga',        date: '2026-02-23', prediction: 'HOME_WIN', probability: 0.61, actualScore: '2-0', status: 'correct'   },
  { id: 8,  fixtureId: 100308, homeTeam: 'Inter Milan',      awayTeam: 'Roma',          leagueName: 'Serie A',        date: '2026-02-23', prediction: 'AWAY_WIN', probability: 0.32, actualScore: '1-2', status: 'correct'   },
  { id: 9,  fixtureId: 100309, homeTeam: 'Bayer Leverkusen', awayTeam: 'RB Leipzig',    leagueName: 'Bundesliga',     date: '2026-02-23', prediction: 'HOME_WIN', probability: 0.58, actualScore: '3-1', status: 'correct'   },
  { id: 10, fixtureId: 100310, homeTeam: 'Monaco',           awayTeam: 'Marseille',     leagueName: 'Ligue 1',        date: '2026-02-23', prediction: 'HOME_WIN', probability: 0.52, actualScore: '0-1', status: 'incorrect' },
  // ── Pending (today / tomorrow) ────────────────────────────────────────────
  { id: 11, fixtureId: 100311, homeTeam: 'Tottenham',        awayTeam: 'Aston Villa',   leagueName: 'Premier League', date: '2026-03-03', prediction: 'HOME_WIN', probability: 0.54, status: 'pending' },
  { id: 12, fixtureId: 100312, homeTeam: 'Sevilla',          awayTeam: 'Real Betis',    leagueName: 'La Liga',        date: '2026-03-03', prediction: 'DRAW',     probability: 0.33, status: 'pending' },
  { id: 13, fixtureId: 100313, homeTeam: 'Napoli',           awayTeam: 'Fiorentina',    leagueName: 'Serie A',        date: '2026-03-03', prediction: 'HOME_WIN', probability: 0.61, status: 'pending' },
  { id: 14, fixtureId: 100314, homeTeam: 'B. Dortmund',      awayTeam: 'Schalke',       leagueName: 'Bundesliga',     date: '2026-03-03', prediction: 'HOME_WIN', probability: 0.70, status: 'pending' },
  { id: 15, fixtureId: 100315, homeTeam: 'Rennes',           awayTeam: 'OGC Nice',      leagueName: 'Ligue 1',        date: '2026-03-03', prediction: 'DRAW',     probability: 0.30, status: 'pending' },
  { id: 16, fixtureId: 100316, homeTeam: 'Man United',       awayTeam: 'Newcastle',     leagueName: 'Premier League', date: '2026-03-04', prediction: 'DRAW',     probability: 0.29, status: 'pending' },
  { id: 17, fixtureId: 100317, homeTeam: 'Real Sociedad',    awayTeam: 'Villarreal',    leagueName: 'La Liga',        date: '2026-03-04', prediction: 'HOME_WIN', probability: 0.47, status: 'pending' },
  { id: 18, fixtureId: 100318, homeTeam: 'Lazio',            awayTeam: 'Torino',        leagueName: 'Serie A',        date: '2026-03-04', prediction: 'HOME_WIN', probability: 0.62, status: 'pending' },
  { id: 19, fixtureId: 100319, homeTeam: 'VfB Stuttgart',    awayTeam: 'Eintracht',     leagueName: 'Bundesliga',     date: '2026-03-04', prediction: 'AWAY_WIN', probability: 0.44, status: 'pending' },
  { id: 20, fixtureId: 100320, homeTeam: 'PSG',              awayTeam: 'Strasbourg',    leagueName: 'Ligue 1',        date: '2026-03-04', prediction: 'HOME_WIN', probability: 0.77, status: 'pending' },
];

const USER_LEAGUES: UserLeague[] = [
  { id: 39,  name: 'Premier League',   country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', predictionCount: 47 },
  { id: 140, name: 'La Liga',          country: 'Spain',   flag: '🇪🇸',       predictionCount: 31 },
  { id: 78,  name: 'Bundesliga',       country: 'Germany', flag: '🇩🇪',       predictionCount: 24 },
  { id: 135, name: 'Serie A',          country: 'Italy',   flag: '🇮🇹',       predictionCount: 18 },
  { id: 2,   name: 'Champions League', country: 'Europe',  flag: '🏆',        predictionCount: 7  },
];

// ── Derived stats ─────────────────────────────────────────────────────────────

const finished = MOCK_HISTORY.filter((p) => p.status !== 'pending');
const correct  = MOCK_HISTORY.filter((p) => p.status === 'correct');
const accuracy = finished.length > 0
  ? Math.round((correct.length / finished.length) * 100)
  : 0;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [liveAlerts,  setLiveAlerts]  = useState(false);
  const [deleteMode,  setDeleteMode]  = useState(false);

  // Client-side auth guard
  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  if (!user) return null;

  const avatarBg = getAvatarBg(user.username);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 pb-12">

      {/* ── 1. Profile header ─────────────────────────────────────────────── */}
      <Card className="bg-slate-900 border-slate-800/60">
        <CardContent className="pt-6 pb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarFallback className={cn('text-xl font-bold text-white', avatarBg)}>
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{user.username}</h1>
              <p className="text-sm text-slate-400 truncate">{user.email}</p>
              {user.createdAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Member since {formatFullDate(user.createdAt)}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-muted-foreground hover:text-foreground hover:bg-slate-800/50"
                onClick={() => {}}
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-red-900/60 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
                onClick={logout}
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Logout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Stats overview ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatsCard
          icon={Target}
          value={MOCK_HISTORY.length}
          label="Total Predictions"
          trend="up"
        />
        <StatsCard
          icon={CheckCircle2}
          value={`${accuracy}%`}
          label="Accuracy"
          trend="up"
        />
        <StatsCard
          icon={Flame}
          value={5}
          label="Current Streak"
          trend="up"
        />
        <StatsCard
          icon={Trophy}
          value="Premier League"
          label="Favorite League"
        />
      </div>

      {/* ── 3. Accuracy chart ─────────────────────────────────────────────── */}
      <Card className="bg-slate-900 border-slate-800/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground/80">
            Prediction Accuracy Over Time
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <AccuracyChart data={ACCURACY_DATA} />
        </CardContent>
      </Card>

      {/* ── 4. Prediction history ─────────────────────────────────────────── */}
      <Card className="bg-slate-900 border-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground/80">
            Your Prediction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PredictionHistory predictions={MOCK_HISTORY} />
        </CardContent>
      </Card>

      {/* ── 5. Favorite leagues ───────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-foreground/80 mb-3">Your Leagues</h2>
        <FavoriteLeagues leagues={USER_LEAGUES} />
      </div>

      {/* ── 6. Account settings ───────────────────────────────────────────── */}
      <Card className="bg-slate-900 border-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground/80">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Email notifications */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Email notifications for predictions</p>
                <p className="text-xs text-muted-foreground">Receive alerts when new predictions are ready</p>
              </div>
            </div>
            <Toggle checked={emailNotifs} onChange={() => setEmailNotifs((v) => !v)} />
          </div>

          <Separator className="bg-slate-800/60" />

          {/* Live match alerts */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <BellRing className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Live match alerts</p>
                <p className="text-xs text-muted-foreground">Get notified for goals and final results</p>
              </div>
            </div>
            <Toggle checked={liveAlerts} onChange={() => setLiveAlerts((v) => !v)} />
          </div>

          <Separator className="bg-slate-800/60" />

          {/* Change password */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Change Password</p>
                <p className="text-xs text-muted-foreground">Update your account password</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-slate-700 text-muted-foreground hover:text-foreground hover:bg-slate-800/50"
              onClick={() => {}}
            >
              Change
            </Button>
          </div>

          <Separator className="bg-slate-800/60" />

          {/* Delete account */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <Trash2 className="h-4 w-4 text-red-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-red-400">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Permanently remove your account and all data</p>
                </div>
              </div>
              {!deleteMode && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-red-900/60 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
                  onClick={() => setDeleteMode(true)}
                >
                  Delete
                </Button>
              )}
            </div>

            {/* Inline confirmation */}
            {deleteMode && (
              <div className="bg-red-950/30 border border-red-900/40 rounded-lg p-3.5 space-y-2.5">
                <p className="text-sm font-semibold text-red-300">Are you sure?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This action cannot be undone. All your predictions, streaks, and account
                  data will be permanently deleted.
                </p>
                <div className="flex gap-2 pt-0.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-muted-foreground hover:text-foreground hover:bg-slate-800/50"
                    onClick={() => setDeleteMode(false)}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-500 text-white"
                    onClick={() => {
                      setDeleteMode(false);
                      logout();
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Yes, Delete Account
                  </Button>
                </div>
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
