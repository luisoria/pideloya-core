import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isRestaurantOpen(restaurant: { openTime: string; closeTime: string; acceptingOrders: boolean }) {
    if (!restaurant.acceptingOrders) return false;

    // Get current time in Santiago (CLT/CLST - UTC-3)
    // Note: For a robust implementation, use a library like date-fns-tz
    const now = new Date();
    const santiagoTime = new Intl.DateTimeFormat("es-CL", {
        timeZone: "America/Santiago",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(now);

    const [currentHour, currentMinute] = santiagoTime.split(":").map(Number);
    const [openHour, openMinute] = restaurant.openTime.split(":").map(Number);
    const [closeHour, closeMinute] = restaurant.closeTime.split(":").map(Number);

    const currentTimeTotal = currentHour * 60 + currentMinute;
    const openTimeTotal = openHour * 60 + openMinute;
    const closeTimeTotal = closeHour * 60 + closeMinute;

    // Handle overnight schedules (e.g., 20:00 to 04:00)
    if (closeTimeTotal < openTimeTotal) {
        return currentTimeTotal >= openTimeTotal || currentTimeTotal < closeTimeTotal;
    }

    return currentTimeTotal >= openTimeTotal && currentTimeTotal < closeTimeTotal;
}
