'use client';

import React, { useEffect, useState } from 'react';
import { AdminApiClient } from '../../lib/api';
import { Activity, Database, Server, Cpu, RefreshCw, CheckCircle2 } from 'lucide-react';
import { SystemHealthReport } from '@washora/shared';

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const res = await AdminApiClient.getSystemHealth();
      setHealth(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // 15s polling
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !health) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">System Health & Infrastructure</h1>
          <p className="text-sm text-slate-500 mt-0.5">Safe operational status, database connectivity, and node process diagnostics</p>
        </div>

        <button
          onClick={fetchHealth}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {health && (
        <div className="space-y-6">
          {/* Status banner */}
          <div className={`p-5 rounded-2xl border flex items-center justify-between ${
            health.status === 'HEALTHY'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-base">Platform Operational Status: {health.status}</h2>
                <p className="text-xs text-emerald-700 mt-0.5">All core services and database connections functioning normally.</p>
              </div>
            </div>

            <div className="text-right text-xs font-mono text-slate-500">
              Uptime: {Math.floor(health.uptimeSeconds / 60)} min {health.uptimeSeconds % 60} sec
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Database */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">MongoDB Atlas</span>
                <Database className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-slate-900">{health.database.state}</div>
              <div className="text-xs text-slate-500">
                Ping Latency: <span className="font-mono font-bold text-slate-800">{health.database.pingMs} ms</span>
              </div>
            </div>

            {/* Memory RSS */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Memory Footprint</span>
                <Cpu className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-xl font-bold text-slate-900">{health.memory.rssMb} MB</div>
              <div className="text-xs text-slate-500">
                Heap Used: <span className="font-mono font-bold text-slate-800">{health.memory.heapUsedMb} MB</span>
              </div>
            </div>

            {/* Environment */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Environment</span>
                <Server className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 capitalize">{health.environment}</div>
              <div className="text-xs text-slate-500">
                API Version: <span className="font-mono font-bold text-slate-800">{health.version}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
