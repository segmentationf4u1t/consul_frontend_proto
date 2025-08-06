import Image from "next/image";
import React from "react";

// Simple utility for gradient blobs
const Blob = ({ className }: { className?: string }) => (
  <div
    className={`
      absolute rounded-full blur-3xl opacity-40
      ${className}
    `}
    aria-hidden="true"
  />
);

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_800px_at_50%_-10%,rgba(120,120,255,0.15),transparent_60%),radial-gradient(800px_600px_at_20%_110%,rgba(255,160,200,0.12),transparent_60%),radial-gradient(900px_700px_at_90%_90%,rgba(120,255,200,0.10),transparent_60%)]">
      {/* Ambient blobs */}
      <Blob className="w-[38rem] h-[38rem] bg-[conic-gradient(from_120deg,rgba(120,120,255,0.35),rgba(255,180,210,0.35),rgba(120,255,210,0.35),rgba(120,120,255,0.35))] -top-40 -left-24 animate-[spin_40s_linear_infinite]" />
      <Blob className="w-[28rem] h-[28rem] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.6),rgba(255,255,255,0.0))] top-20 right-10 animate-[pulse_8s_ease-in-out_infinite]" />
      <Blob className="w-[24rem] h-[24rem] bg-[conic-gradient(from_30deg,rgba(255,255,255,0.25),rgba(255,255,255,0.0))] bottom-10 left-10 animate-[spin_60s_linear_infinite_reverse]" />

      {/* Maker ribbon with CM monogram */}
      <div className="pointer-events-none absolute inset-x-0 top-28 flex justify-center">
        <div className="relative w-[min(92vw,1100px)]">
          <div className="absolute inset-0 mx-auto h-24 -skew-x-12 rounded-2xl bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_30px_70px_-30px_rgba(0,0,0,0.4)]" />
          <div className="relative z-10 flex h-24 items-center justify-between px-8">
            <span className="select-none text-xs uppercase tracking-[0.3em] text-white/40">
              Crafted by
            </span>
            <div className="flex items-center gap-3">
              <span className="sr-only">Cyfrowa Manufaktura</span>
              <div className="relative h-10 w-10 overflow-hidden rounded-md border border-white/10 bg-white/5">
                {/* Monogram with kinetic sweep */}
                <div className="absolute inset-0 grid place-items-center text-white/80">
                  <span className="font-semibold tracking-tight">CM</span>
                </div>
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.5),transparent)] animate-[sweep_3s_ease-in-out_infinite]" />
              </div>
              <span className="text-sm text-white/70">Cyfrowa Manufaktura</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fine grid + pulse */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.15' stroke-width='0.5'%3E%3Cpath d='M0 30h60M30 0v60'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_50%_0%,rgba(255,255,255,0.12),transparent_60%)]" />

      {/* Center composition */}
      <section className="relative flex min-h-screen items-center justify-center p-6">
        <div className="relative flex flex-col items-center text-center">
          {/* Abstract hero stack */}
          <div className="relative mb-10">
            <div className="size-44 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_20px_60px_-20px_rgba(0,0,0,0.35)]" />
            <div className="absolute inset-0 -z-10 translate-x-6 translate-y-6 size-44 rounded-2xl bg-gradient-to-br from-white/10 to-white/0 blur-sm" />
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(120deg,rgba(255,255,255,0.12),rgba(255,255,255,0)_40%)]" />
            {/* kinetic beam */}
            <div className="pointer-events-none absolute -inset-x-10 top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-70 animate-[beam_4s_ease-in-out_infinite]" />
            {/* Floating dots */}
            <div className="absolute -top-4 -left-4 size-2 rounded-full bg-white/60 animate-[pulse_4s_ease-in-out_infinite]" />
            <div className="absolute -bottom-5 left-10 size-1.5 rounded-full bg-white/50 animate-[pulse_6s_ease-in-out_infinite]" />
            <div className="absolute -right-6 top-6 size-1.5 rounded-full bg-white/40 animate-[pulse_7s_ease-in-out_infinite]" />
          </div>

          {/* Headline */}
          <h1 className="select-none bg-gradient-to-b from-white to-white/70 bg-clip-text text-5xl font-light tracking-tight text-transparent sm:text-6xl">
            Juzek
          </h1>
          <p className="mt-4 max-w-xl text-balance text-sm leading-6 text-white/70">
            Architecture, Design, and Development by Cyfrowa Manufaktura
          </p>

          {/* Signature maker line */}
          <div className="mt-5 flex items-center gap-2 text-xs text-white/50">
            <div className="h-px w-10 bg-white/30" />
            <span>Made with precision, curiosity, and calm aesthetics</span>
            <div className="h-px w-10 bg-white/30" />
          </div>

          {/* Divider + tiles */}
          <div className="relative mt-10 h-px w-[min(70vw,720px)] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          

          {/* Subtle CTA-style provenance badge */}
          <div className="mt-8 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 backdrop-blur-sm">
            <div className="h-5 w-5 rounded-md border border-white/10 bg-white/5 grid place-items-center text-[10px] text-white/80">CM</div>
            <span>Cyfrowa Manufaktura • Creative Engineering Studio</span>
          </div>
        </div>
      </section>

      {/* Mouse parallax */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
          (function(){
            const root = document.documentElement;
            const onMove = (e) => {
              const x = (e.clientX / window.innerWidth - 0.5) * 2;
              const y = (e.clientY / window.innerHeight - 0.5) * 2;
              root.style.setProperty('--tilt-x', (y * -2).toFixed(2) + 'deg');
              root.style.setProperty('--tilt-y', (x * 2).toFixed(2) + 'deg');
              root.style.setProperty('--shift-x', (x * 6).toFixed(2) + 'px');
              root.style.setProperty('--shift-y', (y * 6).toFixed(2) + 'px');
            };
            window.addEventListener('mousemove', onMove, { passive: true });
          })();
        `,
        }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
          :root {
            --tilt-x: 0deg;
            --tilt-y: 0deg;
            --shift-x: 0px;
            --shift-y: 0px;
          }
          section > div > div:first-child {
            transform: perspective(800px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y)) translateX(var(--shift-x)) translateY(var(--shift-y));
            transition: transform 120ms linear;
            will-change: transform;
          }
          @keyframes spin { to { transform: rotate(360deg) } }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: .6 }
            50% { transform: scale(1.06); opacity: .9 }
          }
          @keyframes sweep {
            0% { transform: translateX(-120%); opacity: .0; }
            20% { opacity: .7; }
            60% { opacity: .7; }
            100% { transform: translateX(120%); opacity: .0; }
          }
          @keyframes beam {
            0%, 100% { opacity: .3; transform: translateX(-6%) }
            50% { opacity: .9; transform: translateX(6%) }
          }
        `,
        }}
      />
    </main>
  );
}
