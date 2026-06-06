
"use client";

interface MissionIdentityProps {
  missionId: string;
  requestHours: number;
}

export function MissionIdentity({ missionId, requestHours }: MissionIdentityProps) {
  return (
    <section className="text-center space-y-3">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.5em]">
        MISIÓN #{missionId.slice(-6).toUpperCase()}
      </p>
      <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
        ALQUILER DE LAVADORA <span className="text-primary">({requestHours}H)</span>
      </h1>
    </section>
  );
}
