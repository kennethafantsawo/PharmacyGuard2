export function getCurrentWeekText(): string {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const options: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'short' 
  };
  
  const startText = startOfWeek.toLocaleDateString('fr-FR', options);
  const endText = endOfWeek.toLocaleDateString('fr-FR', options);
  const year = startOfWeek.getFullYear();
  
  return `Semaine du ${startText} - ${endText} ${year}`;
}

export function scheduleWeeklyUpdate(callback: () => void): void {
  const checkTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Check if it's 7:00 AM
    if (hours === 7 && minutes === 0) {
      callback();
    }
  };
  
  // Check every minute
  setInterval(checkTime, 60000);
  
  // Also check immediately
  checkTime();
}

export function isCurrentWeek(startDate: string, endDate: string): boolean {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return now >= start && now <= end;
}

export function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as Moroccan phone number
  if (digits.length === 10 && digits.startsWith('0')) {
    return digits.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3-$4');
  }
  
  return phone;
}
