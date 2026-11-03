import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAdminNotifications } from '../context/AdminNotificationsContext';
import { useFeedback } from '../components/Feedback';
import {
  Mail,
  Phone,
  User,
  MessageSquare,
  Clock,
  Inbox,
  FileText,
  CornerUpLeft,
  Trash2,
  Eye,
  MessageCircle
} from 'lucide-react';
import { DataTable, SearchBar, FilterDropdown, StatusBadge, Drawer, ActionMenu, btn } from '../components/ui';

const NOT_PROVIDED = 'Not provided';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

// WhatsApp deep link needs at least a plausible phone number. Indian 10-digit
// numbers get the +91 prefix; longer numbers are assumed to carry a country code.
const whatsappHref = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  const full = digits.length === 10 ? `91${digits}` : digits.replace(/^0+/, '');
  return `https://wa.me/${full}`;
};

const formatDateTime = (value) => {
  if (!value) return NOT_PROVIDED;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return NOT_PROVIDED;
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const EmailLink = ({ email, className = '' }) => {
  if (!isValidEmail(email)) {
    return <span className="text-ink-faint italic">{NOT_PROVIDED}</span>;
  }
  return (
    <a
      href={`mailto:${email}`}
      title={`Email ${email}`}
      className={`inline-flex items-center gap-1.5 font-medium text-brand hover:text-navy hover:underline transition-colors ${className}`}
    >
      <Mail className="h-3.5 w-3.5 shrink-0" />
      <span className="break-all">{email}</span>
    </a>
  );
};

const enquiryStatusTone = (status) =>
  status === 'unread' ? 'warning' : status === 'replied' ? 'success' : 'info';

const DetailRow = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3 py-3 border-b border-line-soft last:border-b-0">
    <div className="p-2 bg-brand-soft text-brand rounded-md shrink-0 mt-0.5">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">{label}</p>
      <div className="text-[13px] text-ink mt-0.5">{children}</div>
    </div>
  </div>
);

