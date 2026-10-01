'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, Brain, Check, Clock3, Crosshair, Layers3, LockKeyhole, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { PricingSection } from './PricingSection';

const matches = [
  ['18:30', 'Premier League', 'Man City', 'Arsenal', [61, 22, 17], '+4.1'],
  ['20:00', 'La Liga', 'Real Madrid', 'Atlético', [54, 26, 20], '+2.7'],
  ['20:45', 'Serie A', 'Inter', 'Juventus', [44, 30, 26], '+6.3'],
] as const;

function Probability({ values }: { values: readonly number[] }) {
  return <div className="flex h-1.5 overflow-hidden bg-muted" role="img" aria-label={`${values[0]} percent home, ${values[1]} percent draw, ${values[2]} percent away`}><span className="bg-primary" style={{ width: `${values[0]}%` }} /><span className="bg-hold" style={{ width: `${values[1]}%` }} /><span className="bg-down" style={{ width: `${values[2]}%` }} /></div>;
}

function HeroVisual() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block" aria-hidden="true">
      <div className="absolute right-[4%] top-1/4 h-[460px] w-[460px] rounded-full bg-primary/[0.07] blur-[110px]" />
      <img
        src="/images/matchwise-human-hero.png"
        alt=""
        className="absolute inset-y-0 right-0 h-full w-[66%] object-cover object-[46%_center] opacity-95 xl:w-[60%]"
      />
      <div className="absolute inset-y-0 right-0 h-full w-[66%] xl:w-[60%] bg-[linear-gradient(90deg,hsl(var(--background))_0%,hsl(var(--background)/.72)_16%,transparent_44%,transparent_78%,hsl(var(--background)/.55)_100%),linear-gradient(180deg,hsl(var(--background)/.4)_0%,transparent_20%,transparent_74%,hsl(var(--background))_100%)]" />
    </div>
  );
}

function HeroVisualMobile() {
  return (
    <div className="relative h-[360px] w-full overflow-hidden sm:h-[420px] lg:hidden" aria-hidden="true">
      <div className="absolute left-1/2 top-0 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-primary/[0.08] blur-[90px]" />
      <img
        src="/images/matchwise-human-hero.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[58%_32%] opacity-90 sm:object-[56%_34%]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--background)/.7)_14%,hsl(var(--background)/.25)_32%,transparent_50%,transparent_64%,hsl(var(--background))_100%),linear-gradient(90deg,hsl(var(--background)/.5)_0%,transparent_16%,transparent_84%,hsl(var(--background)/.5)_100%)]" />
    </div>
  );
}

function MatchIntelligence() {
  return <section className="border-y border-border bg-card py-16 md:py-20"><div className="mx-auto max-w-7xl px-4 md:px-6"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="section-title">Today's intelligence</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">The match, with context.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">A product preview of the fixture board. Open MatchWise for current schedules, model output, and live match context.</p></div><Link href="/matches" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-label text-primary hover:underline">Explore all matches <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div><div className="overflow-hidden rounded-lg border border-border"><div className="hidden grid-cols-[110px_1fr_120px_90px] gap-4 border-b border-border px-4 py-2 label md:grid"><span>Kickoff</span><span>Fixture</span><span>Model</span><span>Edge</span></div>{matches.map(([time, league, home, away, probs, edge]) => <div key={home} className="grid gap-3 border-b border-border px-4 py-4 last:border-0 md:grid-cols-[110px_1fr_120px_90px] md:items-center md:gap-4"><div><div className="num text-sm">{time}</div><div className="label mt-1">{league}</div></div><div><div className="font-display text-sm font-medium">{home} <span className="text-muted-foreground">v</span> {away}</div><div className="mt-2 md:hidden"><Probability values={probs} /></div></div><div className="hidden md:block"><div className="num text-xs"><span className="text-primary">{probs[0]}%</span> <span className="text-muted-foreground">/ {probs[1]}% /</span> <span className="text-down">{probs[2]}%</span></div><div className="mt-2"><Probability values={probs} /></div></div><div className="num text-sm font-semibold text-primary">▲ {edge}</div></div>)}</div></div></section>;
}

function AnalysisStory() {
  const steps = [{ icon: Crosshair, title: 'Context', body: 'Competition, kickoff, recent form, and home advantage establish the baseline.' }, { icon: Brain, title: 'Model', body: 'Signals are weighted across the fixture to produce probabilities for every market.' }, { icon: TrendingUp, title: 'Decision', body: 'Compare model probability with model-implied price and see where the signal is strongest.' }];
  return <section id="how-it-works" className="border-b border-border py-16 md:py-24"><div className="mx-auto max-w-7xl px-4 md:px-6"><div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start"><div><p className="section-title">How it works</p><h2 className="mt-3 max-w-md font-display text-3xl font-bold tracking-tight md:text-4xl">From fixture to informed read.</h2><p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">MatchWise keeps the analysis transparent. You see the inputs, the probability, and the reason behind the signal.</p><Link href="/predictions" className="mt-7 inline-flex h-11 items-center gap-2 rounded border border-border px-5 font-mono text-xs uppercase tracking-label hover:border-primary hover:text-primary">See prediction markets <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div><div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">{steps.map(({ icon: Icon, title, body }, i) => <div key={title} className="bg-card p-5"><div className="flex items-center justify-between"><Icon className="h-5 w-5 text-primary" aria-hidden="true" /><span className="num text-xs text-muted-foreground">0{i + 1}</span></div><h3 className="mt-8 font-display text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></div>)}</div></div></div></section>;
}

