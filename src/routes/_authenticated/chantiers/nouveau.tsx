import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Building2, Package, Check, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateChantier } from '@/lib/mutations/useCreateChantier'

export const Route = createFileRoute('/_authenticated/chantiers/nouveau')({
  component: NouveauChantierPage,
})

function NouveauChantierPage() {
  const navigate = useNavigate()
  const createChantier = useCreateChantier()

  const [nom, setNom] = useState('')
  const [type, setType] = useState<'complet' | 'leger' | null>(null)
  const [errors, setErrors] = useState<{ nom?: string; type?: string }>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const newErrors: { nom?: string; type?: string } = {}
    if (!nom.trim()) {
      newErrors.nom = 'Ce champ est requis'
    }
    if (!type) {
      newErrors.type = 'Choisissez un type de chantier'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    createChantier.mutate(
      { nom: nom.trim(), type: type! },
      {
        onSuccess: () => {
          toast.success('Chantier créé')
          navigate({ to: '/' })
        },
        onError: () => {
          toast.error('Impossible de créer le chantier')
        },
      },
    )
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px-env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: '/' })}
          aria-label="Retour"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Nouveau chantier</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col p-4 gap-6">
        <div className="space-y-2">
          <Label htmlFor="nom">Nom du chantier</Label>
          <Input
            id="nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="ex: Résidence Les Oliviers"
            aria-describedby={errors.nom ? 'nom-error' : undefined}
            aria-invalid={!!errors.nom}
          />
          {errors.nom && (
            <p id="nom-error" className="text-sm text-destructive">
              {errors.nom}
            </p>
          )}
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Type de chantier</legend>

          <div role="radiogroup" aria-label="Type de chantier" aria-describedby={errors.type ? 'type-error' : undefined} className="grid gap-3">
            <button
              type="button"
              role="radio"
              aria-checked={type === 'complet'}
              onClick={() => setType('complet')}
              className={`relative flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors min-h-[72px] ${
                type === 'complet'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              }`}
            >
              <Building2 className="size-5 mt-0.5 shrink-0 text-foreground" aria-hidden="true" />
              <div className="flex-1">
                <span className="font-medium text-foreground">Complet</span>
                <p className="text-sm text-muted-foreground">
                  Lots, plots, tâches, documents, inventaire
                </p>
              </div>
              {type === 'complet' && (
                <Check className="size-5 text-primary shrink-0" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={type === 'leger'}
              onClick={() => setType('leger')}
              className={`relative flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors min-h-[72px] ${
                type === 'leger'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              }`}
            >
              <Package className="size-5 mt-0.5 shrink-0 text-foreground" aria-hidden="true" />
              <div className="flex-1">
                <span className="font-medium text-foreground">Léger</span>
                <p className="text-sm text-muted-foreground">
                  Besoins et livraisons uniquement
                </p>
              </div>
              {type === 'leger' && (
                <Check className="size-5 text-primary shrink-0" aria-hidden="true" />
              )}
            </button>
          </div>

          {errors.type && (
            <p id="type-error" className="text-sm text-destructive">{errors.type}</p>
          )}

          <p className="text-xs text-muted-foreground">
            Ce choix est définitif et ne pourra pas être modifié
          </p>
        </fieldset>

        <div className="mt-auto pb-4">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={createChantier.isPending}
          >
            {createChantier.isPending ? 'Création en cours…' : 'Créer le chantier'}
          </Button>
        </div>
      </form>
    </div>
  )
}
