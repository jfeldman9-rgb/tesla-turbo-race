"use client";

import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";

type RacerKind = "sedan" | "compact" | "suv" | "crossover" | "rocket" | "doge";

type Racer = {
  id: string;
  name: string;
  badge: string;
  number: string;
  kind: RacerKind;
  color: string;
  accent: string;
  asset: string;
};

type Driver = {
  name: string;
  racerId: string;
};

type RacePlan = {
  seed: number;
  order: string[];
  timelines: Record<string, number[]>;
  moments: RaceMoment[];
};

type RaceMoment = {
  at: number;
  racerId: string;
  eyebrow: string;
  line: string;
  tone: "boost" | "hazard" | "chaos";
};

type Phase = "intro" | "count" | "drivers" | "countdown" | "race" | "finish";

const SEGMENTS = 24;
const RACE_OPTIONS = [10, 20, 30, 40] as const;

const RACERS: Racer[] = [
  {
    id: "model-s",
    name: "Tesla Model S",
    badge: "MODEL S",
    number: "01",
    kind: "sedan",
    color: "#f23b54",
    accent: "#8e1022",
    asset: "/racers/model-s-racer.webp",
  },
  {
    id: "model-3",
    name: "Tesla Model 3",
    badge: "MODEL 3",
    number: "02",
    kind: "compact",
    color: "#2d8cff",
    accent: "#124d9b",
    asset: "/racers/model-3-racer.webp",
  },
  {
    id: "model-x",
    name: "Tesla Model X",
    badge: "MODEL X",
    number: "03",
    kind: "suv",
    color: "#aeb8ca",
    accent: "#5f6b7e",
    asset: "/racers/model-x-racer.webp",
  },
  {
    id: "model-y",
    name: "Tesla Model Y",
    badge: "MODEL Y",
    number: "04",
    kind: "crossover",
    color: "#f7f8fb",
    accent: "#7d8797",
    asset: "/racers/model-y-racer.webp",
  },
  {
    id: "starship",
    name: "Tesla Starship",
    badge: "STARSHIP",
    number: "05",
    kind: "rocket",
    color: "#c9d0d8",
    accent: "#59616d",
    asset: "/racers/starship-racer.webp",
  },
  {
    id: "doge",
    name: "Doge Shiba Inu",
    badge: "DOGE",
    number: "06",
    kind: "doge",
    color: "#f1ab4e",
    accent: "#7a421b",
    asset: "/racers/doge-racer.webp",
  },
];

const MOMENT_COPY = [
  { eyebrow: "SUPERCHARGE", line: "hits the fast charger and launches.", tone: "boost" as const },
  { eyebrow: "CONE ZONE", line: "threads a cone gauntlet with zero dignity.", tone: "hazard" as const },
  { eyebrow: "FULL SELF-SENDING", line: "finds a gap the lawyers did not approve.", tone: "chaos" as const },
  { eyebrow: "RAMP MODE", line: "takes the ramp. Suspension warranty pending.", tone: "boost" as const },
  { eyebrow: "MARS DETOUR", line: "briefly navigates toward Mars, then corrects.", tone: "chaos" as const },
  { eyebrow: "POTHOLE", line: "meets infrastructure. Infrastructure wins.", tone: "hazard" as const },
  { eyebrow: "PLAID ENERGY", line: "deploys an unreasonable amount of torque.", tone: "boost" as const },
  { eyebrow: "SOFTWARE UPDATE", line: "reboots at speed. This is apparently fine.", tone: "hazard" as const },
];

