export interface SegmentedTimelineSegment {
  width: number;
  colourClass: string;
  dimColourClass: string;
}

interface SegmentedTimelineProps {
  value: number;
  segments: readonly SegmentedTimelineSegment[];
  totalWidth: number;
}

export function SegmentedTimeline({ value, segments, totalWidth }: SegmentedTimelineProps) {
  const progressPct = Math.min(100, (value / totalWidth) * 100);

  const breakpoints: number[] = [];
  let cumulative = 0;
  for (let index = 0; index < segments.length - 1; index++) {
    cumulative += segments[index].width;
    breakpoints.push(cumulative);
  }

  return (
    <div className="w-full">
      <div className="relative">
        <div className="relative h-2 rounded-full overflow-hidden border border-slate-600">
          <div className="absolute inset-0 flex">
            {segments.map((segment, index) => (
              <div
                key={index}
                className={segment.dimColourClass}
                style={{ flexGrow: segment.width, flexBasis: 0, flexShrink: 0 }}
              />
            ))}
          </div>
          <div
            className="absolute inset-0 flex"
            style={{ clipPath: `inset(0 ${100 - progressPct}% 0 0)` }}
          >
            {segments.map((segment, index) => (
              <div
                key={index}
                className={segment.colourClass}
                style={{ flexGrow: segment.width, flexBasis: 0, flexShrink: 0 }}
              />
            ))}
          </div>
        </div>
        <div
          className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-slate-100"
          style={{ left: `${progressPct}%` }}
        />
      </div>
      <div className="relative h-4 mt-1.5 text-xs lg:text-sm font-semibold text-slate-200">
        <span className="absolute left-0 -translate-x-1/2">0</span>
        {breakpoints.map((breakpoint) => (
          <span
            key={breakpoint}
            className="absolute -translate-x-1/2 text-[10px] lg:text-xs font-normal text-slate-300"
            style={{ left: `${(breakpoint / totalWidth) * 100}%` }}
          >
            {breakpoint}
          </span>
        ))}
        <span className="absolute left-full -translate-x-1/2">{totalWidth}</span>
      </div>
    </div>
  );
}
