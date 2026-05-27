import { useState, useEffect, useRef } from "react";
import {
  Thermometer, Droplets, Leaf, Zap, AlertTriangle,
  Wifi, WifiOff, Bot, Activity,
  Send, X, BarChart3, Settings, Bug, Sprout,
  RefreshCw, FlameKindling, Terminal, Lock, FlaskConical,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import topGunWatermark from "../assets/TopGun_Ubicua.png";
import { MQTT_BROKER_HOST, MQTT_WS_PORT } from "../config/mqtt";
import { useMqtt, type CommandLogEntry } from "../hooks/useMqtt";
import {
  cooldownRemainingMinutes,
  formatSensorValue,
  snapshotToSensorDisplay,
  type SensorDisplay,
} from "../lib/telemetryDisplay";
import type { TelemetrySnapshot } from "../types/telemetry";

// ─── Types ───────────────────────────────────────────────────────────────────

type ModuleId = "monitoring" | "admin" | "debug" | "metrics";

interface LogEntry {
  time: string;
  type: "ventilation" | "irrigation" | "temperature" | "sensor" | "cooldown";
  message: string;
}

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
}

type ConsoleLine = { text: string; kind: "ok" | "warn" | "error" | "json" | "info" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCountdown(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function nowTs() {
  return new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

// Sensitivity 1→4h, 9→24h  (step = 2.5h per level)
function cooldownH(level: number) {
  return +(4 + (level - 1) * 2.5).toFixed(1);
}

function isActuatorOrReviewCommand(cmd: string) {
  return /^(PUMP |REVIEW )/i.test(cmd.trim());
}

function TestModeGate({
  testModeActive,
  children,
}: {
  testModeActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div
        className={
          testModeActive ? undefined : "opacity-50 pointer-events-none cursor-not-allowed select-none"
        }
      >
        {children}
      </div>
      {!testModeActive && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/55 backdrop-blur-[1px]"
          aria-hidden
        >
          <p className="flex items-center gap-2 text-xs font-semibold text-[#0D530E] px-3 py-2 rounded-xl bg-white/95 border border-emerald-200 shadow-sm text-center max-w-[90%]">
            <Lock className="w-3.5 h-3.5 shrink-0 text-[#306D29]" />
            Activa Test Mode para usar este módulo
          </p>
        </div>
      )}
    </div>
  );
}

function CommandLogPanel({ entries }: { entries: CommandLogEntry[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  return (
    <div className="bg-white rounded-3xl p-5 border border-emerald-200/80">
      <h3 className="text-sm font-semibold text-[#0D530E] mb-1">Log de comandos · ESP32</h3>
      <p className="text-xs text-[#4a6b57] font-mono mb-3">germinador/comandos · máx. 20 entradas</p>
      <div
        className="max-h-52 overflow-y-auto space-y-1.5 rounded-xl bg-[#0f1f14] p-3"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {entries.length === 0 ? (
          <p className="text-xs text-slate-500">Esperando comandos del usuario...</p>
        ) : (
          entries.map((e) => (
            <p key={e.id} className="text-xs leading-relaxed text-slate-200">
              <span className="text-slate-500">[{e.at}]</span> {e.text}
            </p>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ─── Primitive Components ────────────────────────────────────────────────────

// InlineAlert — verde primario / rojo alerta
function InlineAlert({ warning, msg }: { warning: boolean; msg: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full border ${
        warning
          ? "bg-red-50 text-red-600 border-red-200"
          : "bg-emerald-50 text-emerald-800 border-emerald-200"
      }`}
    >
      {warning ? "⚠ " : "✓ "}
      {msg}
    </span>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-3 group ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className="text-sm font-medium text-[#4a6b57] group-hover:text-[#0D530E] transition-colors select-none">
        {label}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
          checked ? "bg-[#306D29]" : "bg-[#9eb89c]"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}

function StatusPill({ active, labelOn, labelOff }: { active: boolean; labelOn: string; labelOff: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
        active
          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
          : "bg-slate-100 text-[#4a6b57]"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-[#306D29] animate-pulse" : "bg-slate-400"}`} />
      {active ? labelOn : labelOff}
    </span>
  );
}

// ─── Console (shared) ─────────────────────────────────────────────────────────

function TerminalConsole({
  title,
  lines,
  emptyMsg = "En espera...",
}: {
  title: string;
  lines: ConsoleLine[];
  emptyMsg?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const color = (kind: ConsoleLine["kind"]) => {
    const map: Record<ConsoleLine["kind"], string> = {
      ok: "#6EE7B7",
      warn: "#FCD34D",
      error: "#FCA5A5",
      json: "#86EFAC",
      info: "#CBD5E1",
    };
    return map[kind];
  };

  return (
    <div className="rounded-xl overflow-hidden border border-emerald-200/70">
      <div className="flex items-center justify-between px-3 py-2 bg-[#0D530E]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-300 opacity-80" />
          <span className="text-xs font-mono font-semibold text-slate-300">{title}</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </div>
      <div
        ref={ref}
        className="overflow-y-auto p-3 space-y-0.5"
        style={{
          height: "180px",
          background: "#0f1f14",
          fontFamily: "'JetBrains Mono', monospace",
          scrollbarWidth: "thin",
        }}
      >
        {lines.length === 0 ? (
          <p className="text-xs text-slate-600">{emptyMsg}</p>
        ) : (
          lines.map((l, i) => (
            <p key={i} className="text-xs leading-relaxed" style={{ color: color(l.kind) }}>
              {l.text}
            </p>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Module 1: Real-Time Monitoring ──────────────────────────────────────────

function SensorCard({
  icon, label, value, unit, alerting, alertMsg, okMsg, subvalue,
}: {
  icon: React.ReactNode; label: string; value: string | number; unit: string;
  alerting: boolean; alertMsg: string; okMsg: string; subvalue: string;
}) {
  return (
    <div
      className={`relative bg-white rounded-3xl p-5 border transition-all duration-300 ${
        alerting ? "border-red-200 shadow-sm" : "border-emerald-200/80"
      }`}
    >
      <div className="absolute top-3 right-3">
        <InlineAlert warning={alerting} msg={alerting ? alertMsg : okMsg} />
      </div>
      <div className={`mb-3 ${alerting ? "text-red-600" : "text-[#306D29]"}`}>{icon}</div>
      <p className="text-xs text-[#4a6b57] mb-1 uppercase tracking-wide">{label}</p>
      <div className="flex items-end gap-1 mb-3">
        <span
          className={`text-5xl font-bold leading-none tabular-nums ${
            alerting ? "text-red-600" : "text-[#0D530E]"
          }`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {value}
        </span>
        <span className={`text-xl font-medium mb-1 ${alerting ? "text-red-400" : "text-[#4a6b57]"}`}>
          {unit}
        </span>
      </div>
      <p className="text-xs font-mono text-[#4a6b57]">{subvalue}</p>
    </div>
  );
}

function ActuatorCard({
  label, active, icon, activeLabel, inactiveLabel,
}: {
  label: string; active: boolean; icon: React.ReactNode; activeLabel: string; inactiveLabel: string;
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${
        active ? "bg-emerald-50 border-emerald-200" : "bg-[#E8F4ED] border-emerald-100"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
            active ? "bg-[#306D29] text-white shadow-sm" : "bg-slate-200 text-[#4a6b57]"
          }`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0D530E]">{label}</p>
          <p className={`text-xs mt-0.5 ${active ? "text-[#306D29] font-semibold" : "text-[#4a6b57]"}`}>
            {active ? activeLabel : inactiveLabel}
          </p>
        </div>
      </div>
      <div className={`w-2.5 h-2.5 rounded-full ${active ? "bg-[#306D29] animate-pulse" : "bg-[#9eb89c]"}`} />
    </div>
  );
}

// [2] max-w-5xl → w-full (full-width)
function Module1Monitoring({
  display, tempAlert, humAlert, soilAlert, onPumpToggle, mqttConnected, testModeActive,
}: {
  display: SensorDisplay;
  tempAlert: boolean;
  humAlert: boolean;
  soilAlert: boolean;
  onPumpToggle: (on: boolean) => void;
  mqttConnected: boolean;
  testModeActive: boolean;
}) {
  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-xl font-semibold text-[#0D530E]">Monitoreo en Tiempo Real</h2>
        <p className="text-sm text-[#4a6b57] mt-0.5">
          Sensores DHT22 + Capacitivo · MQTT → ESP32 · Actualización cada 10s
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SensorCard icon={<Thermometer className="w-5 h-5" />} label="Temperatura Aire"
          value={display.tempAir} unit="°C" alerting={tempAlert}
          alertMsg="[!] ALTA — ventilación" okMsg="Rango óptimo" subvalue="Sensor DHT22 · pin GPIO4" />
        <SensorCard icon={<Droplets className="w-5 h-5" />} label="Humedad Aire"
          value={display.humidityAir} unit="%" alerting={humAlert}
          alertMsg="[!] CRÍTICA — revisa DHT22" okMsg="Humedad adecuada" subvalue="VPD estimado ~0.8 kPa" />
        <SensorCard icon={<Leaf className="w-5 h-5" />} label="Humedad Suelo"
          value={display.soilMoisture} unit="%" alerting={soilAlert}
          alertMsg="[!] SECO — necesita riego" okMsg="Suelo húmedo" subvalue="Capacitivo v2.0 · ADC pin A0" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#0D530E] mb-3 uppercase tracking-wide">
          Estado de Actuadores
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!mqttConnected}
            onClick={() => onPumpToggle(!display.pumpActive)}
            className="text-left w-full disabled:opacity-60"
          >
            <ActuatorCard label="Relé / Bomba de Agua" active={display.pumpActive}
              icon={<Zap className="w-4 h-4" />}
              activeLabel="BOMBA ACTIVA — GPIO HIGH" inactiveLabel="Bomba en reposo — GPIO LOW" />
          </button>
          <ActuatorCard label="Foco de Crecimiento" active={display.lightRecommended}
            icon={<FlameKindling className="w-4 h-4" />}
            activeLabel="FOCO RECOMENDADO ON" inactiveLabel="Fotoperíodo completo" />
        </div>
      </div>

      <div
        className="rounded-3xl p-5 grid grid-cols-3 gap-4 border border-emerald-700/30"
        style={{ background: "linear-gradient(135deg, #0D530E 0%, #306D29 55%, #4a8f3f 100%)" }}
      >
        {[
          { label: "TEMP LIVE", val: `${display.tempAir}°C` },
          { label: "HUM LIVE", val: `${display.humidityAir}%` },
          { label: "SOIL LIVE", val: `${display.soilMoisture}%` },
        ].map((item, i) => (
          <div key={i} className={`text-center ${i === 1 ? "border-x border-white/10" : ""}`}>
            <p className="text-xs text-white/40 font-mono mb-1 uppercase">{item.label}</p>
            <p className="text-2xl font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {item.val}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Module 2: Admin + PASSIVE TELEMETRY CONSOLE ─────────────────────────────

// [4] Admin module now has the passive (auto) telemetry console
// [5] Sensitivity scale 1–9 (level 1=4h, level 9=24h)
function Module2Admin({
  plantName, setPlantName, sensitivityLevel,
  cooldownRemaining, cooldownTotal, cooldownProgress, passiveLog,
  snapshot, testModeActive, publishCommand,
}: {
  plantName: string; setPlantName: (v: string) => void;
  sensitivityLevel: number;
  cooldownRemaining: number; cooldownTotal: number; cooldownProgress: number;
  passiveLog: ConsoleLine[];
  snapshot: TelemetrySnapshot | null;
  testModeActive: boolean;
  publishCommand: (cmd: string) => boolean;
}) {
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedWater, setSelectedWater] = useState<"L" | "M" | "H">("M");
  const [selectedSun, setSelectedSun] = useState<"L" | "M" | "H">("M");

  const handleProfileConfirm = () => {
    const cmd = `PROFILE ${selectedWater} ${selectedSun}`;
    publishCommand(cmd);
    setSettingsModalOpen(false);
  };

  const handleClearAnomaly = (type: "humedad" | "termica") => {
    publishCommand("ANOMALY CLEAR");
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-xl font-semibold text-[#0D530E]">Panel Administrativo</h2>
        <p className="text-sm text-[#4a6b57] mt-0.5">Configuración · Cooldown · Telemetría pasiva</p>
      </div>

      {/* Anomaly Badges */}
      {(snapshot?.sistema.anomalia_humedad || snapshot?.sistema.anomalia_termica) && (
        <div className="flex flex-wrap gap-3">
          {snapshot?.sistema.anomalia_humedad && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
              <span className="text-xs font-semibold text-red-700">Anomalía de humedad</span>
              <button
                type="button"
                onClick={() => handleClearAnomaly("humedad")}
                className="text-xs font-medium text-red-600 hover:text-red-800 underline"
              >
                Limpiar
              </button>
            </div>
          )}
          {snapshot?.sistema.anomalia_termica && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
              <span className="text-xs font-semibold text-red-700">Anomalía térmica</span>
              <button
                type="button"
                onClick={() => handleClearAnomaly("termica")}
                className="text-xs font-medium text-red-600 hover:text-red-800 underline"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plant Config */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-200/80 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0D530E] uppercase tracking-wide">
              Configuración de Planta
            </h3>
            <button
              type="button"
              onClick={() => testModeActive && setSettingsModalOpen(true)}
              disabled={!testModeActive}
              className={`p-2 rounded-xl border transition-all ${
                testModeActive
                  ? "bg-white border-emerald-200/70 text-[#306D29] hover:bg-emerald-50"
                  : "opacity-40 cursor-not-allowed bg-white border-emerald-200/70 text-[#4a6b57]"
              }`}
              title={testModeActive ? "Configurar sensibilidad" : "Activa Test Mode para configurar"}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#4a6b57] block font-medium">Nombre de la Planta</label>
            <input
              type="text"
              value={plantName}
              onChange={(e) => setPlantName(e.target.value)}
              placeholder="Ej: Albahaca Genovesa #01"
              className="w-full bg-white border border-emerald-200/70 rounded-xl px-4 py-3 text-sm text-[#0D530E] placeholder:text-[#4a6b57] focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-[#306D29] transition-all"
            />
          </div>

          {/* [5] Sensitivity 1–9 */}
          <div className="space-y-2">
            <label className="text-xs text-[#4a6b57] block font-medium">
              Nivel de Sensibilidad — Cooldown de Riego
            </label>
            <div className="grid grid-cols-9 gap-1">
              {[1,2,3,4,5,6,7,8,9].map((level) => (
                <div
                  key={level}
                  className={`py-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                    sensitivityLevel === level
                      ? "bg-[#306D29] text-white scale-[1.06]"
                      : "bg-white border border-emerald-200/70 text-[#4a6b57]"
                  }`}
                  style={{ boxShadow: sensitivityLevel === level ? "0 4px 6px rgba(0,0,0,0.08)" : "none" }}
                >
                  {level}
                </div>
              ))}
            </div>
            <p className="text-xs text-[#4a6b57] font-mono">
              Nivel {sensitivityLevel} → Cooldown de {cooldownH(sensitivityLevel)}h &nbsp;·&nbsp; (Rango: Nv.1=4h · Nv.9=24h)
            </p>
          </div>
        </div>

        {/* Cooldown Widget */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-200/80 flex flex-col">
          <h3 className="text-sm font-semibold text-[#0D530E] uppercase tracking-wide mb-4">
            Cooldown Dinámico — Bomba
          </h3>

          <div className="flex items-center justify-center flex-1 mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#C8E6C9" strokeWidth="9" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={cooldownRemaining > 0 ? "#DC2626" : "#306D29"}
                  strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - cooldownProgress / 100)}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <span className="text-xs text-[#4a6b57] font-mono">restante</span>
                <span
                  className={`text-lg font-bold leading-tight ${
                    cooldownRemaining > 0 ? "text-red-600" : "text-[#306D29]"
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {cooldownRemaining > 0 ? fmtCountdown(cooldownRemaining) : "Libre"}
                </span>
              </div>
            </div>
          </div>

          <div
            className={`rounded-xl px-4 py-3 text-center ${
              cooldownRemaining > 0
                ? "bg-red-50 border border-red-100"
                : "bg-emerald-50 border border-emerald-100"
            }`}
          >
            <p className={`text-xs font-bold font-mono ${cooldownRemaining > 0 ? "text-red-700" : "text-[#306D29]"}`}>
              {cooldownRemaining > 0
                ? `[BLOQUEADA] Faltan ${fmtCountdown(cooldownRemaining)}`
                : "[DISPONIBLE] Bomba lista para activar"}
            </p>
            <p className="text-xs text-[#4a6b57] mt-0.5 font-mono">
              Nivel {sensitivityLevel} · Total {fmtCountdown(cooldownTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* [4] PASSIVE TELEMETRY CONSOLE — auto-filling, replaces anomaly log */}
      <div>
        <h3 className="text-sm font-semibold text-[#0D530E] mb-2 flex items-center gap-2">
          Consola de Telemetría · Entrada Pasiva
          <span className="text-xs font-normal text-[#4a6b57] font-mono">(datos automáticos del sistema)</span>
        </h3>
        <TerminalConsole
          title="MQTT IN · Telemetría automática"
          lines={passiveLog}
          emptyMsg="Esperando datos del broker..."
        />
      </div>

      {/* Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 border border-emerald-200/80">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#0D530E]">Configurar Sensibilidad</h3>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                <X className="w-5 h-5 text-[#4a6b57]" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-[#0D530E] block mb-3">Nivel de Agua</label>
                <div className="grid grid-cols-3 gap-2">
                  {["L", "M", "H"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSelectedWater(level as "L" | "M" | "H")}
                      className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                        selectedWater === level
                          ? "bg-[#306D29] text-white scale-105"
                          : "bg-[#E8F4ED] text-[#4a6b57] hover:bg-emerald-100"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#0D530E] block mb-3">Nivel de Sol</label>
                <div className="grid grid-cols-3 gap-2">
                  {["L", "M", "H"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSelectedSun(level as "L" | "M" | "H")}
                      className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                        selectedSun === level
                          ? "bg-[#306D29] text-white scale-105"
                          : "bg-[#E8F4ED] text-[#4a6b57] hover:bg-emerald-100"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-emerald-200/70">
                <button
                  type="button"
                  onClick={handleProfileConfirm}
                  className="w-full py-3 bg-[#306D29] text-white rounded-xl text-sm font-semibold hover:bg-[#265a22] active:scale-[0.98] transition-all"
                >
                  Confirmar: PROFILE {selectedWater} {selectedSun}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Module 3: Debug + ACTIVE OUTPUT CONSOLE ─────────────────────────────────

// [4] Debug module has independent OUTPUT console (only fills on user action)
function Module3Debug({
  pumpActive, onPumpChange,
  reviewTemp, onReviewTempChange,
  reviewHum, onReviewHumChange,
  reviewSoil, onReviewSoilChange,
  tempSensorOk,
  showFloodWarning, activeReviews,
  outputLog, onVerStatus, mqttConnected, testModeActive, commandLog,
}: {
  pumpActive: boolean;
  onPumpChange: (on: boolean) => void;
  reviewTemp: boolean;
  onReviewTempChange: (on: boolean) => void;
  reviewHum: boolean;
  onReviewHumChange: (on: boolean) => void;
  reviewSoil: boolean;
  onReviewSoilChange: (on: boolean) => void;
  tempSensorOk: boolean;
  showFloodWarning: boolean;
  activeReviews: number;
  outputLog: ConsoleLine[];
  onVerStatus: () => void;
  mqttConnected: boolean;
  testModeActive: boolean;
  commandLog: CommandLogEntry[];
}) {
  return (
    <div className="space-y-5 w-full">
      <div>
        <h2 className="text-xl font-semibold text-[#0D530E]">Panel de Debug Avanzado</h2>
        <p className="text-sm text-[#4a6b57] mt-0.5">
          Comandos directos · Hardware · Peticiones manuales MQTT
        </p>
      </div>

      {/* [1] Flood warning — rojo #DC2626 */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          showFloodWarning ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div
          className="rounded-xl px-4 py-3 flex items-start gap-3 border border-amber-200/90 bg-amber-50/95"
          style={{ boxShadow: "0 2px 8px rgba(120, 90, 60, 0.06)" }}
        >
          <AlertTriangle className="w-4 h-4 text-amber-700/80 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900/90">
              [⚠️] Flujo de datos sucesivo detectado. Riesgo de saturación de terminal.
            </p>
            <p className="text-xs text-amber-800/70 mt-0.5">
              Se recomienda desactivar un modo de revisión activo.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Actuators */}
        <TestModeGate testModeActive={testModeActive}>
          <div className="bg-white rounded-3xl p-5 border border-emerald-200/80 space-y-4 h-full">
            <div className="flex items-center gap-2 pb-3 border-b border-emerald-200/70">
              <Zap className="w-4 h-4 text-[#306D29]" />
              <h3 className="text-sm font-semibold text-[#0D530E]">Actuadores</h3>
            </div>
            <Toggle
              checked={pumpActive}
              onChange={onPumpChange}
              label="Relé — Bomba de agua"
              disabled={!mqttConnected || !testModeActive}
            />
            <div
              className={`text-xs font-mono text-center py-2 rounded-lg transition-colors ${
                pumpActive
                  ? "bg-emerald-50 text-[#306D29] border border-emerald-100"
                  : "bg-slate-100 text-[#4a6b57]"
              }`}
            >
              {pumpActive ? "GPIO HIGH · RELAY ON" : "GPIO LOW · RELAY OFF"}
            </div>
            <StatusPill active={pumpActive} labelOn="Bomba encendida" labelOff="Bomba apagada" />
          </div>
        </TestModeGate>

        {/* Ver Status — renamed button */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-emerald-200/70">
            <Activity className="w-4 h-4 text-[#306D29]" />
            <h3 className="text-sm font-semibold text-[#0D530E]">Consultas</h3>
          </div>
          <p className="text-xs text-[#4a6b57]">
            Envía el comando{" "}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-[#0D530E]">STATUS</code>{" "}
            al broker MQTT y muestra la respuesta JSON cruda en la consola de salida.
          </p>
          {/* [4] Renamed to "Ver Status" */}
          <button
            onClick={onVerStatus}
            className="w-full py-3 bg-[#306D29] text-white rounded-xl text-sm font-semibold hover:bg-[#265a22] active:scale-[0.98] transition-all"
            style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.08)" }}
          >
            Ver Status
          </button>
        </div>

        {/* Continuous Review */}
        <TestModeGate testModeActive={testModeActive}>
          <div className="bg-white rounded-3xl p-5 border border-emerald-200/80 space-y-4 h-full">
            <div className="flex items-center gap-2 pb-3 border-b border-emerald-200/70">
              <RefreshCw className="w-4 h-4 text-[#306D29]" />
              <h3 className="text-sm font-semibold text-[#0D530E]">Monitoreo Continuo</h3>
            </div>
            <Toggle checked={reviewTemp} onChange={onReviewTempChange} label="REVIEW TEMP" disabled={!mqttConnected || !testModeActive} />
            <Toggle checked={reviewHum} onChange={onReviewHumChange} label="REVIEW HUM" disabled={!mqttConnected || !testModeActive} />
            <Toggle checked={reviewSoil} onChange={onReviewSoilChange} label="REVIEW SOIL" disabled={!mqttConnected || !testModeActive} />
            <div
              className={`text-xs font-mono text-center py-1.5 rounded-lg ${
                activeReviews >= 2 ? "bg-red-50 text-red-600" : "bg-slate-100 text-[#4a6b57]"
              }`}
            >
              {activeReviews} / 3 activos
            </div>
          </div>
        </TestModeGate>
      </div>

      {/* GPIO State Map */}
      <div
        className="rounded-3xl p-5 border border-emerald-700/30"
        style={{ background: "linear-gradient(160deg, #0D530E 0%, #1a4d1c 100%)" }}
      >
        <p className="text-xs text-white/40 font-mono uppercase mb-3">Estado GPIO — ESP32</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { pin: "GPIO4", label: "DHT22 DATA", active: tempSensorOk },
            { pin: "GPIO12", label: "RELAY CTRL", active: pumpActive },
            { pin: "GPIO13", label: "FOCO PWM", active: true },
            { pin: "ADC0", label: "SOIL SENSOR", active: true },
          ].map((item) => (
            <div
              key={item.pin}
              className={`rounded-xl p-3 border text-center transition-colors ${
                item.active ? "border-emerald-400/40 bg-emerald-400/10" : "border-white/10 bg-white/5"
              }`}
            >
              <p className="text-xs font-mono text-emerald-300 mb-1">{item.pin}</p>
              <p className="text-xs text-white/60">{item.label}</p>
              <p className={`text-xs font-bold font-mono mt-1 ${item.active ? "text-emerald-300" : "text-white/30"}`}>
                {item.active ? "HIGH" : "LOW"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* [4] ACTIVE OUTPUT CONSOLE — only fills on manual user interaction */}
      <div>
        <h3 className="text-sm font-semibold text-[#0D530E] mb-2 flex items-center gap-2">
          Consola de Salida · Peticiones Manuales
          <span className="text-xs font-normal text-[#4a6b57] font-mono">(solo al interactuar)</span>
        </h3>
        <TerminalConsole
          title="MQTT OUT · Comandos y respuestas JSON"
          lines={outputLog}
          emptyMsg="Presiona 'Ver Status' o activa un REVIEW para ver la salida..."
        />
      </div>

      <CommandLogPanel entries={commandLog} />
    </div>
  );
}

// ─── Module 5: KPI Metrics ────────────────────────────────────────────────────

function Module5Metrics({
  display, snapshot,
}: {
  display: SensorDisplay;
  snapshot: TelemetrySnapshot | null;
}) {
  const m = snapshot?.metricas;
  const uptimeH = m ? (m.uptime_s / 3600).toFixed(1) : "--";
  const bombaMin = m ? String(Math.round(m.bomba_on_total_s / 60)) : "--";
  const deltaT = m ? (m.temp_max - m.temp_min).toFixed(1) : "--";
  const ciclos = m ? String(m.ciclos_riego) : "--";
  const riegoPct = m ? Math.min(100, (m.ciclos_riego / 4) * 100) : 0;
  const uptimePct = m ? Math.min(100, (m.uptime_s / 86_400) * 100) : 0;

  const kpis = [
    { label: "Uptime Sistema", value: uptimeH, unit: "h", sub: m ? `ts MQTT ${snapshot?.ts}` : "Sin telemetría", positive: true },
    { label: "Tiempo Bomba Activa", value: bombaMin, unit: "min", sub: m ? `${m.ciclos_riego} ciclos de riego` : "—", positive: true },
    { label: "Temp. Máxima / Mínima", value: m ? `${formatSensorValue(m.temp_max, 1)}/${formatSensorValue(m.temp_min, 1)}` : "--/--", unit: "°C", sub: "Rango del ciclo actual", positive: true },
    { label: "Delta Térmico", value: deltaT, unit: "°C", sub: m ? `Δ = max − min` : "—", positive: !(m && m.temp_max - m.temp_min > 10) },
    { label: "Ciclos de Riego", value: ciclos, unit: "hoy", sub: m ? `Objetivo 4/día` : "—", positive: true },
    { label: "Cooldown Restante", value: snapshot ? String(Math.ceil(snapshot.sistema.cooldown_restante_s / 60)) : "--", unit: "min", sub: "Desde telemetría MQTT", positive: snapshot ? snapshot.sistema.cooldown_restante_s === 0 : true },
  ];

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-xl font-semibold text-[#0D530E]">Dashboard de Métricas</h2>
        <p className="text-sm text-[#4a6b57] mt-0.5">
          Indicadores KPI · Ciclo actual · Estadísticas acumuladas
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white rounded-3xl p-5 border border-emerald-200/80 hover:border-emerald-400 transition-colors">
            <p className="text-xs text-[#4a6b57] mb-3 uppercase tracking-wide">{kpi.label}</p>
            <div className="flex items-end gap-1.5 mb-2">
              <span
                className="text-5xl font-bold text-[#0D530E] leading-none"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {kpi.value}
              </span>
              <span className="text-base text-[#4a6b57] mb-1">{kpi.unit}</span>
            </div>
            <p className={`text-xs font-mono ${kpi.positive ? "text-[#306D29]" : "text-red-600"}`}>
              {kpi.sub}
            </p>
          </div>
        ))}
      </div>

      <div
        className="rounded-3xl p-5 grid grid-cols-3 divide-x divide-white/10 border border-emerald-700/30"
        style={{ background: "linear-gradient(135deg, #0D530E 0%, #306D29 55%, #4a8f3f 100%)" }}
      >
        {[
          { label: "TEMP LIVE", val: `${display.tempAir}°C`, alert: display.tempAirNum !== null && display.tempAirNum > 28 },
          { label: "HUM LIVE", val: `${display.humidityAir}%`, alert: display.humidityAirNum !== null && display.humidityAirNum < 40 },
          { label: "SOIL LIVE", val: `${display.soilMoisture}%`, alert: display.soilMoistureNum !== null && display.soilMoistureNum < 30 },
        ].map((item, i) => (
          <div key={i} className="text-center px-4">
            <p className="text-xs text-white/40 font-mono uppercase mb-1">{item.label}</p>
            <p
              className={`text-3xl font-bold ${item.alert ? "text-red-400" : "text-white"}`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {item.val}
            </p>
            {item.alert && <p className="text-xs text-red-400/80 font-mono mt-1">⚠ Fuera de rango</p>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-5 border border-emerald-200/80 space-y-4">
        <h3 className="text-sm font-semibold text-[#0D530E] uppercase tracking-wide">
          Progreso de Objetivos Diarios
        </h3>
        {[
          { label: "Ciclos de Riego (objetivo 4/día)", pct: riegoPct },
          { label: "Uptime Sistema (24h ref.)", pct: uptimePct },
          { label: "Bomba activa acumulada", pct: m ? Math.min(100, (m.bomba_on_total_s / 3600) * 100) : 0 },
        ].map((item, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#4a6b57]">{item.label}</span>
              <span className="font-mono font-semibold text-[#0D530E]">{item.pct}%</span>
            </div>
            <div className="h-2 bg-[#E7E1B1] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#306D29] rounded-full transition-all duration-700"
                style={{ width: `${item.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: ModuleId; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "monitoring", label: "Monitoreo", icon: Activity },
  { id: "admin", label: "Administración", icon: Settings },
  { id: "debug", label: "Debug", icon: Bug },
  { id: "metrics", label: "Métricas KPI", icon: BarChart3 },
];

function UbicuaLogoMark() {
  const [lifted, setLifted] = useState(false);
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover)");
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <button
      type="button"
      aria-label="Programación Ubicua — UCC"
      className={`absolute right-4 top-4 sm:right-5 sm:top-5 md:right-6 md:top-6 border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 rounded-lg transition-[z-index] duration-0 ${
        lifted ? "z-[80]" : "z-20"
      }`}
      onMouseEnter={() => canHover && setLifted(true)}
      onMouseLeave={() => canHover && setLifted(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (!canHover) setLifted((v) => !v);
      }}
      onBlur={() => setLifted(false)}
    >
      <img
        src={topGunWatermark}
        alt=""
        draggable={false}
        className={`select-none object-contain transition-all duration-300 ease-out drop-shadow-sm pointer-events-none
          w-16 h-16 max-[380px]:w-14 max-[380px]:h-14
          sm:w-20 sm:h-20
          md:w-24 md:h-24
          lg:w-28 lg:h-28
          ${lifted ? "opacity-100 scale-110" : "opacity-[0.28] scale-100"}`}
      />
    </button>
  );
}

const BOT_REPLIES = [
  "Para germinación óptima, mantén el suelo entre 65-75% de humedad. El cooldown configurado evita el encharcamiento.",
  "Recomiendo fotoperíodo de 16h/día con intensidad media. El delta térmico nocturno de 6-8°C favorece el desarrollo radicular.",
  "El VPD actual (~0.8 kPa) es ideal para la fase de germinación. Ajusta la ventilación si supera 1.2 kPa.",
  "En términos simples: tu planta está bien hidratada. La humedad del suelo indica que tienes margen antes del próximo riego.",
  "Los datos muestran un sistema funcionando con normalidad. El único punto a vigilar es el delta térmico de esta mañana.",
];

export default function App() {
  const { connected: mqttConnected, snapshot, error: mqttError, commandLog, publishCommand } =
    useMqtt();
  const brokerLabel = `${MQTT_BROKER_HOST}:${MQTT_WS_PORT}`;

  const [testModeActive, setTestModeActive] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleId>("monitoring");
  const [plantName, setPlantName] = useState("");
  const [reviewTemp, setReviewTemp] = useState(false);
  const [reviewHum, setReviewHum] = useState(false);
  const [reviewSoil, setReviewSoil] = useState(false);

  const sensorDisplay = snapshotToSensorDisplay(snapshot);
  const sensitivityLevel = snapshot?.sistema.nivel_sensibilidad ?? 3;
  const cooldownRemaining = cooldownRemainingMinutes(snapshot);

  // [3] Chat — simplified, no modes
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: "assistant", text: "Hola 🌱 Soy el Asistente Botánico. Pregúntame sobre tu planta, los datos del sensor o el estado del sistema." },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // [4] Passive telemetry log (auto, admin module)
  const [passiveLog, setPassiveLog] = useState<ConsoleLine[]>([]);

  // [4] Active output log (manual, debug module)
  const [outputLog, setOutputLog] = useState<ConsoleLine[]>([]);

  const appendOutput = (line: ConsoleLine) => {
    setOutputLog((p) => [...p.slice(-60), line]);
  };

  const sendCommand = (cmd: string) => {
    const ok = publishCommand(cmd);
    if (!ok) {
      toast.error(mqttError ?? "MQTT no conectado");
      appendOutput({
        text: `[${nowTs()}] ✗ No enviado · ${cmd}`,
        kind: "error",
      });
    }
    return ok;
  };

  const sendActuatorCommand = (cmd: string) => {
    if (!testModeActive) {
      toast.warning("Activa Test Mode primero");
      return false;
    }
    return sendCommand(cmd);
  };

  const handleTestModeToggle = () => {
    const next = !testModeActive;
    setTestModeActive(next);
    const ok = publishCommand(next ? "TEST ON" : "TEST OFF");
    if (!ok) {
      setTestModeActive(!next);
      toast.error(mqttError ?? "MQTT no conectado");
    }
  };

  useEffect(() => {
    if (!snapshot) return;
    const s = snapshot.sensores;
    setPassiveLog((p) => [
      ...p.slice(-60),
      {
        text: `[${nowTs()}] MQTT IN · T=${formatSensorValue(s.temp_aire)}°C H=${formatSensorValue(s.hum_aire)}% Suelo=${formatSensorValue(s.hum_suelo)}% · bomba=${snapshot.actuadores.bomba ? "ON" : "OFF"}`,
        kind: "ok",
      },
    ]);
  }, [snapshot?.ts]);

  useEffect(() => {
    if (!snapshot || (!reviewTemp && !reviewHum && !reviewSoil)) return;
    const s = snapshot.sensores;
    const parts: string[] = [];
    if (reviewTemp) parts.push(`TEMP=${formatSensorValue(s.temp_aire)}°C`);
    if (reviewHum) parts.push(`HUM=${formatSensorValue(s.hum_aire)}%`);
    if (reviewSoil) parts.push(`SOIL=${formatSensorValue(s.hum_suelo)}%`);
    appendOutput({ text: `[${nowTs()}] REVIEW · ${parts.join(" · ")}`, kind: "info" });
  }, [snapshot?.ts, reviewTemp, reviewHum, reviewSoil]);

  function handleVerStatus() {
    sendCommand("STATUS");
    if (snapshot) {
      appendOutput({
        text: `[${nowTs()}] Última telemetría: ${JSON.stringify(snapshot)}`,
        kind: "json",
      });
    }
  }

  const handlePumpToggle = (on: boolean) => {
    if (!sendActuatorCommand(on ? "PUMP ON" : "PUMP OFF")) return;
  };

  const handlePumpToggleMonitoring = (on: boolean) => {
    const ok = sendCommand(on ? "PUMP ON" : "PUMP OFF");
    if (!ok) {
      toast.error(mqttError ?? "MQTT no conectado");
    }
  };

  const handleReviewTemp = (on: boolean) => {
    if (!sendActuatorCommand(on ? "REVIEW TEMP ON" : "REVIEW TEMP OFF")) return;
    setReviewTemp(on);
  };
  const handleReviewHum = (on: boolean) => {
    if (!sendActuatorCommand(on ? "REVIEW HUM ON" : "REVIEW HUM OFF")) return;
    setReviewHum(on);
  };
  const handleReviewSoil = (on: boolean) => {
    if (!sendActuatorCommand(on ? "REVIEW SOIL ON" : "REVIEW SOIL OFF")) return;
    setReviewSoil(on);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatOpen]);

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMsg = { role: "user", text: chatInput };
    const botMsg: ChatMsg = { role: "assistant", text: BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)] };
    setChatMessages((prev) => [...prev, userMsg, botMsg]);
    setChatInput("");
  };

  // [5] Updated cooldown formula: level 1=4h, level 9=24h
  const cooldownTotal = Math.round(cooldownH(sensitivityLevel) * 60);
  const cooldownProgress = Math.max(0, Math.min(100, ((cooldownTotal - cooldownRemaining) / cooldownTotal) * 100));

  const tempAlert =
    snapshot?.sistema.anomalia_termica === true ||
    (sensorDisplay.tempAirNum !== null &&
      (sensorDisplay.tempAirNum > 28 || sensorDisplay.tempAirNum < 18));
  const humAlert =
    snapshot?.sistema.anomalia_humedad === true ||
    (sensorDisplay.humidityAirNum !== null &&
      (sensorDisplay.humidityAirNum < 40 || sensorDisplay.humidityAirNum > 85));
  const soilAlert =
    sensorDisplay.soilMoistureNum !== null && sensorDisplay.soilMoistureNum < 30;

  const activeReviews = [reviewTemp, reviewHum, reviewSoil].filter(Boolean).length;
  const showFloodWarning = activeReviews >= 2;

  return (
    <>
    <Toaster position="top-center" richColors closeButton />
    <div
      className="min-h-screen bg-white text-[#0D530E] flex flex-col relative"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── HEADER — verde naturaleza ──── */}
      <header
        className="sticky top-0 z-30 border-b border-emerald-800/20"
        style={{
          background: "linear-gradient(90deg, #0D530E 0%, #306D29 50%, #3d7a35 100%)",
          boxShadow: "0 4px 14px rgba(13, 83, 14, 0.18)",
        }}
      >
        <div className="flex items-center justify-between px-4 md:px-6 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-white/20 flex items-center justify-center rotate-3">
              <Sprout className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-white">Germinador Automático</p>
              <p className="text-xs text-white/60">v3.0 · Computación Ubicua</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestModeToggle}
              title={testModeActive ? "Test Mode ON — click para desactivar" : "Test Mode OFF — click para activar"}
              aria-pressed={testModeActive}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                testModeActive
                  ? "bg-emerald-400/30 border-emerald-200/70 text-emerald-100 shadow-sm"
                  : "bg-white/5 border-white/15 text-white/40 opacity-40 hover:opacity-60"
              }`}
            >
              <FlaskConical
                className={`w-4 h-4 shrink-0 transition-colors ${
                  testModeActive ? "text-emerald-300" : "text-white/50"
                }`}
              />
              <span className="hidden sm:inline">{testModeActive ? "Test ON" : "Test OFF"}</span>
            </button>

            {/* Anomaly Indicator */}
            {(snapshot?.sistema.anomalia_humedad || snapshot?.sistema.anomalia_termica) && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border bg-red-500/30 border-red-300/50 text-red-50"
                title="Anomalía detectada"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Anomalía</span>
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
              </div>
            )}

            <div
              role="status"
              aria-live="polite"
              title={mqttError ?? undefined}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border ${
                mqttConnected
                  ? "bg-emerald-400/25 border-emerald-200/60 text-white"
                  : "bg-red-500/30 border-red-300/50 text-red-50"
              }`}
            >
              {mqttConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {mqttConnected ? `MQTT · ${brokerLabel}` : `MQTT offline · ${brokerLabel}`}
              </span>
              <span className="sm:hidden">{mqttConnected ? "MQTT ●" : "MQTT ○"}</span>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  mqttConnected ? "bg-emerald-300 animate-pulse" : "bg-red-400"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="md:hidden flex border-t border-white/15 overflow-x-auto scrollbar-none">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveModule(id)}
              className={`flex-1 min-w-max flex flex-col items-center gap-0.5 py-2.5 px-3 text-xs transition-colors ${
                activeModule === id
                  ? "text-white border-b-2 border-white"
                  : "text-white/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* ── BODY ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        <UbicuaLogoMark />

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-emerald-200/60 bg-[#F4F7F5] py-5 gap-1">
          <p className="text-xs font-mono text-[#4a6b57] uppercase tracking-widest px-5 mb-2">
            Módulos
          </p>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveModule(id)}
              className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeModule === id
                  ? "bg-[#306D29] text-white font-semibold"
                  : "text-[#4a6b57] hover:bg-white/80 hover:text-[#0D530E]"
              }`}
              style={{ boxShadow: activeModule === id ? "0 4px 6px rgba(0,0,0,0.08)" : "none" }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}

          <div className="mt-auto mx-3 p-3 rounded-2xl bg-white/70 border border-emerald-200/80">
            <p className="text-xs text-[#4a6b57] font-mono">ESP32 MQTT Broker</p>
            <p className={`text-xs font-bold mt-0.5 ${mqttConnected ? "text-[#306D29]" : "text-red-600"}`}>
              {mqttConnected ? `● ${brokerLabel}` : "○ Sin conexión MQTT"}
            </p>
          </div>
        </aside>

        {/* [2] Content — full-width, no max-w */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-white">
          {activeModule === "monitoring" && (
            <Module1Monitoring
              display={sensorDisplay}
              tempAlert={tempAlert}
              humAlert={humAlert}
              soilAlert={soilAlert}
              onPumpToggle={handlePumpToggleMonitoring}
              mqttConnected={mqttConnected}
              testModeActive={testModeActive}
            />
          )}
          {activeModule === "admin" && (
            <Module2Admin
              plantName={plantName}
              setPlantName={setPlantName}
              sensitivityLevel={sensitivityLevel}
              cooldownRemaining={cooldownRemaining}
              cooldownTotal={cooldownTotal}
              cooldownProgress={cooldownProgress}
              passiveLog={passiveLog}
              snapshot={snapshot}
              testModeActive={testModeActive}
              publishCommand={publishCommand}
            />
          )}
          {activeModule === "debug" && (
            <Module3Debug
              pumpActive={sensorDisplay.pumpActive}
              onPumpChange={handlePumpToggle}
              reviewTemp={reviewTemp}
              onReviewTempChange={handleReviewTemp}
              reviewHum={reviewHum}
              onReviewHumChange={handleReviewHum}
              reviewSoil={reviewSoil}
              onReviewSoilChange={handleReviewSoil}
              tempSensorOk={sensorDisplay.tempAirNum !== null}
              showFloodWarning={showFloodWarning}
              activeReviews={activeReviews}
              outputLog={outputLog}
              onVerStatus={handleVerStatus}
              mqttConnected={mqttConnected}
              testModeActive={testModeActive}
              commandLog={commandLog}
            />
          )}
          {activeModule === "metrics" && (
            <Module5Metrics display={sensorDisplay} snapshot={snapshot} />
          )}
        </main>
      </div>

      {/* ── [3] AI CHAT — clean, no mode tabs ───────────────── */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        {chatOpen && (
          <div
            className="w-80 md:w-96 bg-white rounded-2xl overflow-hidden flex flex-col"
            style={{ boxShadow: "0 8px 32px rgba(13,83,14,0.2)", border: "1px solid #C8E6C9" }}
          >
            <div
              className="relative flex items-center justify-center p-4"
              style={{
                background: "linear-gradient(90deg, #0D530E, #306D29)",
                boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
              }}
            >
              <p className="text-sm font-bold text-white">Asistente Botánico</p>
              <button
                onClick={() => setChatOpen(false)}
                className="absolute right-3 p-1.5 rounded-lg hover:bg-white/15 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div
              className="overflow-y-auto p-3 space-y-2.5 bg-[#F4F7F5]"
              style={{ maxHeight: "300px", scrollbarWidth: "thin" }}
            >
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[82%] text-xs px-3.5 py-2.5 leading-relaxed"
                    style={{
                      background: msg.role === "user" ? "#306D29" : "#E8F4ED",
                      color: msg.role === "user" ? "#fff" : "#0D530E",
                      borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      boxShadow: msg.role === "user" ? "0 2px 4px rgba(48,109,41,0.3)" : "none",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar — high contrast placeholder, full width */}
            <div className="p-3 border-t border-emerald-200/70 flex gap-2 bg-white">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                placeholder="Escribe tu pregunta aquí..."
                className="flex-1 text-xs bg-[#E8F4ED] rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-300 text-[#0D530E] placeholder:text-[#4a6b57]"
              />
              <button
                onClick={handleChatSend}
                className="p-2.5 bg-[#306D29] text-white rounded-xl hover:bg-[#265a22] active:scale-95 transition-all"
                style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.08)" }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setChatOpen((v) => !v)}
          className="w-14 h-14 bg-[#306D29] text-white rounded-full hover:bg-[#265a22] hover:scale-105 active:scale-95 transition-all flex items-center justify-center relative"
          style={{ boxShadow: "0 6px 20px rgba(48,109,41,0.45)" }}
        >
          {chatOpen ? <X className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
          {!chatOpen && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      </div>
    </div>
    </>
  );
}