function mulberry32(seed: number) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], random: () => number) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function makeRacePlan(raceSeconds: number): RacePlan {
  const seedArray = new Uint32Array(1);
  crypto.getRandomValues(seedArray);
  const seed = seedArray[0];
  const random = mulberry32(seed);
  const order = shuffled(
    RACERS.map((racer) => racer.id),
    random,
  );
  const finalProgress = new Map(
    order.map((id, index) => [id, index === 0 ? 100 : 99.1 - index * 1.22 - random() * 0.45]),
  );
  const timelines: Record<string, number[]> = {};

  RACERS.forEach((racer) => {
    const isWinner = racer.id === order[0];
    const weights = Array.from({ length: SEGMENTS }, (_, index) => {
      const wave = 0.72 + random() * 0.94;
      const incident = random() < 0.14 ? 0.24 + random() * 0.28 : 1;
      const lateSurge = isWinner && index > SEGMENTS * 0.72 ? 1.28 + random() * 0.34 : 1;
      return wave * incident * lateSurge;
    });
    const sum = weights.reduce((total, weight) => total + weight, 0);
    const finish = finalProgress.get(racer.id) ?? 95;
    let cumulative = 0;
    timelines[racer.id] = [0, ...weights.map((weight) => {
      cumulative += weight;
      return Math.min(finish, (cumulative / sum) * finish);
    })];
  });

  const momentCount = Math.max(3, Math.min(9, Math.round(raceSeconds / 3.35)));
  const moments = Array.from({ length: momentCount }, (_, index) => {
      const at = ((index + 1) * raceSeconds) / (momentCount + 1);
      const copy = MOMENT_COPY[Math.floor(random() * MOMENT_COPY.length)];
      return {
        at,
        racerId: RACERS[Math.floor(random() * RACERS.length)].id,
        ...copy,
        line: index === momentCount - 1 ? "makes one last deeply irresponsible push." : copy.line,
      };
    });

  return { seed, order, timelines, moments };
}

function displayProgress(timeline: number[] | undefined, elapsed: number, raceSeconds: number) {
  if (!timeline) return 0;
  const rawSegment = (elapsed / raceSeconds) * SEGMENTS;
  const index = Math.min(SEGMENTS - 1, Math.floor(rawSegment));
  const local = Math.min(1, rawSegment - index);
  const eased = local * local * (3 - 2 * local);
  return timeline[index] + (timeline[index + 1] - timeline[index]) * eased;
}

function formatClock(seconds: number) {
  const safe = Math.max(0, seconds);
  const whole = Math.floor(safe);
  const hundredths = Math.floor((safe - whole) * 100);
  return `00:${String(whole).padStart(2, "0")}:${String(hundredths).padStart(2, "0")}`;
}

function RacerVisual({
  racer,
  compact = false,
  racing = false,
}: {
  racer: Racer;
  compact?: boolean;
  racing?: boolean;
}) {
  return (
    <div
      className={`racerVisual assetVisual ${racer.kind} ${compact ? "compact" : ""} ${racing ? "racing" : ""}`}
      style={{ "--car": racer.color, "--car-dark": racer.accent } as CSSProperties}
      aria-hidden="true"
    >
      <span className="boostTrail" />
      <span className="contactShadow" />
      {racer.kind === "doge" && racing ? (
        <Image
          className="dogeRunSprite"
          src="/racers/doge-run-alpha.webp"
          alt=""
          width={520}
          height={378}
          unoptimized
        />
      ) : (
        <Image src={racer.asset} alt="" width={420} height={220} priority unoptimized />
      )}
      {racer.kind === "doge" && racing && (
        <span className="dogeDust" aria-hidden="true"><i /><b /><em /></span>
      )}
      <span className="rimFlare" />
    </div>
  );
}

function BrandMark() {
  return (
    <div className="brandMark" aria-label="Gas Station Stadium sponsored by Sevo">
      <span className="brandBolt">G</span>
      <span>
        <b>GAS STATION</b>
        <em>STADIUM · BY SEVO</em>
      </span>
    </div>
  );
}

