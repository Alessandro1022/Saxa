/** Kort bokningsnummer som kund och salong kan läsa upp för varandra, t.ex. SX-4F2A9C. */
export const bookingRef = (id: string) => 'SX-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