function MarketsSection() {
  const markets = ['Match result', 'Double chance', 'Over / under', 'Both teams score', 'Corners', 'Clean sheet', 'Correct score', 'Half-time result'];
  return <section className="border-b border-border bg-card py-16 md:py-20"><div className="mx-auto grid max-w-7xl gap-12 px-4 md:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-center"><div><p className="section-title">One fixture  -  18 markets</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">Go deeper than a pick.</h2><p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Move from the headline prediction into the market detail. MatchWise gives you a clearer view of what the data supports.</p><div className="mt-6 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded border border-primary/30 bg-primary/10 text-primary"><Layers3 className="h-4 w-4" aria-hidden="true" /></span><span className="text-sm">Probability-led, explainable analysis</span></div></div><div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">{markets.map((market, i) => <div key={market} className="bg-background p-4"><div className="num text-xs text-primary">{String(i + 1).padStart(2, '0')}</div><div className="mt-5 text-sm font-medium">{market}</div><div className="mt-2 label">modelled</div></div>)}</div></div></section>;
}

function WhySection() {
  return <section className="border-b border-border py-16 md:py-20"><div className="mx-auto max-w-7xl px-4 md:px-6"><div className="mb-10 max-w-xl"><p className="section-title">Why MatchWise</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">Built for a better matchday ritual.</h2></div><div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3"><div className="bg-card p-6"><Clock3 className="h-5 w-5 text-primary" aria-hidden="true" /><h3 className="mt-8 font-display text-lg font-semibold">Less noise</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">A focused read of the fixture instead of a wall of promotional odds.</p></div><div className="bg-card p-6"><BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" /><h3 className="mt-8 font-display text-lg font-semibold">More context</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Form, H2H, splits, market movement, and model confidence in one place.</p></div><div className="bg-card p-6"><ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" /><h3 className="mt-8 font-display text-lg font-semibold">No guarantees</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">A statistical analysis tool designed to make uncertainty visible.</p></div></div></div></section>;
}

export function LandingPage() {
  return <div className="flex min-h-screen flex-col bg-background text-foreground"><section className="relative overflow-hidden border-b border-border lg:flex lg:min-h-[620px] lg:items-center"><div className="absolute inset-0 pointer-events-none opacity-30 [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" /><HeroVisual /><div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-8 pt-14 md:px-6 lg:pb-0 lg:py-0"><div className="max-w-xl"><div className="flex items-center gap-3"><span className="tick border-primary/30 bg-primary/10 text-primary">FOOTBALL INTELLIGENCE</span><span className="label">AI  -  DATA  -  CONTEXT</span></div><h1 className="mt-7 font-display text-[clamp(3rem,7vw,6.5rem)] font-bold leading-[0.92] tracking-[-0.055em]">Understand<br /><span className="text-primary">the match.</span></h1><p className="mt-7 max-w-lg text-lg leading-8 text-muted-foreground">MatchWise turns every fixture into an explainable read  -  model probabilities, team context, and market signal side by side.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/matches" className="inline-flex h-12 items-center justify-center gap-2 rounded bg-primary px-6 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Explore matches <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded border border-border px-6 font-mono text-xs uppercase tracking-label hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Start free trial <Sparkles className="h-4 w-4" aria-hidden="true" /></Link></div><p className="mt-5 flex items-center gap-2 label"><LockKeyhole className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> 7-day trial  -  no card required</p></div></div><HeroVisualMobile /></section><MatchIntelligence /><AnalysisStory /><section className="relative overflow-hidden border-b border-border lg:flex lg:min-h-[560px] lg:items-center"><HeroVisual /><div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-16 pb-8 md:px-6 md:pt-24 lg:py-0"><div className="max-w-xl"><p className="section-title">Inside the read</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">A complete picture of the fixture.</h2><p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">Open any match to see why the model leans where it does, with the evidence kept close to the prediction.</p><div className="mt-7 grid grid-cols-2 gap-3 text-sm"><span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Recent form</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Head-to-head</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Home / away</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Market odds</span></div></div></div><HeroVisualMobile /></section><MarketsSection /><WhySection /><PricingSection /><section className="border-b border-border bg-card py-16 text-center md:py-20"><div className="mx-auto max-w-2xl px-4 md:px-6"><p className="section-title justify-center">Your next match starts here</p><h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-5xl">Read the signal.<br /><span className="text-primary">Make it yours.</span></h2><p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted-foreground">Explore today’s fixtures and see the analysis behind every MatchWise prediction.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/matches" className="inline-flex h-12 items-center justify-center gap-2 rounded bg-primary px-6 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90">Explore matches <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/register" className="inline-flex h-12 items-center justify-center rounded border border-border px-6 font-mono text-xs uppercase tracking-label hover:border-primary hover:text-primary">Create account</Link></div><p className="mt-5 label">Statistical analysis only  -  no prediction is guaranteed</p></div></section></div>;
}










