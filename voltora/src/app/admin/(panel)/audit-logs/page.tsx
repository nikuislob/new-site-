"use client";

import { useEffect, useState } from "react";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/audit-logs")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed");
        setLogs(data.logs || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-white">Audit Logs</h1>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-white/50">
            <tr>
              <th className="px-3 py-3">When</th>
              <th className="px-3 py-3">Admin</th>
              <th className="px-3 py-3">Action</th>
              <th className="px-3 py-3">Entity</th>
              <th className="px-3 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-white/5">
                <td className="px-3 py-3">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-3 py-3">{log.admin?.name}</td>
                <td className="px-3 py-3">{log.action}</td>
                <td className="px-3 py-3">
                  {log.entity} {log.entityId}
                </td>
                <td className="px-3 py-3 max-w-sm truncate">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
