import { useState } from 'react'
import { Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { useIntervenants } from '@/lib/queries/useIntervenants'
import { useCreateIntervenant } from '@/lib/mutations/useCreateIntervenant'
import { useDeleteIntervenant } from '@/lib/mutations/useDeleteIntervenant'
import { useUpdateLotIntervenant } from '@/lib/mutations/useUpdateLotIntervenant'
import type { Intervenant } from '@/types/database'

interface IntervenantComboboxProps {
  lotId: string
  plotId: string
  currentIntervenantId: string | null
}

export function IntervenantCombobox({ lotId, plotId, currentIntervenantId }: IntervenantComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: intervenants = [] } = useIntervenants()
  const createIntervenant = useCreateIntervenant()
  const deleteIntervenant = useDeleteIntervenant()
  const updateLotIntervenant = useUpdateLotIntervenant()

  const current = intervenants.find((i) => i.id === currentIntervenantId) ?? null

  const trimmedSearch = search.trim()
  const filtered = intervenants.filter(
    (i) => trimmedSearch.length === 0 || i.nom.toLowerCase().includes(trimmedSearch.toLowerCase()),
  )
  const exactMatch = intervenants.some((i) => i.nom.toLowerCase() === trimmedSearch.toLowerCase())
  const showCreate = trimmedSearch.length > 0 && !exactMatch

  function handleSelect(intervenant: Intervenant) {
    updateLotIntervenant.mutate({ lotId, plotId, intervenantId: intervenant.id, intervenantNom: intervenant.nom })
    setOpen(false)
    setSearch('')
  }

  function handleClear() {
    updateLotIntervenant.mutate({ lotId, plotId, intervenantId: null, intervenantNom: null })
    setOpen(false)
    setSearch('')
  }

  async function handleCreate() {
    const created = await createIntervenant.mutateAsync(trimmedSearch)
    updateLotIntervenant.mutate({ lotId, plotId, intervenantId: created.id })
    setOpen(false)
    setSearch('')
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    deleteIntervenant.mutate(id)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between text-sm h-8 w-full"
        >
          <span className={current ? '' : 'text-muted-foreground'}>
            {current ? current.nom : 'Intervenant...'}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Rechercher..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filtered.length === 0 && !showCreate && (
              <CommandEmpty>Aucun intervenant</CommandEmpty>
            )}

            {current && (
              <CommandGroup>
                <CommandItem onSelect={handleClear} className="text-muted-foreground">
                  Aucun
                </CommandItem>
              </CommandGroup>
            )}

            <CommandGroup>
              {filtered.map((intervenant) => (
                <CommandItem
                  key={intervenant.id}
                  onSelect={() => handleSelect(intervenant)}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    {intervenant.id === currentIntervenantId && (
                      <Check className="size-3.5" />
                    )}
                    {intervenant.nom}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, intervenant.id)}
                    className="rounded p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    aria-label={`Supprimer ${intervenant.nom}`}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </CommandItem>
              ))}
            </CommandGroup>

            {showCreate && (
              <CommandGroup>
                <CommandItem onSelect={handleCreate} className="flex items-center gap-2">
                  <Plus className="size-3.5" />
                  Créer « {trimmedSearch} »
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
