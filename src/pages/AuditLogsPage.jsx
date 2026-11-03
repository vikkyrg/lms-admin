import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { History, Shield, Clock } from 'lucide-react';
import { DataTable } from '../components/ui';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/audit-logs');
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-brand" />
          System Audit &amp; Compliance Logs
        </h1>
        <p className="text-xs text-ink-soft mt-1">Immutable tracking of platform administrative events, course modifications, and payments</p>
      </div>

      <DataTable
        loading={loading}
        rows={logs}
        minWidthClass="min-w-[860px]"
        skeletonRows={8}
        empty={{
          icon: Shield,
          title: 'No audit logs recorded yet',
          message: 'Administrative events will appear here automatically.'
        }}
        columns={[
          {
            key: 'action',
            header: 'Action',
            render: (log) => (
              <span className="font-mono font-semibold text-brand bg-brand-soft px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
                {log.action}
              </span>
            )
          },
          {
            key: 'performedBy',
            header: 'Performed By',
            render: (log) => <span className="font-semibold text-ink whitespace-nowrap">{log.performedBy?.name || 'System / Unregistered'}</span>
          },
          {
            key: 'role',
            header: 'Role',
            render: (log) => <span className="uppercase text-[10px] font-semibold text-ink-soft">{log.role}</span>
          },
          {
            key: 'targetResource',
            header: 'Target Resource',
            render: (log) => <span className="font-medium text-ink">{log.targetResource} {log.targetId && `(${log.targetId.slice(-6)})`}</span>
          },
          {
            key: 'createdAt',
            header: 'Timestamp',
            render: (log) => (
              <span className="text-ink-soft whitespace-nowrap inline-flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-ink-faint" />
                {new Date(log.createdAt).toLocaleString()}
              </span>
            )
          },
          {
            key: 'details',
            header: 'Details',
            className: 'max-w-xs',
            render: (log) => <span className="font-mono text-[10px] text-ink-soft block truncate">{JSON.stringify(log.details)}</span>
          }
        ]}
      />
    </div>
  );
};

export default AuditLogsPage;