const EnquiriesPage = () => {
  const { markEnquiriesRead, refresh: refreshNotificationCounts } = useAdminNotifications();
  const { notify, confirm } = useFeedback();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    // Opening the enquiries page counts as reviewing all current enquiries, so
    // clear the sidebar unread badge, then load the freshly-read list.
    (async () => {
      await markEnquiriesRead();
      await fetchEnquiries();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEnquiries = async () => {
    try {
      setError(null);
      const res = await api.get('/admin/enquiries');
      setEnquiries(res.data.enquiries || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Could not load enquiries.');
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (enq) => {
    setSelected(enq);
    if (enq.status === 'unread') {
      try {
        const res = await api.patch(`/admin/enquiries/${enq._id}/status`, { status: 'read' });
        const updated = res.data.enquiry;
        setEnquiries((prev) => prev.map((e) => (e._id === enq._id ? { ...e, status: updated.status } : e)));
        setSelected((prev) => (prev && prev._id === enq._id ? { ...prev, status: updated.status } : prev));
      } catch (err) {
        console.error('Failed to update enquiry status', err);
      }
    }
  };

  const markReplied = async (enq) => {
    try {
      const res = await api.patch(`/admin/enquiries/${enq._id}/status`, { status: 'replied' });
      const updated = res.data.enquiry;
      setEnquiries((prev) => prev.map((e) => (e._id === enq._id ? { ...e, status: updated.status } : e)));
      setSelected((prev) => (prev && prev._id === enq._id ? { ...prev, status: updated.status } : prev));
    } catch (err) {
      console.error('Failed to update enquiry status', err);
    }
  };

  const replyMailtoHref = (enq) => {
    const subject = encodeURIComponent(`Re: ${enq.subject || 'General Enquiry'}`);
    const body = encodeURIComponent(
      `Dear ${enq.name || 'there'},\n\nThank you for reaching out to AutoOps School.\n\n--- Original enquiry ---\nSubject: ${enq.subject || 'General Enquiry'}\n\n${enq.message || ''}\n\n---\nBest regards,\nAutoOps School Team`
    );
    return `mailto:${enq.email}?subject=${subject}&body=${body}`;
  };

  const handleDelete = async (enq) => {
    const ok = await confirm({
      title: 'Delete Enquiry?',
      message: `Are you sure you want to permanently delete this enquiry from ${enq.name || 'the sender'}? Subject: "${enq.subject || 'General Enquiry'}". This action cannot be undone.`
    });

    if (!ok) return;

    try {
      setDeletingId(enq._id);
      const res = await api.delete(`/admin/enquiries/${enq._id}`);
      if (res.data.success) {
        notify({
          type: 'success',
          message: 'The enquiry has been permanently removed.'
        });
        // Remove from the list immediately and close the details drawer if open.
        setEnquiries((prev) => prev.filter((e) => e._id !== enq._id));
        setSelected((prev) => (prev && prev._id === enq._id ? null : prev));
        // Sync the sidebar unread badge: a deleted unread enquiry must stop
        // counting; deleted read/replied enquiries leave the count untouched.
        refreshNotificationCounts();
      }
    } catch (err) {
      console.error('Failed to delete enquiry', err);
      notify({
        type: 'error',
        message: err.response?.data?.message || 'Could not delete the enquiry.'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const unreadCount = enquiries.filter((e) => e.status === 'unread').length;

  const visibleEnquiries = enquiries.filter((e) => {
    if (statusFilter && e.status !== statusFilter) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [e.name, e.email, e.phone, e.subject, e.message]
      .some((field) => String(field || '').toLowerCase().includes(term));
  });

  const columns = [
    {
      key: 'sender',
      header: 'Sender',
      className: 'w-[190px]',
      render: (enq) => (
        <div className="min-w-0">
          <div className="font-semibold text-ink truncate flex items-center gap-1.5">
            {enq.status === 'unread' ? <span className="h-1.5 w-1.5 rounded-full bg-[#25D366] shrink-0" title="Unread" /> : null}
            {enq.name || NOT_PROVIDED}
          </div>
          <div className="text-xs mt-0.5"><EmailLink email={enq.email} className="!text-xs" /></div>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Phone',
      className: 'w-[130px]',
      render: (enq) =>
        enq.phone ? (
          <a href={`tel:${enq.phone}`} className="font-medium text-ink hover:text-brand hover:underline transition-colors whitespace-nowrap">
            {enq.phone}
          </a>
        ) : (
          <span className="text-ink-faint italic">{NOT_PROVIDED}</span>
        )
    },
    {
      key: 'subject',
      header: 'Subject',
      className: 'w-[190px]',
      render: (enq) => <span className="font-medium text-ink line-clamp-1" title={enq.subject || ''}>{enq.subject || NOT_PROVIDED}</span>
    },
    {
      key: 'message',
      header: 'Message',
      render: (enq) => (
        <p className="text-ink-soft line-clamp-2 max-w-md" title={enq.message || ''}>{enq.message || NOT_PROVIDED}</p>
      )
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-[100px]',
      render: (enq) => <StatusBadge value={enq.status} tone={enquiryStatusTone(enq.status)} />
    },
    {
      key: 'received',
      header: 'Received',
      className: 'w-[150px]',
      render: (enq) => <span className="text-ink-soft whitespace-nowrap text-xs">{formatDateTime(enq.createdAt)}</span>
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[52px]',
      render: (enq) => {
        const wa = whatsappHref(enq.phone);
        const items = [
          { label: 'View details', icon: Eye, onClick: () => openDetails(enq) }
        ];
        if (isValidEmail(enq.email)) {
          items.push({ label: 'Reply via email', icon: CornerUpLeft, onClick: () => { markReplied(enq); window.location.href = replyMailtoHref(enq); } });
        }
        if (wa) {
          items.push({ label: 'WhatsApp', icon: MessageCircle, onClick: () => window.open(wa, '_blank', 'noopener') });
        }
        items.push({ label: 'Delete…', icon: Trash2, tone: 'danger', onClick: () => handleDelete(enq), disabled: deletingId === enq._id });
        return <ActionMenu items={items} label="Enquiry actions" />;
      }
    }
  ];

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
            <Inbox className="w-5 h-5 text-brand" />
            Student Enquiries
          </h1>
          <p className="text-xs text-ink-soft mt-1">Inquiries submitted through the public website contact form</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink-soft shadow-card">
          {enquiries.length} total
          {unreadCount > 0 && (
            <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-bold text-[#92400e]">
              {unreadCount} unread
            </span>
          )}
        </span>
      </div>

      <DataTable
        columns={columns}
        rows={visibleEnquiries}
        loading={loading}
        error={error}
        onRetry={fetchEnquiries}
        minWidthClass="min-w-[1020px]"
        empty={{
          title: search || statusFilter ? 'No matching enquiries' : 'No enquiries received yet',
          message: search || statusFilter ? 'Try adjusting the search term or status filter.' : undefined
        }}
        onRowClick={openDetails}
        toolbar={
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, subject…" className="w-full max-w-xs" />
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All statuses"
              label="Filter by status"
              className="w-36"
              options={[
                { value: 'unread', label: 'Unread' },
                { value: 'read', label: 'Read' },
                { value: 'replied', label: 'Replied' }
              ]}
            />
          </>
        }
      />

      {/* Details drawer */}
      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Enquiry Details"
        description={selected ? `${selected.subject || 'General Enquiry'} · ${formatDateTime(selected.createdAt)}` : undefined}
        footer={
          selected ? (
            <div className="flex flex-wrap items-center gap-2">
              {isValidEmail(selected.email) ? (
                <a
                  href={replyMailtoHref(selected)}
                  onClick={() => markReplied(selected)}
                  className={btn('primary', 'md', 'cursor-pointer')}
                >
                  <CornerUpLeft className="h-4 w-4 text-accent" /> Reply via Email
                </a>
              ) : null}
              {whatsappHref(selected.phone) ? (
                <a
                  href={whatsappHref(selected.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={btn('secondary', 'md', 'cursor-pointer')}
                >
                  <MessageCircle className="h-4 w-4 text-[#25D366]" /> WhatsApp
                </a>
              ) : null}
              <button
                onClick={() => handleDelete(selected)}
                disabled={deletingId === selected._id}
                className={btn('danger', 'md', 'ml-auto')}
              >
                <Trash2 className="h-4 w-4" />
                {deletingId === selected._id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <StatusBadge value={selected.status} tone={enquiryStatusTone(selected.status)} />
              <span className="text-xs text-ink-faint flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatDateTime(selected.createdAt)}
              </span>
            </div>
            <DetailRow icon={User} label="Full Name">
              {selected.name || <span className="text-ink-faint italic">{NOT_PROVIDED}</span>}
            </DetailRow>
            <DetailRow icon={Mail} label="Email Address">
              <EmailLink email={selected.email} />
            </DetailRow>
            <DetailRow icon={Phone} label="Phone Number">
              {selected.phone ? (
                <a href={`tel:${selected.phone}`} className="font-medium text-ink hover:text-brand hover:underline transition-colors">
                  {selected.phone}
                </a>
              ) : (
                <span className="text-ink-faint italic">{NOT_PROVIDED}</span>
              )}
            </DetailRow>
            <DetailRow icon={MessageSquare} label="Subject / Course">
              <span className="font-semibold text-ink">{selected.subject || NOT_PROVIDED}</span>
            </DetailRow>
            <DetailRow icon={FileText} label="Message">
              <div className="rounded-md border border-line bg-canvas p-3 text-[13px] text-ink leading-relaxed whitespace-pre-wrap break-words">
                {selected.message || NOT_PROVIDED}
              </div>
            </DetailRow>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
};

export default EnquiriesPage;
