interface SplashScreenProps {
  label: string;
}

export function SplashScreen({ label }: SplashScreenProps) {
  const showLabel = label !== "Loading…";

  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-5 bg-slate-950 text-slate-100">
      <div className="flex flex-col items-center gap-3">
        <div className="h-20 w-[51px] flex items-center justify-center">
          <img
            src="/icon-1026%20x%201600.png"
            alt=""
            className="h-20 w-[51px] object-contain"
          />
        </div>

        <div className="h-[58px] max-w-[calc(100vw-2rem)] flex flex-col items-center justify-center gap-1 text-center">
          <span className="font-cinzel text-4xl font-bold tracking-[0.1em] text-red-600 leading-none whitespace-nowrap">
            Dark Heresy
          </span>
          <span className="font-cinzel text-sm tracking-[0.55em] text-slate-300 uppercase leading-none whitespace-nowrap">
            Manager
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 w-64">
        <div className="flex-1 border-t-4 border-double border-slate-800" />
        <div className="h-4 w-[43px] flex items-center justify-center">
          <img src="/Icon-eagle.png" alt="" className="h-4 w-[43px] object-contain opacity-60" />
        </div>
        <div className="flex-1 border-t-4 border-double border-slate-800" />
      </div>

      <div className="w-8 h-8 rounded-full border-2 border-slate-800 border-t-red-600 animate-spin" />

      <div className="h-4 flex items-center justify-center">
        {showLabel && (
          <span className="text-[0.6rem] tracking-widest text-slate-500 uppercase leading-none whitespace-nowrap">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
