/**
 * Course pricing/type helpers for the Admin panel.
 *
 * Same rules the API and the student site use: free vs paid is derived from the
 * course record (`isFree`, `price`, `discountPrice`) and never hardcoded.
 */
export const resolvePrice = (course) => {
  if (!course) return 0;
  if (course.isFree) return 0;
  const price = Number(course.price) || 0;
  const discount = Number(course.discountPrice) || 0;
  return discount > 0 ? discount : price;
};

export const isFreeCourse = (course) => resolvePrice(course) === 0;

export const formatCoursePrice = (course) => {
  const price = resolvePrice(course);
  if (price <= 0) return 'Free';
  return `₹${price.toLocaleString('en-IN')}`;
};

export const courseTypeLabel = (course) => (isFreeCourse(course) ? 'Free' : 'Paid');

export const formatIndianRupee = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN')}`;

export const PLACEHOLDER_THUMB = '/course-placeholder.svg';

export const resolveThumbnailUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.trim()) return PLACEHOLDER_THUMB;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const apiBase = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/api\/v1\/?$/, '');
  if (trimmed.startsWith('/')) {
    return `${apiBase}${trimmed}`;
  }
  return `${apiBase}/${trimmed}`;
};

/**
 * Payment column wording for the approvals table.
 * Free enrollments never have (and never need) a payment record.
 */
export const paymentSummary = (enrollment) => {
  const free = isFreeCourse(enrollment?.course);
  const payment = enrollment?.payment;

  if (!payment) {
    return free
      ? { label: 'Not Required · Free Enrollment', tone: 'neutral' }
      : { label: 'No verified payment yet', tone: 'warning' };
  }

  const amount = formatIndianRupee(Number(payment.amount) || 0);
  switch (payment.status) {
    case 'completed':
      return { label: `Paid ${amount} · Verified`, tone: 'success' };
    case 'created':
      return { label: `${amount} · Checkout started, unverified`, tone: 'warning' };
    case 'failed':
      return { label: `${amount} · Failed`, tone: 'danger' };
    case 'refunded':
      return { label: `${amount} · Refunded`, tone: 'danger' };
    default:
      return { label: `${amount} · ${payment.status}`, tone: 'neutral' };
  }
};
