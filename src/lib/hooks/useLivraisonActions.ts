import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateLivraison } from '@/lib/mutations/useCreateLivraison'
import { useUpdateLivraisonStatus } from '@/lib/mutations/useUpdateLivraisonStatus'

export function useLivraisonActions(chantierId: string) {
  const createLivraison = useCreateLivraison()
  const updateLivraisonStatus = useUpdateLivraisonStatus()

  const [showLivraisonSheet, setShowLivraisonSheet] = useState(false)
  const [livraisonDescription, setLivraisonDescription] = useState('')
  const [livraisonError, setLivraisonError] = useState('')
  const [showDateSheet, setShowDateSheet] = useState(false)
  const [datePrevue, setDatePrevue] = useState('')
  const [livraisonToUpdate, setLivraisonToUpdate] = useState<string | null>(null)

  function handleOpenLivraisonSheet() {
    setLivraisonDescription('')
    setLivraisonError('')
    setShowLivraisonSheet(true)
  }

  function handleCreateLivraison() {
    const trimmed = livraisonDescription.trim()
    if (!trimmed) {
      setLivraisonError('La description est requise')
      return
    }
    createLivraison.mutate(
      { chantierId, description: trimmed },
      {
        onSuccess: () => {
          setShowLivraisonSheet(false)
          toast('Livraison créée')
        },
        onError: () => {
          toast.error('Erreur lors de la création de la livraison')
        },
      },
    )
  }

  function handleMarquerPrevu(id: string) {
    setLivraisonToUpdate(id)
    setDatePrevue('')
    setShowDateSheet(true)
  }

  function handleConfirmDatePrevue() {
    if (!livraisonToUpdate || !datePrevue) return
    updateLivraisonStatus.mutate(
      { livraisonId: livraisonToUpdate, chantierId, newStatus: 'prevu', datePrevue },
      {
        onSuccess: () => {
          setShowDateSheet(false)
          setLivraisonToUpdate(null)
          toast('Livraison marquée prévu')
        },
        onError: () => {
          toast.error('Erreur lors de la mise à jour')
        },
      },
    )
  }

  function handleConfirmerLivraison(id: string) {
    updateLivraisonStatus.mutate(
      { livraisonId: id, chantierId, newStatus: 'livre' },
      {
        onSuccess: () => toast('Livraison confirmée'),
        onError: () => toast.error('Erreur lors de la confirmation'),
      },
    )
  }

  return {
    showLivraisonSheet,
    setShowLivraisonSheet,
    livraisonDescription,
    setLivraisonDescription,
    livraisonError,
    showDateSheet,
    setShowDateSheet,
    datePrevue,
    setDatePrevue,
    handleOpenLivraisonSheet,
    handleCreateLivraison,
    handleMarquerPrevu,
    handleConfirmDatePrevue,
    handleConfirmerLivraison,
    createLivraisonPending: createLivraison.isPending,
    updateStatusPending: updateLivraisonStatus.isPending,
  }
}
