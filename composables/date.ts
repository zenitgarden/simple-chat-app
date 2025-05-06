import { format, isToday, isWithinInterval, isYesterday, parseISO, subDays } from 'date-fns';



export const useDate = () => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'hh:mm a');
  };

  const formatSentAt = (sentAtIso: string): string => {
    const sent = parseISO(sentAtIso)
    const now = new Date()

    if(isToday(sent)) {
      return 'Today'
    }
  
    if (isYesterday(sent)) {
      return 'Yesterday'
    }
  
    const oneWeekAgo = subDays(now, 7)
  
    if (isWithinInterval(sent, { start: oneWeekAgo, end: now })) {
      return format(sent, 'EEEE') // "Wednesday", "Monday", etc.
    }
  
    return format(sent, 'd/MMM/yyyy') 
  }

  const formatChatRow = (sentAtIso: string): string => {
    const sent = parseISO(sentAtIso)
    const now = new Date()

    if(isToday(sent)) {
      return format(sent, 'hh:mm a');
    }
  
    if (isYesterday(sent)) {
      return 'Yesterday'
    }
  
    const oneWeekAgo = subDays(now, 7)
  
    if (isWithinInterval(sent, { start: oneWeekAgo, end: now })) {
      return format(sent, 'EEEE') // "Wednesday", "Monday", etc.
    }
  
    return format(sent, 'd/MMM/yyyy') 
  }


  return { formatDate, formatSentAt, formatChatRow };
};
