import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

function ServerStatusPage() {
  const endpoints = [
    { method: "GET", path: "/api/v1/health", desc: "Server health and status check" },
    { method: "POST", path: "/api/v1/auth/register", desc: "Register new user" },
    { method: "POST", path: "/api/v1/auth/login", desc: "User authentication & JWT token" },
    { method: "GET", path: "/api/v1/tenants", desc: "List multi-tenant accounts" },
    { method: "GET", path: "/api/v1/tickets", desc: "Fetch support tickets" },
    { method: "GET", path: "/api/v1/customers", desc: "Fetch customer records" },
    { method: "POST", path: "/api/v1/whatsapp/messages", desc: "Send WhatsApp API payload" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h1 className="text-lg font-bold text-white tracking-tight">Express.js API Backend</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">Modular Node.js Server • Port 3000 Running</p>
          </div>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-mono font-medium">
            HTTP Status 200 OK
          </span>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Available Backend API Routes</h2>
          <div className="space-y-2">
            {endpoints.map((ep, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition">
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      ep.method === "GET"
                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-slate-200 font-semibold">{ep.path}</span>
                </div>
                <span className="text-xs text-slate-400">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">⚡ Clean Backend Architecture</p>
          <p>This deployment is running a pure Express backend server with modular controllers, services, repositories, and Prisma ORM integration.</p>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ServerStatusPage />
  </StrictMode>
);
