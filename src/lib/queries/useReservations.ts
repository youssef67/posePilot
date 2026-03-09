import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Reservation } from '@/types/database'

export type { Reservation }

export function useReservations(lotId: string) {
  return useQuery({
    queryKey: ['reservations', { lotId }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, pieces(nom), reservation_photos(*)')
        .eq('lot_id', lotId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as unknown as Reservation[]).map((r) => ({
        ...r,
        reservation_photos: [...(r.reservation_photos ?? [])].sort((a, b) => a.position - b.position),
      }))
    },
    enabled: !!lotId,
    placeholderData: [],
  })
}
