import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useCreateLivraison, type LivraisonLine } from '@/lib/mutations/useCreateLivraison'
import { useUpdateLivraisonStatus } from '@/lib/mutations/useUpdateLivraisonStatus'
import { useUpdateLivraison, type BesoinMontantUpdate } from '@/lib/mutations/useUpdateLivraison'
import { useDeleteLivraison } from '@/lib/mutations/useDeleteLivraison'
import { useUploadLivraisonDocument } from '@/lib/mutations/useUploadLivraisonDocument'
import type { Livraison } from '@/types/database'
import type { LinkedBesoinWithChantier } from '@/lib/queries/useAllLinkedBesoins'

export function useLivraisonActions(chantierId = '') {
  const createLivraison = useCreateLivraison()
  const updateLivraisonStatus = useUpdateLivraisonStatus()
  const updateLivraison = useUpdateLivraison()
  const deleteLivraison = useDeleteLivraison()
  const uploadDocument = useUploadLivraisonDocument()

  // Création multi-lignes
  const [showLivraisonSheet, setShowLivraisonSheet] = useState(false)
  const [livraisonDescription, setLivraisonDescription] = useState('')
  const [livraisonFournisseur, setLivraisonFournisseur] = useState('')
  const [livraisonMontant, setLivraisonMontant] = useState('')
  const [livraisonBcFile, setLivraisonBcFile] = useState<File | null>(null)
  const [livraisonError, setLivraisonError] = useState('')

  // Multi-line livraison creation
  interface LivraisonLineState {
    description: string
    quantite: number
    montantUnitaire: string
    chantierId: string
  }
  const emptyLivraisonLine = (): LivraisonLineState => ({
    description: '',
    quantite: 1,
    montantUnitaire: '',
    chantierId: chantierId,
  })
  const [livraisonLines, setLivraisonLines] = useState<LivraisonLineState[]>([emptyLivraisonLine()])
  const [livraisonChantierUnique, setLivraisonChantierUnique] = useState(true)
  const [livraisonGlobalChantierId, setLivraisonGlobalChantierId] = useState(chantierId)

  const livraisonTotal = useMemo(() => {
    return livraisonLines.reduce((sum, l) => {
      const pu = parseFloat(l.montantUnitaire)
      if (isNaN(pu)) return sum
      return sum + l.quantite * pu
    }, 0)
  }, [livraisonLines])

  // Marquer prévu
  const [showDateSheet, setShowDateSheet] = useState(false)
  const [datePrevue, setDatePrevue] = useState('')
  const [livraisonToUpdate, setLivraisonToUpdate] = useState<string | null>(null)

  // Suppression
  const [livraisonToDelete, setLivraisonToDelete] = useState<Livraison | null>(null)
  const [deleteLinkedBesoins, setDeleteLinkedBesoins] = useState<LinkedBesoinWithChantier[]>([])
  const [showDeleteSheet, setShowDeleteSheet] = useState(false)

  // Passer en commande (montant)
  const [commandeMontant, setCommandeMontant] = useState('')

  // Édition
  const [livraisonToEdit, setLivraisonToEdit] = useState<Livraison | null>(null)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [editDescription, setEditDescription] = useState('')
  const [editFournisseur, setEditFournisseur] = useState('')
  const [editDatePrevue, setEditDatePrevue] = useState('')
  const [editMontantTtc, setEditMontantTtc] = useState('')
  const [editError, setEditError] = useState('')
  const [editLinkedBesoins, setEditLinkedBesoins] = useState<LinkedBesoinWithChantier[]>([])
  const [editBesoinMontants, setEditBesoinMontants] = useState<Record<string, string>>({})

  function handleOpenLivraisonSheet() {
    setLivraisonDescription('')
    setLivraisonFournisseur('')
    setLivraisonMontant('')
    setLivraisonBcFile(null)
    setLivraisonError('')
    setLivraisonLines([emptyLivraisonLine()])
    setLivraisonChantierUnique(!!chantierId)
    setLivraisonGlobalChantierId(chantierId)
    setShowLivraisonSheet(true)
  }

  function handleCreateLivraison() {
    // Multi-line creation
    const filledLines = livraisonLines.filter((l) => l.description.trim())
    if (filledLines.length === 0) {
      setLivraisonError('Au moins une ligne est requise')
      return
    }

    // Validate all lines have montant unitaire
    const missingMontant = filledLines.some((l) => {
      const pu = parseFloat(l.montantUnitaire)
      return isNaN(pu) || pu < 0
    })
    if (missingMontant) {
      setLivraisonError('Montant unitaire requis pour chaque ligne')
      return
    }

    // Validate chantier
    const missingChantier = filledLines.some((l) => {
      const cid = livraisonChantierUnique ? livraisonGlobalChantierId : l.chantierId
      return !cid
    })
    if (missingChantier) {
      setLivraisonError('Sélectionnez un chantier pour chaque ligne')
      return
    }

    const lines: LivraisonLine[] = filledLines.map((l) => ({
      description: l.description.trim(),
      quantite: l.quantite,
      montant_unitaire: parseFloat(l.montantUnitaire),
      chantier_id: livraisonChantierUnique ? livraisonGlobalChantierId : l.chantierId,
    }))

    const desc = livraisonDescription.trim() || lines.map((l) => l.description).join(', ')

    const pendingBcFile = livraisonBcFile
    createLivraison.mutate(
      { chantierId, description: desc, fournisseur: livraisonFournisseur.trim() || undefined, lines },
      {
        onSuccess: (data) => {
          setShowLivraisonSheet(false)
          toast('Livraison créée')
          if (pendingBcFile && data?.id) {
            uploadDocument.mutate({
              livraisonId: data.id,
              chantierId,
              file: pendingBcFile,
              documentType: 'bc',
            })
          }
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
    setCommandeMontant('')
    setShowDateSheet(true)
  }

  function handleConfirmDatePrevue() {
    if (!livraisonToUpdate || !datePrevue) return
    const parsedMontant = parseFloat(commandeMontant)
    const montantTtc = !isNaN(parsedMontant) && parsedMontant > 0 ? parsedMontant : null
    updateLivraisonStatus.mutate(
      { livraisonId: livraisonToUpdate, chantierId, newStatus: 'prevu', datePrevue, montantTtc },
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

  function handleEditLivraison(livraison: Livraison, linkedBesoins?: LinkedBesoinWithChantier[]) {
    setLivraisonToEdit(livraison)
    setEditDescription(livraison.description)
    setEditFournisseur(livraison.fournisseur ?? '')
    setEditDatePrevue(livraison.date_prevue ?? '')
    setEditMontantTtc(livraison.montant_ttc?.toString() ?? '')
    setEditError('')
    setEditLinkedBesoins(linkedBesoins ?? [])
    const montants: Record<string, string> = {}
    if (linkedBesoins) {
      for (const b of linkedBesoins) {
        montants[b.id] = b.montant_unitaire?.toString() ?? ''
      }
    }
    setEditBesoinMontants(montants)
    setShowEditSheet(true)
  }

  function handleConfirmEdit() {
    const trimmed = editDescription.trim()
    if (!trimmed) {
      setEditError('La description est requise')
      return
    }
    if (!livraisonToEdit) return

    // Build besoin montant updates if we have linked besoins
    let besoinMontants: BesoinMontantUpdate[] | undefined
    if (editLinkedBesoins.length > 0) {
      besoinMontants = editLinkedBesoins.map((b) => ({
        besoinId: b.id,
        montantUnitaire: parseFloat(editBesoinMontants[b.id] ?? '0') || 0,
        quantite: b.quantite ?? 1,
      }))
    }

    const parsedMontant = parseFloat(editMontantTtc)
    updateLivraison.mutate(
      {
        id: livraisonToEdit.id,
        chantierId,
        description: trimmed,
        fournisseur: editFournisseur.trim() || null,
        datePrevue: editDatePrevue || null,
        montantTtc: !isNaN(parsedMontant) && parsedMontant > 0 ? parsedMontant : null,
        besoinMontants,
      },
      {
        onSuccess: () => {
          setShowEditSheet(false)
          setLivraisonToEdit(null)
          setEditLinkedBesoins([])
          setEditBesoinMontants({})
          toast('Livraison modifiée')
        },
        onError: () => toast.error('Erreur lors de la modification'),
      },
    )
  }

  function handleDeleteLivraison(livraison: Livraison, linkedBesoins: LinkedBesoinWithChantier[]) {
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
    livraisonMontant,
    setLivraisonMontant,
    livraisonBcFile,
    setLivraisonBcFile,
    livraisonError,
    setLivraisonError,
    livraisonLines,
    setLivraisonLines,
    livraisonChantierUnique,
    setLivraisonChantierUnique,
    livraisonGlobalChantierId,
    setLivraisonGlobalChantierId,
    livraisonTotal,
    handleOpenLivraisonSheet,
    handleCreateLivraison,
    createLivraisonPending: createLivraison.isPending,
    // Marquer prévu
    showDateSheet,
    setShowDateSheet,
    datePrevue,
    setDatePrevue,
    commandeMontant,
    setCommandeMontant,
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
    editMontantTtc,
    setEditMontantTtc,
    editError,
    setEditError,
    editLinkedBesoins,
    editBesoinMontants,
    setEditBesoinMontants,
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
