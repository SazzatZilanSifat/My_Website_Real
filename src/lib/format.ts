export function formatPrice(price: number, status: string): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
  if (status === 'for_rent') return `${formatted}/mo`;
  return formatted;
}

export function formatPriceShort(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `$${(price / 1_000).toFixed(0)}K`;
  return `$${price}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    for_sale: 'For Sale',
    for_rent: 'For Rent',
    sold: 'Sold',
    new: 'New',
    read: 'Read',
    replied: 'Replied',
    closed: 'Closed',
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
  };
  return labels[status] ?? status;
}

export function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    house: 'House',
    apartment: 'Apartment',
    villa: 'Villa',
    land: 'Land',
    commercial: 'Commercial',
  };
  return labels[type] ?? type;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
