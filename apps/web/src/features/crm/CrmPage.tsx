import { useEffect, useState } from "react";
import { ModuleShell, type ModuleKpi } from "../../shared/ui/ModuleShell";
import { api } from "../../shared/api/client";
import { formatIdr, formatNumber } from "../../shared/lib/format";

interface Customer {
  id: string;
}

interface Lead {
  id: string;
  status?: string;
  expectedValue?: number;
}

const OPEN_LEAD = new Set(["new", "contacted", "qualified", "proposal", "negotiation"]);

export function CrmPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.get<{ data?: Customer[] }>("/crm/customers"),
      api.get<{ data?: Lead[] }>("/crm/leads")
    ])
      .then(([custRes, leadRes]) => {
        if (!active) return;
        if (custRes.status === "fulfilled") {
          const next = custRes.value.data?.data;
          setCustomers(Array.isArray(next) ? next : []);
        }
        if (leadRes.status === "fulfilled") {
          const next = leadRes.value.data?.data;
          setLeads(Array.isArray(next) ? next : []);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const customerCount = customers.length;
  const leadCount = leads.length;
  const openLead = leads.filter((l) => OPEN_LEAD.has(l.status ?? "")).length;
  const expectedValue = leads.reduce((sum, l) => sum + (l.expectedValue ?? 0), 0);

  const kpis: ModuleKpi[] = [
    { label: "Customer", value: formatNumber(customerCount) },
    { label: "Lead Aktif", value: formatNumber(openLead), tone: "positive" },
    { label: "Total Lead", value: formatNumber(leadCount), tone: "muted" },
    { label: "Potensi Nilai", value: formatIdr(expectedValue) }
  ];

  return (
    <ModuleShell
      title="CRM & Pelanggan"
      subtitle="Kelola data pelanggan, lead, dan riwayat interaksi untuk mempercepat closing penjualan."
      kpis={kpis}
      loading={loading}
      empty={
        customerCount === 0 && leadCount === 0
          ? {
              icon: "🤝",
              title: "Belum ada pelanggan",
              description:
                "Tambahkan pelanggan dan lead untuk mulai melacak interaksi dan pipeline penjualan."
            }
          : undefined
      }
    />
  );
}
