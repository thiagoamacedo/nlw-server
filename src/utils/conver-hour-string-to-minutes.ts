export function convertHourStringToMinutes(time: string) {
  const [hour, minutes] = time.split(':').map(Number);
  const minutesAmount = hour * 60 + minutes;

  return minutesAmount;
}