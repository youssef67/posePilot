import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateLivraison } from '@/lib/mutations/useCreateLivraison'
import { useUpdateLivraisonStatus } from '@/lib/mutations/useUpdateLivraisonStatus'
import { useUpdateLivraison } from '@/lib/mutations/useUpdateLivraison'
import { useDeleteLivraison } from '@/lib/mutations/useDeleteLivraison'
import type { Besoin, Livraison } from '@/types/database'

export function useLivraisonActions(chantierId: string) {
  const createLivraison = useCreateLivraison()
  const updateLivraisonStatus = useUpdateLivraisonStatus()
  const updateLivraison = useUpdateLivraison()
  const deleteLivraison = useDeleteLivraison()

  // Création
  const [showLivraisonSheet, setShowLivraisonSheet] = useState(false)
  const [livraisonDescription, setLivraisonDescription] = useState('')
  const [livraisonFournisseur, setLivraisonFournisseur] = useState('')
  const [livraisonError, setLivraisonError] = useState('')

  // Marquer prévu
  const [showDateSheet, setShowDateSheet] = useState(false)
  const [datePrevue, setDatePrevue] = useState('')
  const [livraisonToUpdate, setLivraisonToUpdate] = useState<string | null>(null)

  // Suppression
  const [livraisonToDelete, setLivraisonToDelete] = useState<Livraison | null>(null)
  const [deleteLinkedBesoins, setDeleteLinkedBesoins] = useState<Besoin[]>([])
  const [showDeleteSheet, setShowDeleteSheet] = useState(false)

  // Édition
  const [livraisonToEdit, setLivraisonToEdit] = useState<Livraison | null>(null)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [editDescription, setEditDescription] = useState('')
  const [editFournisseur, setEditFournisseur] = useState('')
  const [editDatePrevue, setEditDatePrevue] = useState('')
  const [editError, setEditError] = useState('')

  function handleOpenLivraisonSheet() {
    setLivraisonDescription('')
    setLivraisonFournisseur('')
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
      { chantierId, description: trimmed, fournisseur: livraisonFournisseur.trim() || undefined },
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

  function handleEditLivraison(livraison: Livraison) {
    setLivraisonToEdit(livraison)
    setEditDescription(livraison.description)
    setEditFournisseur(livraison.fournisseur ?? '')
    setEditDatePrevue(livraison.date_prevue ?? '')
    setEditError('')
    setShowEditSheet(true)
  }

  function handleConfirmEdit() {
    const trimmed = editDescription.trim()
    if (!trimmed) {
      setEditError('La description est requise')
      return
    }
    if (!livraisonToEdit) return
    updateLivraison.mutate(
      {
        id: livraisonToEdit.id,
        chantierId,
        description: trimmed,
        fournisseur: editFournisseur.trim() || null,
        datePrevue: editDatePrevue || null,
      },
      {
        onSuccess: () => {
          setShowEditSheet(false)
          setLivraisonToEdit(null)
          toast('Livraison modifiée')
        },
        onError: () => toast.error('Erreur lors de la modification'),
      },
    )
  }

  function handleDeleteLivraison(livraison: Livraison, linkedBesoins: Besoin[]) {
    setLivraisonToDelete(livraison)
    setDeleteLinkedBesoins(linkedBesoins)
    setShowDeleteSheet(true)
  }

  function handleConfirmDelete(mode: 'release-besoins' | 'delete-all') {
    if (!livraisonToDelete) return
    deleteLivraison.mutate(
      {
        livraisonId: livraisonToDelete.id,
        chantierId,
        mode,
        linkedBesoinIds: deleteLinkedBesoins.map((b) => b.id),
        bcFileUrl: livraisonToDelete.bc_file_url,
        blFileUrl: livraisonToDelete.bl_file_url,
      },
      {
        onSuccess: () => {
          setShowDeleteSheet(false)
          setLivraisonToDelete(null)
          setDeleteLinkedBesoins([])
          toast('Livraison supprimée')
        },
        onError: () => toast.error('Erreur lors de la suppression'),
      },
    )
  }

  return {
    // Création
    showLivraisonSheet,
    setShowLivraisonSheet,
    livraisonDescription,
    setLivraisonDescription,
    livraisonFournisseur,
    setLivraisonFournisseur,
    livraisonError,
    setLivraisonError,
    handleOpenLivraisonSheet,
    handleCreateLivraison,
    createLivraisonPending: createLivraison.isPending,
    // Marquer prévu
    showDateSheet,
    setShowDateSheet,
    datePrevue,
    setDatePrevue,
    handleMarquerPrevu,
    handleConfirmDatePrevue,
    updateStatusPending: updateLivraisonStatus.isPending,
    // Confirmer livraison
    handleConfirmerLivraison,
    // Édition
    livraisonToEdit,
    showEditSheet,
    setShowEditSheet,
    editDescription,
    setEditDescription,
    editFournisseur,
    setEditFournisseur,
    editDatePrevue,
    setEditDatePrevue,
    editError,
    setEditError,
    handleEditLivraison,
    handleConfirmEdit,
    updateLivraisonPending: updateLivraison.isPending,
    // Suppression
    livraisonToDelete,
    deleteLinkedBesoins,
    showDeleteSheet,
    setShowDeleteSheet,
    handleDeleteLivraison,
    handleConfirmDelete,
    deleteLivraisonPending: deleteLivraison.isPending,
  }
}