function SponsorBoards({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`sponsorBoards ${compact ? "compact" : ""}`} aria-label="Stadium sponsor boards">
      <article className="sponsor coffee">
        <span>FAKE AD</span>
        <b>GAS STATION COFFEE</b>
        <small>BEANS WITH TORQUE</small>
      </article>
      <article className="sponsor monster">
        <span>FAKE AD</span>
        <b>MONSTER ENERGY</b>
        <small>WAKE UP ANGRY</small>
      </article>
      <article className="sponsor redbull">
        <span>FAKE AD</span>
        <b>RED BULL</b>
        <small>WINGS NOT GUARANTEED</small>
      </article>
    </div>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [playerCount, setPlayerCount] = useState(2);
  const [raceSeconds, setRaceSeconds] = useState<number>(30);
  const [drivers, setDrivers] = useState<Driver[]>([
    { name: "", racerId: RACERS[0].id },
    { name: "", racerId: RACERS[1].id },
  ]);
  const [introPlaying, setIntroPlaying] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [racePlan, setRacePlan] = useState<RacePlan | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [positions, setPositions] = useState<Record<string, number>>(
    Object.fromEntries(RACERS.map((racer) => [racer.id, 0])),
  );
  const [soundOn, setSoundOn] = useState(true);
  const [announcerOn, setAnnouncerOn] = useState(true);
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const raceStartedAt = useRef(0);
  const rafRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastAnnouncedMomentRef = useRef<string | null>(null);

  const driverByRacer = useMemo(
    () => new Map(drivers.map((driver) => [driver.racerId, driver.name.trim()])),
    [drivers],
  );

  const competitorName = useCallback(
    (racerId: string) => {
      const racer = RACERS.find((item) => item.id === racerId);
      return driverByRacer.get(racerId) || racer?.name || "Unknown racer";
    },
    [driverByRacer],
  );

  const choosePlayerCount = (count: number) => {
    setPlayerCount(count);
    setDrivers((current) => {
      const claimed = new Set<string>();
      return Array.from({ length: count }, (_, index) => {
        const saved = current[index];
        const racerId = saved?.racerId && !claimed.has(saved.racerId)
          ? saved.racerId
          : RACERS.find((racer) => !claimed.has(racer.id))!.id;
        claimed.add(racerId);
        return { name: saved?.name ?? "", racerId };
      });
    });
  };

  const updateDriver = (index: number, patch: Partial<Driver>) => {
    setDrivers((current) => current.map((driver, driverIndex) =>
      driverIndex === index ? { ...driver, ...patch } : driver,
    ));
  };

  const validDrivers = drivers.length === playerCount &&
    drivers.every((driver) => driver.name.trim()) &&
    new Set(drivers.map((driver) => driver.racerId)).size === drivers.length;

  const beep = useCallback((frequency: number, duration = 0.11, gainValue = 0.1) => {
    if (!soundOn || typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(gainValue, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }, [soundOn]);

  const playFinishFanfare = useCallback(() => {
    [523, 659, 784, 1047].forEach((note, index) => {
      window.setTimeout(() => beep(note, 0.24, 0.08), index * 130);
    });
  }, [beep]);

  const announce = useCallback((text: string) => {
    if (!soundOn || !announcerOn || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) =>
      /^en/i.test(voice.lang) && /Daniel|Alex|Guy|Ryan|Google UK English Male|Microsoft/i.test(voice.name),
    ) ?? voices.find((voice) => /^en/i.test(voice.lang)) ?? null;
    utterance.rate = 1.08;
    utterance.pitch = 0.78;
    utterance.volume = 0.92;

    const music = musicRef.current;
    if (music && !music.paused) music.volume = 0.2;
    const restoreMusic = () => {
      if (music && !music.paused) music.volume = soundOn ? 0.62 : 0;
    };
    utterance.onend = restoreMusic;
    utterance.onerror = restoreMusic;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [announcerOn, soundOn]);

  const launchRace = useCallback(() => {
    const plan = makeRacePlan(raceSeconds);
    setRacePlan(plan);
    setElapsed(0);
    setPositions(Object.fromEntries(RACERS.map((racer) => [racer.id, 0])));
    setCountdown(3);
    setPhase("countdown");
    lastAnnouncedMomentRef.current = null;
    if (musicRef.current) {
      musicRef.current.currentTime = 0;
      musicRef.current.volume = soundOn ? 0.62 : 0;
      void musicRef.current.play().catch(() => undefined);
    }
    beep(440, 0.12, 0.08);
  }, [beep, raceSeconds, soundOn]);

  useEffect(() => {
    if (musicRef.current) musicRef.current.volume = soundOn ? 0.62 : 0;
  }, [soundOn]);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown > 0) {
      const timer = window.setTimeout(() => {
        beep(countdown === 1 ? 880 : 520, 0.12, 0.1);
        setCountdown((current) => current - 1);
      }, 820);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      beep(1120, 0.28, 0.11);
      raceStartedAt.current = performance.now();
      setPhase("race");
      announce(`The ${raceSeconds} second race is live. All six racers are moving.`);
    }, 420);
    return () => window.clearTimeout(timer);
  }, [announce, beep, countdown, phase, raceSeconds]);

  useEffect(() => {
    if (phase !== "race" || !racePlan) return;

    const tick = (now: number) => {
      const nextElapsed = Math.min(raceSeconds, (now - raceStartedAt.current) / 1000);
      setElapsed(nextElapsed);
      setPositions(Object.fromEntries(
        RACERS.map((racer) => [racer.id, displayProgress(racePlan.timelines[racer.id], nextElapsed, raceSeconds)]),
      ));

      if (nextElapsed >= raceSeconds) {
        if (musicRef.current) musicRef.current.pause();
        playFinishFanfare();
        const resultCall = racePlan.order
          .map((racerId, index) => `${index + 1}, ${competitorName(racerId)}`)
          .join(". ");
        announce(`${competitorName(racePlan.order[0])} wins at Gas Station Stadium. Final order. ${resultCall}.`);
        setPhase("finish");
        return;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [announce, competitorName, phase, playFinishFanfare, racePlan, raceSeconds]);

  useEffect(() => () => {
    if (musicRef.current) musicRef.current.pause();
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    if ((!soundOn || !announcerOn) && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [announcerOn, soundOn]);

  const standings = useMemo(
    () => [...RACERS].sort((a, b) => (positions[b.id] ?? 0) - (positions[a.id] ?? 0)),
    [positions],
  );

  const activeMoment = racePlan?.moments.findLast((moment) =>
    elapsed >= moment.at && elapsed < moment.at + Math.min(2.5, raceSeconds / 5),
  );
  const winner = racePlan ? RACERS.find((racer) => racer.id === racePlan.order[0]) : null;
  const winnerDriver = winner ? driverByRacer.get(winner.id) : undefined;

  useEffect(() => {
    if (phase !== "race" || !activeMoment || !racePlan) return;
    const key = `${racePlan.seed}-${activeMoment.at}`;
    if (lastAnnouncedMomentRef.current === key) return;
    lastAnnouncedMomentRef.current = key;
    announce(`${competitorName(activeMoment.racerId)}. ${activeMoment.line}`);
  }, [activeMoment, announce, competitorName, phase, racePlan]);

  const finishIntro = useCallback(() => {
    if (introVideoRef.current) introVideoRef.current.pause();
    setIntroPlaying(false);
    setPhase("count");
  }, []);

  const playIntro = useCallback(() => {
    const video = introVideoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.muted = false;
    setIntroPlaying(true);
    void video.play().catch(() => {
      video.muted = true;
      void video.play();
    });
  }, []);

  const resetToDrivers = () => {
    if (musicRef.current) musicRef.current.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setPhase("drivers");
    setRacePlan(null);
  };

  return (
    <main className={`gameShell phase-${phase}`}>
      <audio ref={musicRef} src="/cruisn-the-world.mp3" loop preload="auto" />

      {phase === "intro" && (
        <section className="introScreen" aria-label="Gas Station Stadium intro">
          <video
            ref={introVideoRef}
            className="introVideo"
            src="/gas-station-intro.mp4"
            poster="/gas-station-intro-poster.webp"
            preload="auto"
            playsInline
            muted={!introPlaying}
            onEnded={finishIntro}
          />
          <div className="introShade" />
          <header className="introHeader">
            <BrandMark />
            <button className="introSkip" type="button" onClick={finishIntro}>SKIP INTRO →</button>
          </header>
          {!introPlaying ? (
            <div className="introPrompt">
              <p>SEVO PRESENTS · A GAS STATION STADIUM FILM</p>
              <h1>Start your <span>engines.</span></h1>
              <button className="primaryButton" type="button" onClick={playIntro}>
                PLAY INTRO WITH SOUND <span>▶</span>
              </button>
              <small>15 SECOND FEATURE · DUCKS WERE NOT CONSULTED</small>
            </div>
          ) : (
            <div className="introNowPlaying" aria-live="polite">
              <i /> NOW PLAYING · PRE-RACE FEATURE
            </div>
          )}
        </section>
      )}

      {(phase === "count" || phase === "drivers") && (
        <section className="setupScreen">
          <div className="ambientGrid" />
          <header className="setupHeader">
            <BrandMark />
            <div className="headerSponsor">
              <span>CHAMPIONSHIP NIGHT</span>
              <b>SPONSORED BY SEVO</b>
            </div>
            <button
              className="soundButton"
              type="button"
              onClick={() => setSoundOn((current) => !current)}
              aria-label={soundOn ? "Mute sound" : "Turn sound on"}
            >
              <span>{soundOn ? "♪" : "×"}</span> {soundOn ? "SOUND ON" : "MUTED"}
            </button>
          </header>

          <div className="setupPanel">
            <div className="stepLabel">RACE SETUP · {phase === "count" ? "01" : "02"}</div>

            {phase === "count" ? (
              <div className="countStep">
                <p className="kicker">GAS STATION STADIUM · SIX MACHINES · ONE DOG</p>
                <h1>How many <span>named players?</span></h1>
                <p className="setupLead">
                  Choose exactly how many people get names, then assign them to any racers you want.
                  All six always compete; the rest keep their factory names.
                </p>
                <div className="numberPicker" role="group" aria-label="Number of named players">
                  {[1, 2, 3, 4, 5, 6].map((count) => (
                    <button
                      key={count}
                      className={playerCount === count ? "selected" : ""}
                      type="button"
                      onClick={() => choosePlayerCount(count)}
                      aria-pressed={playerCount === count}
                    >
                      <b>{count}</b>
                      <span>{count === 1 ? "PLAYER" : "PLAYERS"}</span>
                    </button>
                  ))}
                </div>
                <div className="durationPanel">
                  <div className="durationTitle">
                    <span>CHOOSE RACE LENGTH</span>
                    <b>{raceSeconds} SECONDS</b>
                  </div>
                  <div className="durationPicker" role="radiogroup" aria-label="Race length">
                    {RACE_OPTIONS.map((seconds) => (
                      <button
                        key={seconds}
                        className={raceSeconds === seconds ? "selected" : ""}
                        type="button"
                        role="radio"
                        aria-checked={raceSeconds === seconds}
                        onClick={() => setRaceSeconds(seconds)}
                      >
                        <b>{seconds}</b><span>SEC</span>
                      </button>
                    ))}
                  </div>
                  <button
                    className={`announcerToggle ${announcerOn ? "selected" : ""}`}
                    type="button"
                    onClick={() => setAnnouncerOn((current) => !current)}
                    aria-pressed={announcerOn}
                  >
                    <span>
                      <b>SEVO VOICE ANNOUNCER</b>
                      <small>SYNTHETIC DEVICE VOICE · NOT HUMAN</small>
                    </span>
                    <em>{announcerOn ? "ON" : "OFF"}</em>
                  </button>
                </div>
                <button className="primaryButton" type="button" onClick={() => setPhase("drivers")}>
                  CHOOSE RACERS <span>→</span>
                </button>
              </div>
            ) : (
              <div className="driversStep">
                <div className="setupTitleRow">
                  <div>
                    <p className="kicker">CLAIM YOUR MACHINES</p>
                    <h1>Name the <span>drivers.</span></h1>
                    <p className="selectionRule">
                      Naming {playerCount} of 6 · choose any {playerCount} unique racer{playerCount === 1 ? "" : "s"} · {raceSeconds}s race
                    </p>
                  </div>
                  <button className="textButton" type="button" onClick={() => setPhase("count")}>
                    ← Players &amp; length
                  </button>
                </div>

                <div className="driverGrid">
                  {drivers.map((driver, index) => {
                    const racer = RACERS.find((item) => item.id === driver.racerId) ?? RACERS[index];
                    return (
                      <article className="driverCard" key={index}>
                        <div className="driverCardTop">
                          <span>PLAYER {String(index + 1).padStart(2, "0")}</span>
                          <RacerVisual racer={racer} compact />
                        </div>
                        <label>
                          <span>Driver name</span>
                          <input
                            value={driver.name}
                            onChange={(event) => updateDriver(index, { name: event.target.value.slice(0, 18) })}
                            placeholder={`Enter player ${index + 1}`}
                            autoComplete="off"
                          />
                        </label>
                        <label>
                          <span>Choose racer</span>
                          <select
                            value={driver.racerId}
                            onChange={(event) => updateDriver(index, { racerId: event.target.value })}
                          >
                            {RACERS.map((option) => {
                              const claimed = drivers.some((item, itemIndex) =>
                                itemIndex !== index && item.racerId === option.id,
                              );
                              return (
                                <option key={option.id} value={option.id} disabled={claimed}>
                                  {option.name}{claimed ? " · claimed" : ""}
                                </option>
                              );
                            })}
                          </select>
                        </label>
                      </article>
                    );
                  })}
                </div>

                <div className="rosterPreview" aria-label="Full race roster">
                  <span className="rosterLabel">FULL GRID</span>
                  {RACERS.map((racer) => (
                    <div className={driverByRacer.has(racer.id) ? "claimed" : ""} key={racer.id}>
                      <b>{racer.number}</b>
                      <span>{driverByRacer.get(racer.id) || racer.badge}</span>
                    </div>
                  ))}
                </div>

                <button className="primaryButton startButton" type="button" onClick={launchRace} disabled={!validDrivers}>
                  {validDrivers ? `START ${raceSeconds}-SECOND RACE` : "NAME EVERY PLAYER"} <span>▶</span>
                </button>
              </div>
            )}
          </div>

          <SponsorBoards compact />

          <footer className="setupFooter">
            <span>{raceSeconds} SECOND COURSE</span>
            <i />
            <span>RANDOM WINNER</span>
            <i />
            <span>ALL SIX COMPETE</span>
          </footer>
        </section>
      )}

      {(phase === "countdown" || phase === "race" || phase === "finish") && (
        <section className="raceScreen">
          <header className="raceHeader">
            <BrandMark />
            <div className="raceClock" aria-live="polite">
              <span>GAS STATION STADIUM · SEVO RACE CLOCK</span>
              <b>{formatClock(raceSeconds - elapsed)}</b>
            </div>
            <div className="raceActions">
              <button type="button" onClick={() => setSoundOn((current) => !current)} aria-label={soundOn ? "Mute sound" : "Turn sound on"}>
                {soundOn ? "♪" : "×"}
              </button>
              <button type="button" onClick={resetToDrivers} aria-label="Exit race">EXIT</button>
            </div>
          </header>

          <div
            className={`course ${activeMoment ? `moment-${activeMoment.tone}` : ""}`}
            style={{ "--race-progress": `${(elapsed / raceSeconds) * 100}%` } as CSSProperties}
          >
            <div
              className="stadiumBackdrop"
              style={{ transform: `translateX(${-elapsed * 2.4}px) scale(1.08)` }}
            />
            <div className="courseSky" />
            <div className={`impactFlash ${activeMoment?.tone ?? ""}`} />
            <div className="crowdFlashes" aria-hidden="true">
              {Array.from({ length: 24 }, (_, index) => (
                <i
                  key={index}
                  style={{
                    "--flash-x": `${4 + ((index * 17) % 92)}%`,
                    "--flash-y": `${5 + ((index * 23) % 26)}%`,
                    "--flash-delay": `${-((index * 0.41) % 4.7)}s`,
                  } as CSSProperties}
                />
              ))}
            </div>
            <div className="stadiumDeck">
              <div className="venueScoreboard">
                <span>WELCOME TO</span>
                <b>GAS STATION STADIUM</b>
                <small>SPONSORED BY SEVO</small>
              </div>
              <SponsorBoards />
            </div>
            <div className="trackScroll" style={{ transform: `translateX(${-elapsed * 24}px)` }} />
            <div className="finishLine"><span>FINISH</span></div>

            <div className="lanes">
              {RACERS.map((racer, laneIndex) => {
                const progress = positions[racer.id] ?? 0;
                const rank = standings.findIndex((item) => item.id === racer.id) + 1;
                const tag = driverByRacer.get(racer.id) || racer.badge;
                const obstacleXs = [0, 1, 2].map((obstacleIndex) =>
                  112 - ((elapsed * 17 + laneIndex * 19 + obstacleIndex * 46) % 146),
                );
                const racerX = 3.5 + progress * 0.865;
                const dodgingObstacle = obstacleXs.some((x) => Math.abs(x - racerX) < 4.2);
                return (
                  <div className="raceLane" key={racer.id}>
                    <div className="laneNumber">{racer.number}</div>
                    {obstacleXs.map((x, obstacleIndex) => {
                      const obstacleKinds = ["cone", "charge", "tires"];
                      return (
                        <span
                          className={`laneObstacle obstacle-${obstacleKinds[(laneIndex + obstacleIndex) % obstacleKinds.length]}`}
                          style={{ left: `${x}%` }}
                          key={obstacleIndex}
                          aria-hidden="true"
                        >
                          <i /><b />
                        </span>
                      );
                    })}
                    <div
                      className={`movingRacer ${rank === 1 && phase === "race" ? "leader" : ""} ${dodgingObstacle ? "obstacleDodge" : ""}`}
                      style={{ left: `calc(3.5% + ${progress * 0.865}%)` }}
                    >
                      <div className="racerTag">
                        <b>{tag}</b>
                        <span>{rank === 1 && elapsed > 1 ? "1ST" : racer.badge}</span>
                      </div>
                      <RacerVisual racer={racer} racing={phase === "race"} />
                    </div>
                  </div>
                );
              })}
            </div>

            {phase === "countdown" && (
              <div className="countdownOverlay">
                <span>{countdown > 0 ? countdown : "GO"}</span>
                <p>{countdown > 0 ? "SEVO RACE CONTROL · POWERING UP" : "FULL SEND"}</p>
              </div>
            )}

            {phase === "race" && activeMoment && (
              <div className={`momentToast ${activeMoment.tone}`} role="status">
                <span>{activeMoment.eyebrow}</span>
                <b>{competitorName(activeMoment.racerId)}</b> {activeMoment.line}
              </div>
            )}

            {phase === "race" && (
              <div className="standingsBar">
                <span>LIVE</span>
                {standings.slice(0, 3).map((racer, index) => (
                  <div key={racer.id}>
                    <b>{index + 1}</b> {competitorName(racer.id)}
                  </div>
                ))}
              </div>
            )}

            {phase === "finish" && winner && racePlan && (
              <div className="winnerOverlay">
                <div className="confetti" aria-hidden="true">
                  {Array.from({ length: 52 }, (_, index) => (
                    <i
                      key={index}
                      style={{
                        "--x": `${(index * 37 + racePlan.seed) % 100}%`,
                        "--delay": `${(index % 13) * -0.17}s`,
                        "--spin": `${180 + (index % 7) * 73}deg`,
                        "--confetti": ["#f8d24a", "#ff355e", "#45d9ff", "#ffffff"][index % 4],
                      } as CSSProperties}
                    />
                  ))}
                </div>
                <div className="winnerCard">
                  <div className="resultsLayout">
                    <div className="championPanel">
                      <div className="winnerEyebrow">GAS STATION STADIUM · CHAMPION</div>
                      <div className="winnerVisual"><RacerVisual racer={winner} /></div>
                      <p>{winnerDriver ? "DRIVER" : "UNCLAIMED MACHINE"}</p>
                      <h2>{winnerDriver || winner.name}</h2>
                      <span>{winnerDriver ? `WINS IN THE ${winner.name.toUpperCase()}` : "WINS FOR ITSELF. ABSOLUTELY COLD."}</span>
                    </div>

                    <div className="finalStandings" aria-label="Final results for all six racers">
                      <div className="resultsHeading">
                        <span>OFFICIAL RESULTS</span>
                        <b>{raceSeconds}s FINAL</b>
                      </div>
                      <ol>
                        {racePlan.order.map((racerId, index) => {
                          const resultRacer = RACERS.find((item) => item.id === racerId)!;
                          const namedDriver = driverByRacer.get(racerId);
                          return (
                            <li className={index === 0 ? "winnerResult" : ""} key={racerId}>
                              <b>{String(index + 1).padStart(2, "0")}</b>
                              <div className="resultMachine"><RacerVisual racer={resultRacer} compact /></div>
                              <span>
                                <strong>{competitorName(racerId)}</strong>
                                <small>{resultRacer.badge} · {namedDriver ? "PLAYER ENTRY" : "FACTORY ENTRY"}</small>
                              </span>
                              <em>{index === 0 ? "WINNER" : `P${index + 1}`}</em>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  </div>

                  <div className="winnerActions">
                    <button className="primaryButton" type="button" onClick={launchRace}>RACE AGAIN <span>↻</span></button>
                    <button className="secondaryButton" type="button" onClick={resetToDrivers}>CHANGE DRIVERS</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className="raceProgress"
            style={{ "--race-progress": `${(elapsed / raceSeconds) * 100}%` } as CSSProperties}
            aria-hidden="true"
          ><i /></div>
        </section>
      )}
    </main>
  );
}
