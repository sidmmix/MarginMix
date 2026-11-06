import type { HoursTracked, ScopeBilled, ScopeMove } from "./constants";

export interface LeakInput {
  fee: number;
  months: number;
  fte: number;
  staffcost: number;
  scopemove: ScopeMove;
  scopebilled: ScopeBilled;
  hourstracked: HoursTracked;
}

export interface LeakResult {
  input: LeakInput;
  noLeak: boolean;
  driver: "delivery" | "scope";
  deliveryleak: number;
  deliveryleakraw: number;
  deliverycapped: boolean;
  scopeleak: number;
  scopelow: number;
  scopehigh: number;
  hideScopeBlock: boolean;
  leakpoint: number;
  leaklow: number;
  leakhigh: number;
  leakpctlow: number;
  leakpcthigh: number;
  leakpctmid: number;
  staffsharepct: number;
  grossmarginpct: number;
  requiredfee: number;
  feeshortfall: number;
  cause: string;
  bandwidth: number;
}
