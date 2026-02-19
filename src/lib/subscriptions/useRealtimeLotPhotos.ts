import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeLotPhotos(lotId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`lot-photos-changes-${lotId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lot_photos' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lot-photos', lotId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [lotId, queryClient])
}
