import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Fab } from '@/components/Fab'
import { DepotArticleList } from '@/components/DepotArticleList'
import { useDepotArticles } from '@/lib/queries/useDepotArticles'
import type { DepotArticleWithCump } from '@/lib/queries/useDepotArticles'
import { useRealtimeDepotArticles } from '@/lib/subscriptions/useRealtimeDepotArticles'
import { useCreateDepotEntree } from '@/lib/mutations/useCreateDepotEntree'
import { useUpdateDepotArticleQuantite } from '@/lib/mutations/useUpdateDepotArticleQuantite'
import { useTransfertDepotVersChantier } from '@/lib/mutations/useTransfertDepotVersChantier'
import { useChantiers } from '@/lib/queries/useChantiers'

const formatEUR = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

export const Route = createFileRoute('/_authenticated/depot')({
  component: DepotPage,
})

function DepotPage() {
  const { data: articles, isLoading } = useDepotArticles()
  useRealtimeDepotArticles()
  const createEntree = useCreateDepotEntree()
  const updateQuantite = useUpdateDepotArticleQuantite()
  const transfert = useTransfertDepotVersChantier()
  const { data: chantiers } = useChantiers('active')

  const [showSheet, setShowSheet] = useState(false)
  const [designation, setDesignation] = useState('')
  const [quantite, setQuantite] = useState('1')
  const [prixUnitaire, setPrixUnitaire] = useState('')
  const [unite, setUnite] = useState('')
  const [errors, setErrors] = useState<{ designation?: string; quantite?: string; prixUnitaire?: string }>({})

  // Restock sheet state (when incrementing from quantity 0)
  const [restockArticleId, setRestockArticleId] = useState<string | null>(null)
  const [restockPrix, setRestockPrix] = useState('')
  const [restockError, setRestockError] = useState('')

  // Detail sheet state (store ID, derive article from query data for freshness)
  const [detailArticleId, setDetailArticleId] = useState<string | null>(null)

  // Transfer sheet state (store ID, derive article from query data for freshness)
  const [transferArticleId, setTransferArticleId] = useState<string | null>(null)
  const [transferQuantite, setTransferQuantite] = useState('1')
  const [transferChantierId, setTransferChantierId] = useState('')
  const [transferErrors, setTransferErrors] = useState<{ quantite?: string; chantier?: string }>({})

  // Derive articles from query data for fresh values (realtime-aware)
  const restockArticle = restockArticleId ? articles?.find((a) => a.id === restockArticleId) ?? null : null
  const detailArticle = detailArticleId ? articles?.find((a) => a.id === detailArticleId) ?? null : null
  const transferArticle = transferArticleId ? articles?.find((a) => a.id === transferArticleId) ?? null : null

  function handleOpenSheet() {
    setDesignation('')
    setQuantite('1')
    setPrixUnitaire('')
    setUnite('')
    setErrors({})
    setShowSheet(true)
  }

  function handleCreate() {
    const trimmedDesignation = designation.trim()
    const qty = parseInt(quantite, 10)
    const prix = parseFloat(prixUnitaire)
    const newErrors: { designation?: string; quantite?: string; prixUnitaire?: string } = {}

    if (!trimmedDesignation) {
      newErrors.designation = 'La désignation est requise'
    }
    if (!qty || qty <= 0) {
      newErrors.quantite = 'La quantité doit être supérieure à 0'
    }
    if (!prix || prix <= 0) {
      newErrors.prixUnitaire = 'Le prix unitaire doit être supérieur à 0'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Check if article with same designation already exists (case-insensitive trim)
    const existing = articles?.find(
      (a) => a.designation.trim().toLowerCase() === trimmedDesignation.toLowerCase(),
    )

    if (existing) {
      createEntree.mutate(
        {
          articleId: existing.id,
          quantite: qty,
          prixUnitaire: prix,
        },
        {
          onSuccess: () => {
            setShowSheet(false)
            toast('Stock mis à jour')
          },
          onError: () => toast.error("Erreur lors de la mise à jour du stock"),
        },
      )
    } else {
      createEntree.mutate(
        {
          designation: trimmedDesignation,
          quantite: qty,
          prixUnitaire: prix,
          unite: unite.trim() || undefined,
        },
        {
          onSuccess: () => {
            setShowSheet(false)
            toast('Article ajouté au dépôt')
          },
          onError: () => toast.error("Erreur lors de l'ajout de l'article"),
        },
      )
    }
  }

  function handleIncrement(article: DepotArticleWithCump) {
    if (article.quantite <= 0) {
      setRestockPrix('')
      setRestockError('')
      setRestockArticleId(article.id)
      return
    }
    updateQuantite.mutate({ articleId: article.id, delta: 1 })
  }

  function handleRestock() {
    if (!restockArticle) return
    const prix = parseFloat(restockPrix)
    if (!prix || prix <= 0) {
      setRestockError('Le prix unitaire doit être supérieur à 0')
      return
    }
    createEntree.mutate(
      { articleId: restockArticle.id, quantite: 1, prixUnitaire: prix },
      {
        onSuccess: () => {
          setRestockArticleId(null)
          toast('Stock mis à jour')
        },
        onError: () => toast.error('Erreur lors du réapprovisionnement'),
      },
    )
  }

  function handleDecrement(article: DepotArticleWithCump) {
    updateQuantite.mutate({ articleId: article.id, delta: -1 })
  }

  function handleArticleClick(article: DepotArticleWithCump) {
    setDetailArticleId(article.id)
  }

  function handleOpenTransfer() {
    if (!detailArticleId) return
    setTransferQuantite('1')
    setTransferChantierId('')
    setTransferErrors({})
    setTransferArticleId(detailArticleId)
    setDetailArticleId(null)
  }

  function handleTransfer() {
    if (!transferArticle) return
    const qty = parseInt(transferQuantite, 10)
    const newErrors: { quantite?: string; chantier?: string } = {}

    if (!qty || qty <= 0) {
      newErrors.quantite = 'La quantité doit être supérieure à 0'
    } else if (qty > transferArticle.quantite) {
      newErrors.quantite = `Quantité supérieure au stock disponible (max: ${transferArticle.quantite})`
    }
    if (!transferChantierId) {
      newErrors.chantier = 'Le chantier est requis'
    }

    if (Object.keys(newErrors).length > 0) {
      setTransferErrors(newErrors)
      return
    }

    transfert.mutate(
      { articleId: transferArticle.id, quantite: qty, chantierId: transferChantierId },
      {
        onSuccess: () => setTransferArticleId(null),
        onError: () => toast.error('Erreur lors du transfert'),
      },
    )
  }

  const transferMontant = transferArticle
    ? (parseInt(transferQuantite, 10) || 0) * (transferArticle.cump ?? 0)
    : 0

  const articleCount = articles?.length ?? 0

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px-env(safe-area-inset-bottom))]">
      <header className="px-4 py-3 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">Dépôt entreprise</h1>
      </header>

      <div className="flex-1 p-4">
        <h2 className="text-base font-semibold text-foreground mb-3">
          {articleCount > 0 ? `${articleCount} articles en stock` : 'Dépôt'}
        </h2>

        <DepotArticleList
          articles={articles}
          isLoading={isLoading}
          onOpenSheet={handleOpenSheet}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onArticleClick={handleArticleClick}
        />

        <Fab onClick={handleOpenSheet} />
      </div>

      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Nouvel article</SheetTitle>
            <SheetDescription>
              Ajoutez un article au dépôt.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 space-y-4">
            <div>
              <label htmlFor="depot-designation" className="text-sm font-medium text-foreground">
                Désignation
              </label>
              <Input
                id="depot-designation"
                placeholder="Ex: Sac de colle Mapei"
                value={designation}
                onChange={(e) => {
                  setDesignation(e.target.value)
                  if (errors.designation) setErrors((prev) => ({ ...prev, designation: undefined }))
                }}
                aria-invalid={!!errors.designation}
              />
              {errors.designation && (
                <p className="text-sm text-destructive mt-1">{errors.designation}</p>
              )}
            </div>
            <div>
              <label htmlFor="depot-quantite" className="text-sm font-medium text-foreground">
                Quantité
              </label>
              <Input
                id="depot-quantite"
                type="number"
                inputMode="numeric"
                min={1}
                value={quantite}

                onChange={(e) => {
                  setQuantite(e.target.value)
                  if (errors.quantite) setErrors((prev) => ({ ...prev, quantite: undefined }))
                }}
                aria-invalid={!!errors.quantite}
              />
              {errors.quantite && (
                <p className="text-sm text-destructive mt-1">{errors.quantite}</p>
              )}
            </div>
            <div>
              <label htmlFor="depot-prix" className="text-sm font-medium text-foreground">
                Prix unitaire
              </label>
              <Input
                id="depot-prix"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={prixUnitaire}

                onChange={(e) => {
                  setPrixUnitaire(e.target.value)
                  if (errors.prixUnitaire) setErrors((prev) => ({ ...prev, prixUnitaire: undefined }))
                }}
                aria-invalid={!!errors.prixUnitaire}
              />
              {errors.prixUnitaire && (
                <p className="text-sm text-destructive mt-1">{errors.prixUnitaire}</p>
              )}
            </div>
            <div>
              <label htmlFor="depot-unite" className="text-sm font-medium text-foreground">
                Unité (optionnel)
              </label>
              <Input
                id="depot-unite"
                placeholder="sac, m², kg..."
                value={unite}
                onChange={(e) => setUnite(e.target.value)}
              />
            </div>
          </div>
          <SheetFooter>
            <Button
              onClick={handleCreate}
              disabled={createEntree.isPending}
              className="w-full"
            >
              Ajouter l&apos;article
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Restock sheet (increment from 0) */}
      <Sheet open={!!restockArticle} onOpenChange={(open) => !open && setRestockArticleId(null)}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Réapprovisionner</SheetTitle>
            <SheetDescription>
              {restockArticle?.designation}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 space-y-4">
            <div>
              <label htmlFor="restock-prix" className="text-sm font-medium text-foreground">
                Prix unitaire
              </label>
              <Input
                id="restock-prix"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={restockPrix}

                onChange={(e) => {
                  setRestockPrix(e.target.value)
                  if (restockError) setRestockError('')
                }}
                aria-invalid={!!restockError}
              />
              {restockError && (
                <p className="text-sm text-destructive mt-1">{restockError}</p>
              )}
            </div>
          </div>
          <SheetFooter>
            <Button
              onClick={handleRestock}
              disabled={createEntree.isPending}
              className="w-full"
            >
              Ajouter 1 {restockArticle?.unite ?? 'unité'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Detail sheet */}
      <Sheet open={!!detailArticle} onOpenChange={(open) => !open && setDetailArticleId(null)}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Détail article</SheetTitle>
            <SheetDescription>
              {detailArticle?.designation}
            </SheetDescription>
          </SheetHeader>
          {detailArticle && (
            <div className="px-4 space-y-2">
              <p className="text-sm text-foreground">
                Quantité : {detailArticle.quantite} {detailArticle.unite ?? ''}
              </p>
              <p className="text-sm text-foreground">
                CUMP : {detailArticle.cump != null ? formatEUR.format(detailArticle.cump) : '—'}
              </p>
              <p className="text-sm text-foreground">
                Valeur totale : {formatEUR.format(detailArticle.valeur_totale)}
              </p>
            </div>
          )}
          <SheetFooter>
            <Button
              onClick={handleOpenTransfer}
              disabled={!detailArticle || detailArticle.quantite <= 0}
              className="w-full"
            >
              Transférer vers un chantier
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Transfer sheet */}
      <Sheet open={!!transferArticle} onOpenChange={(open) => !open && setTransferArticleId(null)}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Transférer vers un chantier</SheetTitle>
            <SheetDescription>
              {transferArticle?.designation}
            </SheetDescription>
          </SheetHeader>
          {transferArticle && (
            <div className="px-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Stock disponible : {transferArticle.quantite} {transferArticle.unite ?? ''}
              </p>
              <p className="text-sm text-muted-foreground">
                CUMP : {transferArticle.cump != null ? formatEUR.format(transferArticle.cump) : '—'}
              </p>
              <div>
                <label htmlFor="transfer-quantite" className="text-sm font-medium text-foreground">
                  Quantité
                </label>
                <Input
                  id="transfer-quantite"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={transferArticle.quantite}
                  value={transferQuantite}
  
                  onChange={(e) => {
                    setTransferQuantite(e.target.value)
                    if (transferErrors.quantite) setTransferErrors((prev) => ({ ...prev, quantite: undefined }))
                  }}
                  aria-invalid={!!transferErrors.quantite}
                />
                {transferErrors.quantite && (
                  <p className="text-sm text-destructive mt-1">{transferErrors.quantite}</p>
                )}
              </div>
              <div>
                <label htmlFor="transfer-chantier" className="text-sm font-medium text-foreground">
                  Chantier
                </label>
                <select
                  id="transfer-chantier"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={transferChantierId}
                  onChange={(e) => {
                    setTransferChantierId(e.target.value)
                    if (transferErrors.chantier) setTransferErrors((prev) => ({ ...prev, chantier: undefined }))
                  }}
                  aria-invalid={!!transferErrors.chantier}
                >
                  <option value="">Sélectionner un chantier</option>
                  {chantiers?.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
                {transferErrors.chantier && (
                  <p className="text-sm text-destructive mt-1">{transferErrors.chantier}</p>
                )}
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-sm font-medium text-foreground">
                  Montant : {formatEUR.format(transferMontant)}
                </p>
              </div>
            </div>
          )}
          <SheetFooter>
            <Button
              onClick={handleTransfer}
              disabled={transfert.isPending}
              className="w-full"
            >
              Transférer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
