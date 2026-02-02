import React, { useState, useEffect } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { parseUnits, formatUnits, stringToHex, pad } from "viem";
import { ArrowRight, X, Check, ExternalLink, Wallet, ArrowUpRight } from "lucide-react";
import {
  tempoTestnet, ALPHA_USD, M402_DEMO_RECEIVER,
  TIP20_ABI, EXPLORER_URL, RPC_URL,
} from "./config";

/* ───────────────── DEMO CARD (REAL WALLET INTEGRATION) ───────────────── */

function DemoCard() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const [fundingState, setFundingState] = useState("idle");
  const [txState, setTxState] = useState("idle");
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const isCorrectChain = chain?.id === tempoTestnet.id;
  const wrongChain = isConnected && !isCorrectChain;

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: ALPHA_USD,
    abi: TIP20_ABI,
    functionName: "balanceOf",
    args: [address],
    query: { enabled: isConnected && isCorrectChain && !!address },
  });

  useEffect(() => {
    if (isConnected && isCorrectChain) refetchBalance();
  }, [isConnected, isCorrectChain]);

  const hasBalance = balance && balance > 0n;
  const displayBalance = hasBalance
    ? Number(formatUnits(balance, 6)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";

  const truncAddr = (a) => (a ? a.slice(0, 6) + "..." + a.slice(-4) : "");
  const truncHash = (h) => (h ? h.slice(0, 10) + "..." + h.slice(-8) : "");

  const connectWallet = () => {
    setError(null);
    const connector = connectors.find((c) => c.type === "injected") || connectors[0];
    if (connector) connect({ connector });
  };

  const switchToTempo = () => { setError(null); switchChain({ chainId: tempoTestnet.id }); };

  const fundWallet = async () => {
    setFundingState("funding");
    setError(null);
    try {
      const res = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "tempo_fundAddress", params: [address], id: 1 }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "Faucet error");
      await new Promise((r) => setTimeout(r, 4000));
      await refetchBalance();
      setFundingState("funded");
    } catch (err) {
      setError("Faucet failed: " + (err.message || "Unknown error"));
      setFundingState("idle");
    }
  };

  const executeTransaction = async () => {
    setTxState("executing");
    setError(null);
    try {
      const memo = pad(stringToHex("m402:hivemapper:-23.55,-46.63"), { size: 32 });
      const hash = await writeContractAsync({
        address: ALPHA_USD,
        abi: TIP20_ABI,
        functionName: "transferWithMemo",
        args: [M402_DEMO_RECEIVER, parseUnits("0.001", 6), memo],
      });
      setTxHash(hash);
      setTxState("complete");
      setTimeout(() => refetchBalance(), 2000);
    } catch (err) {
      setError(err.shortMessage || err.message || "Transaction failed");
      setTxState("idle");
    }
  };

  const resetDemo = () => { setTxState("idle"); setTxHash(null); setError(null); };

  const hasInjectedWallet = typeof window !== "undefined" && typeof window.ethereum !== "undefined";

  const label = { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", color: "#71717a", fontFamily: "var(--font-sans)" };
  const btn = { width: "100%", padding: "13px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "var(--font-sans)" };

  if (!hasInjectedWallet) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 16, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
          <span style={label}>LIVE ON TEMPO TESTNET</span>
        </div>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Wallet size={32} style={{ color: "#a1a1aa", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, color: "#52525b", lineHeight: 1.6, fontFamily: "var(--font-sans)" }}>
            Install MetaMask or another Web3 wallet to execute a real m402 transaction on Tempo Testnet.
          </p>
          <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer"
            style={{ ...btn, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, textDecoration: "none", width: "auto", padding: "11px 24px", background: "#0a0a0a", color: "#fff" }}>
            Install MetaMask <ExternalLink size={13} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 16, padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={label}>LIVE ON TEMPO TESTNET</span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: isConnected && isCorrectChain ? "#10b981" : "#a1a1aa", animation: isConnected && isCorrectChain ? "pulse-dot 2s ease-in-out infinite" : "none" }} />
          <span style={{ ...label, letterSpacing: "0.05em" }}>{isConnected && isCorrectChain ? "CONNECTED" : "NOT CONNECTED"}</span>
        </div>
      </div>

      {!isConnected && (
        <>
          <p style={{ fontSize: 15, color: "#27272a", lineHeight: 1.6, marginBottom: 20, fontFamily: "var(--font-serif)" }}>
            Connect your wallet to execute a real m402 payment on Tempo. No real funds needed.
          </p>
          <button onClick={connectWallet} disabled={isConnecting}
            style={{ ...btn, background: "#0a0a0a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: isConnecting ? 0.6 : 1 }}>
            <Wallet size={14} /> {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        </>
      )}

      {wrongChain && (
        <>
          <div style={{ fontSize: 12, color: "#52525b", marginBottom: 6, fontFamily: "var(--font-mono)" }}>{truncAddr(address)}</div>
          <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 16, fontFamily: "var(--font-sans)" }}>Switch to Tempo Testnet to continue.</p>
          <button onClick={switchToTempo} style={{ ...btn, background: "#0a0a0a", color: "#fff" }}>Switch to Tempo Testnet</button>
        </>
      )}

      {isConnected && isCorrectChain && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#52525b", fontFamily: "var(--font-mono)" }}>{truncAddr(address)}</div>
            <button onClick={() => disconnect()} style={{ fontSize: 11, color: "#a1a1aa", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>disconnect</button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20, padding: "12px 14px", background: "#fafafa", borderRadius: 8, border: "1px solid #e5e5e5" }}>
            <span style={{ fontSize: 12, color: "#71717a", fontFamily: "var(--font-sans)" }}>AlphaUSD Balance</span>
            <span style={{ fontSize: 16, fontWeight: 500, color: hasBalance ? "#0a0a0a" : "#a1a1aa", fontFamily: "var(--font-mono)" }}>{displayBalance}</span>
          </div>

          {!hasBalance && fundingState !== "funded" && (
            <button onClick={fundWallet} disabled={fundingState === "funding"}
              style={{ ...btn, background: "#10b981", color: "#fff", opacity: fundingState === "funding" ? 0.7 : 1 }}>
              {fundingState === "funding" ? "Claiming testnet funds..." : "Get Testnet Funds (Free)"}
            </button>
          )}

          {(hasBalance || fundingState === "funded") && (
            <div style={{ background: "#09090b", borderRadius: 10, padding: 22, marginTop: 4, color: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#71717a", fontFamily: "var(--font-sans)" }}>REAL TRANSACTION</span>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#71717a", fontFamily: "var(--font-sans)" }}>AMOUNT</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 6 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "var(--font-sans)" }}>Hivemapper Street Query</div>
                  <div style={{ fontSize: 11, color: "#71717a", marginTop: 3, fontFamily: "var(--font-mono)" }}>S\u00e3o Paulo, -23.55, -46.63</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 500, fontFamily: "var(--font-mono)" }}>$0.001</div>
              </div>
              <div style={{ marginTop: 14, padding: "8px 10px", background: "#18181b", borderRadius: 6 }}>
                <span style={{ fontSize: 10, color: "#52525b", fontFamily: "var(--font-mono)" }}>MEMO: </span>
                <span style={{ fontSize: 10, color: "#71717a", fontFamily: "var(--font-mono)" }}>m402:hivemapper:-23.55,-46.63</span>
              </div>

              {txState === "idle" && (
                <button onClick={executeTransaction}
                  style={{ ...btn, marginTop: 16, background: "#18181b", border: "1px solid #27272a", color: "#fff" }}>
                  Execute with m402 <ArrowRight size={13} style={{ display: "inline", verticalAlign: "-2px", marginLeft: 4 }} />
                </button>
              )}
              {txState === "executing" && (
                <button disabled style={{ ...btn, marginTop: 16, background: "#18181b", border: "1px solid #27272a", color: "#71717a", cursor: "wait" }}>Sending on Tempo...</button>
              )}
              {txState === "complete" && txHash && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <Check size={14} style={{ color: "#10b981" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#10b981", fontFamily: "var(--font-sans)" }}>Payment settled on Tempo</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: "#71717a", fontFamily: "var(--font-mono)" }}>tx: {truncHash(txHash)}</span>
                    <button onClick={() => { navigator.clipboard.writeText(txHash); }} title="Copy full tx hash"
                      style={{ background: "none", border: "1px solid #27272a", borderRadius: 4, padding: "2px 6px", cursor: "pointer", fontSize: 10, color: "#71717a", fontFamily: "var(--font-mono)" }}>
                      copy
                    </button>
                  </div>
                  <a href={EXPLORER_URL + "/tx/" + txHash} target="_blank" rel="noopener noreferrer"
                    style={{ ...btn, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#10b981", color: "#fff", textDecoration: "none" }}>
                    View on Tempo Explorer <ExternalLink size={13} />
                  </a>
                  <button onClick={resetDemo}
                    style={{ marginTop: 8, fontSize: 11, color: "#52525b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", width: "100%", textAlign: "center" }}>
                    run another transaction
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {error && (
        <div style={{ fontSize: 12, color: "#ef4444", marginTop: 12, lineHeight: 1.5, padding: "8px 10px", background: "#fef2f2", borderRadius: 6, fontFamily: "var(--font-sans)" }}>{error}</div>
      )}
    </div>
  );
}

/* ───────────────── HALFTONE PATTERN SVG ───────────────── */

function HalftonePattern() {
  const dots = [];
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 20; x++) {
      const distFromCenter = Math.sqrt(Math.pow(x - 10, 2) + Math.pow(y - 12, 2));
      const maxDist = 16;
      const normalizedDist = Math.min(distFromCenter / maxDist, 1);
      const radius = 1.8 * (1 - normalizedDist * 0.7);
      const opacity = 0.12 + (1 - normalizedDist) * 0.15;
      if (normalizedDist < 1) {
        dots.push(
          <circle key={x + "-" + y} cx={x * 14 + (y % 2 ? 7 : 0)} cy={y * 14} r={radius} fill="#000" opacity={opacity} />
        );
      }
    }
  }
  return (
    <svg width="280" height="390" viewBox="0 0 280 390" style={{ position: "absolute", right: -30, top: 20, opacity: 0.4 }}>
      {dots}
    </svg>
  );
}

/* ───────────────── MÖBIUS STRIP (Animated Canvas) ───────────────── */

function MobiusCanvas() {
  const canvasRef = React.useRef(null);
  const animRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 640, H = 520;
    canvas.width = W;
    canvas.height = H;
    let angle = 0;

    function render() {
      ctx.clearRect(0, 0, W, H);
      angle += 0.004;
      const R = 100, hw = 30, segs = 70;
      const tiltX = 0.35, persp = 450;
      const cx = W / 2, cy = H / 2;

      const points = [];

      for (let i = 0; i <= segs; i++) {
        const u = (i / segs) * Math.PI * 2;
        const steps = 12;
        for (let j = 0; j <= steps; j++) {
          const v = -hw + (j / steps) * 2 * hw;
          let x = (R + v * Math.cos(u / 2)) * Math.cos(u);
          let y = (R + v * Math.cos(u / 2)) * Math.sin(u);
          let z = v * Math.sin(u / 2);

          let nx = x * Math.cos(angle) - z * Math.sin(angle);
          let nz = x * Math.sin(angle) + z * Math.cos(angle);
          x = nx; z = nz;

          let ny = y * Math.cos(tiltX) - z * Math.sin(tiltX);
          nz = y * Math.sin(tiltX) + z * Math.cos(tiltX);
          y = ny; z = nz;

          const s = persp / (persp + z);
          const sx = x * s + cx;
          const sy = y * s + cy;

          const depth = (z + R + hw) / (2 * (R + hw));
          points.push({ sx, sy, z, depth, s });
        }
      }

      points.sort((a, b) => a.z - b.z);

      points.forEach(({ sx, sy, depth, s }) => {
        const radius = Math.max(0.8, 1.6 * s);
        const alpha = 0.15 + depth * 0.55;
        const gray = Math.floor(80 + depth * 120);
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + gray + "," + gray + "," + gray + "," + alpha + ")";
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(render);
    }
    animRef.current = requestAnimationFrame(render);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block" }} />;
}

/* ───────────────── MAIN APP ───────────────── */

export default function App() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div style={{ color: "#0a0a0a", background: "#fff", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=DM+Mono:wght@300;400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        :root {
          --font-serif: 'Instrument Serif', Georgia, serif;
          --font-sans: 'DM Sans', system-ui, sans-serif;
          --font-mono: 'DM Mono', monospace;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }

        ::selection { background: #10b981; color: #fff; }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        a { color: inherit; text-decoration: none; }

        .nav-link { color: #52525b; transition: color 0.15s; }
        .nav-link:hover { color: #0a0a0a; }
      `}</style>

      {/* ==================== NAV ==================== */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(24px, 5vw, 80px)", height: 56,
        borderBottom: "1px solid #f0f0f0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <span style={{ fontSize: 18, fontWeight: 500, fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}>m402</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 14 }}>
          <a className="nav-link" href="#">Docs</a>
          <a className="nav-link" href="#">Whitepaper</a>
          <a href="#" style={{ fontSize: 14, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4, color: "#0a0a0a" }}>
            Contact <ArrowUpRight size={14} />
          </a>
        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <section style={{ padding: "80px clamp(24px, 5vw, 80px) 60px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 60, alignItems: "flex-start", flexWrap: "wrap" }}>

          {/* Left */}
          <div style={{ flex: "1 1 460px", minWidth: 320 }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(56px, 7vw, 80px)", fontWeight: 400, lineHeight: 0.95, letterSpacing: "-1px" }}>
              m402
            </div>
            <div style={{ fontSize: 16, color: "#71717a", marginTop: 10, fontFamily: "var(--font-sans)", fontWeight: 500 }}>
              Machine Payment Required
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: "#3f3f46", marginTop: 28, maxWidth: 480 }}>
              m402 is an open protocol for machine-native payments. It extends payment infrastructure
              from the web to the physical world, enabling autonomous systems to purchase real-world
              data from distributed sensor networks through instant stablecoin micropayments. m402
              exists because machines that can think and move should also be able to pay.
            </p>

            <div style={{ marginTop: 36 }}>
              <h3 style={{ fontSize: 16, fontWeight: 400, display: "flex", alignItems: "center", gap: 10, marginBottom: 16, fontFamily: "var(--font-sans)" }}>
                <span style={{ fontSize: 18 }}>&rarr;</span> Query sensor data with a single line of code
              </h3>
              <div style={{ background: "#fafafa", borderRadius: 10, padding: "20px 22px", border: "1px solid #e5e5e5" }}>
                <pre style={{ fontSize: 13, lineHeight: 1.7, color: "#3f3f46", fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap" }}>{`agent = m402.Agent(wallet="0x...machine")

data = await agent.query(
    provider="hivemapper",
    lat=-23.5505, lng=-46.6333,
    radius_m=100
)
# $0.001 | settled in <1s | memo attached`}</pre>
              </div>
              <p style={{ fontSize: 14, color: "#71717a", marginTop: 14, lineHeight: 1.6 }}>
                That's it. Add one line of code to query any sensor network. Payment and data
                delivery happen in one atomic transaction. No browser, no credit card, no human.
              </p>
            </div>
          </div>

          {/* Right: Visual + Try It */}
          <div style={{ flex: "1 1 340px", minWidth: 300, maxWidth: 400, position: "relative" }}>
            {/* Visual state with rotating Möbius + overlaid Try It */}
            <div style={{
              transition: "opacity 0.3s ease, transform 0.3s ease",
              opacity: showDemo ? 0 : 1,
              transform: showDemo ? "scale(0.97)" : "scale(1)",
              position: showDemo ? "absolute" : "relative",
              pointerEvents: showDemo ? "none" : "auto",
              width: "100%", top: 0,
            }}>
              <div style={{ position: "relative" }}>
                <HalftonePattern />
                <MobiusCanvas />
                <button onClick={() => setShowDemo(true)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "75%",
                    padding: "14px 22px",
                    background: "#0a0a0a", color: "#fff",
                    border: "none", borderRadius: 50, cursor: "pointer",
                    fontSize: 15, fontWeight: 500, fontFamily: "var(--font-sans)",
                    position: "absolute",
                    bottom: 40,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 2,
                  }}>
                  <span>Try it</span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>

            {/* Demo card state */}
            <div style={{
              transition: "opacity 0.3s ease, transform 0.3s ease",
              opacity: showDemo ? 1 : 0,
              transform: showDemo ? "scale(1)" : "scale(1.02)",
              pointerEvents: showDemo ? "auto" : "none",
              position: showDemo ? "relative" : "absolute",
              width: "100%", top: 0,
            }}>
              <DemoCard />
              <button onClick={() => setShowDemo(false)}
                style={{ marginTop: 10, fontSize: 12, color: "#a1a1aa", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "var(--font-sans)" }}>
                &larr; back
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== STATS BAR ==================== */}
      <section style={{ borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0", padding: "32px clamp(24px, 5vw, 80px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          {[
            { val: "$55B+", label: "Market" },
            { val: "100x", label: "Cheaper" },
            { val: "<1s", label: "Settlement" },
            { val: "$0", label: "Protocol fees" },
          ].map((s, i) => (
            <div key={i} style={{ flex: "1 1 100px" }}>
              <div style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400, fontFamily: "var(--font-serif)", letterSpacing: "-0.5px" }}>{s.val}</div>
              <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== WHAT'S M402 (two-column like x402) ==================== */}
      <section style={{ padding: "80px clamp(24px, 5vw, 80px)", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 60, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "0 0 auto" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 400, lineHeight: 1.1, whiteSpace: "nowrap" }}>
              What's m402?
            </h2>
          </div>
          <div style={{ flex: "1 1 400px", maxWidth: 560 }}>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "#52525b" }}>
              Autonomous systems make thousands of decisions per hour. But every time they need
              data, a human has to negotiate a contract, manage a subscription, or provision an API key.
              It's time for an open, machine-native form of payments. A payment rail that doesn't
              require human intervention, contracts, or subscriptions. Payments that are instant for
              machines and AI agents.
            </p>
          </div>
        </div>

        {/* Three icon columns (like x402's HTTP-native row) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40, marginTop: 64, borderTop: "1px solid #f0f0f0", paddingTop: 48 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16 }}>&#60;/&#62;</span>
              </div>
              <span style={{ fontSize: 10, color: "#a1a1aa", fontFamily: "var(--font-mono)" }}>&#8226;</span>
            </div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 400, lineHeight: 1.3 }}>
              HTTP-native. Built for machines.
            </h3>
            <p style={{ fontSize: 14, color: "#71717a", marginTop: 8, lineHeight: 1.65 }}>
              m402 uses the HTTP 402 status code. Machines request data, get a payment prompt, pay, and receive. No SDKs, no sessions.
            </p>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16 }}>&#8644;</span>
              </div>
              <span style={{ fontSize: 10, color: "#a1a1aa", fontFamily: "var(--font-mono)" }}>&#8226;</span>
            </div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 400, lineHeight: 1.3 }}>
              Atomic data-for-payment.
            </h3>
            <p style={{ fontSize: 14, color: "#71717a", marginTop: 8, lineHeight: 1.65 }}>
              Query and payment settle in one transaction. No invoicing, no reconciliation lag. Memos are on-chain.
            </p>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16 }}>&#9678;</span>
              </div>
              <span style={{ fontSize: 10, color: "#a1a1aa", fontFamily: "var(--font-mono)" }}>&#8226;</span>
            </div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 400, lineHeight: 1.3 }}>
              Physical world data.
            </h3>
            <p style={{ fontSize: 14, color: "#71717a", marginTop: 8, lineHeight: 1.65 }}>
              Not just APIs. Street imagery, vehicle telemetry, GPS corrections, weather data. Real sensors, real payments.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== FEATURE BANNER (like x402's "It's how the internet should be") ==================== */}
      <section style={{ padding: "60px clamp(24px, 5vw, 80px)", borderTop: "1px solid #f0f0f0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ fontSize: 15, color: "#10b981", fontWeight: 500, textAlign: "center", marginBottom: 40, fontFamily: "var(--font-sans)" }}>
            Built for machines that need to pay: open, instant, and effortless
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 0, borderTop: "1px solid #e5e5e5" }}>
            {[
              { icon: "$", title: "Zero protocol fees", desc: "m402 is free. Just pay nominal Tempo network fees (~$0.0001)." },
              { icon: "\u21BB", title: "Sub-second settlement", desc: "Money moves at the speed of the internet, not the speed of blocks." },
              { icon: "\u2261", title: "Native memos", desc: "Every payment carries a 32-byte memo for automatic reconciliation." },
              { icon: "\u25A8", title: "Payment lanes", desc: "Dedicated blockspace. Never compete with DeFi or memecoins." },
              { icon: "\u2713", title: "Stablecoin gas", desc: "Pay fees in any stablecoin. No ETH required, ever." },
              { icon: "\u2194", title: "EVM compatible", desc: "Standard Solidity tooling works out of the box. No new language." },
            ].map((card, i) => (
              <div key={i} style={{ padding: "24px 20px", borderRight: i < 5 ? "1px solid #f0f0f0" : "none", borderBottom: "1px solid #e5e5e5" }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, fontSize: 14, color: "#52525b" }}>
                  {card.icon}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{card.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: "#71717a" }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== OLD WAY vs NEW WAY ==================== */}
      <section style={{ padding: "80px clamp(24px, 5vw, 80px)", borderTop: "1px solid #f0f0f0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 400, lineHeight: 1.15, textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
            We need a new way for machines to access data...
          </h2>
          <p style={{ fontSize: 15, color: "#71717a", textAlign: "center", marginTop: 16, lineHeight: 1.7, maxWidth: 540, margin: "16px auto 0" }}>
            The old way of buying data is barely working for a human world, let alone an autonomous future. m402 does in milliseconds what existing systems can't do at all.
          </p>

          <div style={{ display: "flex", gap: 40, marginTop: 56, flexWrap: "wrap" }}>
            {/* OLD WAY */}
            <div style={{ flex: "1 1 400px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", color: "#a1a1aa", marginBottom: 28 }}>THE OLD WAY</div>
              {[
                { title: "Identify data provider and negotiate contract", sub: "3-6 weeks of sales calls and legal review" },
                { title: "Sign enterprise agreement with minimums", sub: "$10K+ annual commitment, regardless of usage" },
                { title: "Wait for API key provisioning", sub: "Days to weeks for technical onboarding" },
                { title: "Build custom integration per provider", sub: "Engineering time for each new data source" },
                { title: "Pay monthly subscription", sub: "Machine uses <5% of purchased data" },
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 16, marginBottom: 28, alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 500, color: "#a1a1aa", fontFamily: "var(--font-mono)" }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0a", lineHeight: 1.4 }}>{step.title}</div>
                    <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 3, fontFamily: "var(--font-mono)" }}>{step.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* NEW WAY */}
            <div style={{ flex: "1 1 400px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", color: "#10b981", marginBottom: 28 }}>WITH M402</div>
              {[
                { title: "Machine sends query and receives 402: Payment Required", sub: "No account setup, instant onboarding" },
                { title: "Machine pays instantly with stablecoins on Tempo", sub: "No signups or approvals required" },
                { title: "Data delivered. Done.", sub: "No API key management, no security risks" },
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 16, marginBottom: 28, alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 600, color: "#fff", fontFamily: "var(--font-mono)" }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0a", lineHeight: 1.4 }}>{step.title}</div>
                    <div style={{ fontSize: 13, color: "#10b981", marginTop: 3, fontFamily: "var(--font-mono)" }}>{step.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== INFRASTRUCTURE TABLE ==================== */}
      <section style={{ padding: "80px clamp(24px, 5vw, 80px)", borderTop: "1px solid #f0f0f0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 400, lineHeight: 1.15 }}>
            Not all blockchains are built for payments.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, maxWidth: 560, marginTop: 16, color: "#52525b" }}>
            General-purpose L2s were designed for DeFi and NFTs. Tempo was designed for one thing: moving money.
          </p>

          <div style={{ marginTop: 40, border: "1px solid #e5e5e5", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", background: "#fafafa", borderBottom: "1px solid #e5e5e5" }}>
              <div style={{ padding: "14px 22px" }} />
              <div style={{ padding: "14px 22px", fontSize: 12, fontWeight: 600, color: "#a1a1aa", letterSpacing: "0.05em" }}>GENERAL L2s</div>
              <div style={{ padding: "14px 22px", fontSize: 12, fontWeight: 600, color: "#0a0a0a", letterSpacing: "0.05em" }}>TEMPO</div>
            </div>
            {[
              { metric: "Cost per tx", l2: "~$0.01", tempo: "~$0.0001" },
              { metric: "Gas token", l2: "ETH (hold separately)", tempo: "Any stablecoin" },
              { metric: "Blockspace", l2: "Shared with DeFi, NFTs", tempo: "Dedicated payment lanes" },
              { metric: "Reconciliation", l2: "Custom smart contracts", tempo: "Native 32-byte memos" },
              { metric: "Settlement", l2: "2-10 seconds", tempo: "Sub-second" },
              { metric: "Throughput", l2: "~1,000 TPS", tempo: "100,000+ TPS" },
            ].map((row, i, arr) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", borderBottom: i < arr.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                <div style={{ padding: "14px 22px", fontSize: 14, fontWeight: 500, color: "#52525b" }}>{row.metric}</div>
                <div style={{ padding: "14px 22px", fontSize: 13, color: "#a1a1aa", fontFamily: "var(--font-mono)" }}>{row.l2}</div>
                <div style={{ padding: "14px 22px", fontSize: 13, color: "#0a0a0a", fontWeight: 500, fontFamily: "var(--font-mono)" }}>{row.tempo}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#a1a1aa", marginTop: 20 }}>
            Built on Tempo. Incubated by Stripe and Paradigm.
          </div>
        </div>
      </section>

      {/* ==================== DATA SOURCES ==================== */}
      <section style={{ padding: "80px clamp(24px, 5vw, 80px)", background: "#fafafa", borderTop: "1px solid #f0f0f0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 400, lineHeight: 1.15 }}>
            Connected sensor networks
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 40 }}>
            {[
              { name: "Hivemapper", type: "Street-level imagery", coverage: "300K+ dashcams", price: "$0.001" },
              { name: "DIMO", type: "Vehicle telemetry", coverage: "1M+ vehicles", price: "$0.001" },
              { name: "Geodnet", type: "cm-precision GPS", coverage: "13K+ stations", price: "$0.002" },
              { name: "WeatherXM", type: "Hyperlocal weather", coverage: "6K+ stations", price: "$0.0005" },
            ].map((s, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, padding: "22px 20px" }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>{s.type}</div>
                <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 2 }}>{s.coverage}</div>
                <div style={{ fontSize: 20, fontWeight: 500, color: "#10b981", marginTop: 14, fontFamily: "var(--font-mono)" }}>
                  {s.price}<span style={{ fontSize: 11, color: "#a1a1aa", fontWeight: 400, marginLeft: 4 }}>per query</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer style={{ padding: "40px clamp(24px, 5vw, 80px)", borderTop: "1px solid #e5e5e5" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 500, fontFamily: "var(--font-mono)" }}>m402</span>
            <span style={{ fontSize: 12, color: "#a1a1aa", marginLeft: 10 }}>Machine Payment Required</span>
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: 13 }}>
            <a className="nav-link" href="#">Docs</a>
            <a className="nav-link" href="#">GitHub</a>
            <a className="nav-link" href="#">SDK</a>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: "20px auto 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 11, color: "#a1a1aa" }}>Built on Tempo</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#a1a1aa" }}>Srilekha Reddy</span>
            <a href="https://www.linkedin.com/in/srilekha-reddy/" target="_blank" rel="noopener noreferrer" style={{ color: "#a1a1aa", lineHeight: 0, display: "inline-flex" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="https://github.com/Lekha-Reddy-git-hub" target="_blank" rel="noopener noreferrer" style={{ color: "#a1a1aa", lineHeight: 0, display: "inline-flex" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
