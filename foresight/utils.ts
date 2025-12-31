export const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCompactCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: "compact",
    compactDisplay: "short"
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

export const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    food_dining: '🍔',
    transportation: '🚕',
    shopping: '🛍️',
    entertainment: '🎬',
    bills_utilities: '💡',
    health_fitness: '💪',
    travel: '✈️',
    income: '💰',
    subscriptions: '🔄',
    other: '📦'
  };
  return icons[category] || '📦';
};

export const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
    food_dining: '#FF6B35',
    transportation: '#4ECDC4',
    shopping: '#FF69B4',
    entertainment: '#9B59B6',
    bills_utilities: '#3498DB',
    health_fitness: '#E74C3C',
    travel: '#F39C12',
    income: '#00D9A5',
    subscriptions: '#8B5CF6',
    other: '#95A5A6',
  };
  return colors[category] || '#95A5A6';
}
