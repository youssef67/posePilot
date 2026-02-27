import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { useLotBadges } from '@/lib/queries/useLotBadges'
import { useAssignBadge } from '@/lib/mutations/useAssignBadge'
import { useCreateAndAssignBadge } from '@/lib/mutations/useCreateAndAssignBadge'
import { useUnassignBadge } from '@/lib/mutations/useUnassignBadge'
import type { BadgeAssignment } from '@/lib/queries/useLotBadgeAssignments'
import type { LotBadge } from '@/types/database'

const BADGE_COLORS: Record<string, string> = {
  amber: 'border-amber-500 text-amber-500',
  blue: 'border-blue-500 text-blue-500',
  green: 'border-green-500 text-green-500',
  red: 'border-red-500 text-red-500',
  purple: 'border-purple-500 text-purple-500',
  pink: 'border-pink-500 text-pink-500',
}

const COLOR_DOT_CLASSES: Record<string, string> = {
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
}

// eslint-disable-next-line react-refresh/only-export-components
export function getBadgeColorClasses(couleur: string) {
  return BADGE_COLORS[couleur] ?? BADGE_COLORS.amber
}

interface BadgeSelectorProps {
  lotId: string
  chantierId: string
  plotId: string
  assignedBadges: BadgeAssignment[]
}

export function BadgeSelector({ lotId, chantierId, plotId, assignedBadges }: BadgeSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [newBadgeColor, setNewBadgeColor] = useState('amber')

  const { data: allBadges = [] } = useLotBadges(chantierId)
  const assignBadge = useAssignBadge()
  const createAndAssign = useCreateAndAssignBadge()
  const unassignBadge = useUnassignBadge()

  const assignedIds = new Set(assignedBadges.map((a) => a.badge_id))
  const availableBadges = allBadges.filter((b) => !assignedIds.has(b.id))

  const trimmedSearch = search.trim()
  const exactMatch = allBadges.some((b) => b.nom.toLowerCase() === trimmedSearch.toLowerCase())
  const showCreate = trimmedSearch.length > 0 && !exactMatch

  function handleAssign(badge: LotBadge) {
    assignBadge.mutate({ lotId, badge, plotId })
    setOpen(false)
    setSearch('')
  }

  function handleCreate() {
    createAndAssign.mutate({ chantierId, nom: trimmedSearch, couleur: newBadgeColor, lotId, plotId })
    setOpen(false)
    setSearch('')
    setNewBadgeColor('amber')
  }

  function handleUnassign(badgeId: string) {
    unassignBadge.mutate({ lotId, badgeId, plotId })
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {assignedBadges.map((assignment) => (
        <Badge
          key={assignment.badge_id}
          variant="outline"
          className={`${getBadgeColorClasses(assignment.lot_badges.couleur)} text-[10px] gap-1 pr-1`}
        >
          {assignment.lot_badges.nom}
          <button
            type="button"
            onClick={() => handleUnassign(assignment.badge_id)}
            className="ml-0.5 rounded-full hover:bg-muted p-0.5"
            aria-label={`Retirer ${assignment.lot_badges.nom}`}
          >
            <X className="size-2.5" />
          </button>
        </Badge>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[10px] text-muted-foreground"
          >
            <Plus className="size-3 mr-0.5" />
            Badge
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
              {availableBadges.filter((b) =>
                trimmedSearch.length === 0 || b.nom.toLowerCase().includes(trimmedSearch.toLowerCase()),
              ).length === 0 && !showCreate && (
                <CommandEmpty>Aucun badge disponible</CommandEmpty>
              )}

              {availableBadges
                .filter((b) =>
                  trimmedSearch.length === 0 || b.nom.toLowerCase().includes(trimmedSearch.toLowerCase()),
                )
                .map((badge) => (
                  <CommandItem
                    key={badge.id}
                    onSelect={() => handleAssign(badge)}
                    className="flex items-center gap-2"
                  >
                    <span className={`size-2.5 rounded-full ${COLOR_DOT_CLASSES[badge.couleur] ?? COLOR_DOT_CLASSES.amber}`} />
                    {badge.nom}
                  </CommandItem>
                ))}

              {showCreate && (
                <CommandGroup heading="Créer">
                  <div className="px-2 py-1.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Plus className="size-3.5 text-muted-foreground" />
                      <span className="text-sm">Créer « {trimmedSearch} »</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      {Object.entries(COLOR_DOT_CLASSES).map(([color, dotClass]) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewBadgeColor(color)}
                          className={`size-5 rounded-full ${dotClass} ${newBadgeColor === color ? 'ring-2 ring-offset-1 ring-foreground' : ''}`}
                          aria-label={color}
                        />
                      ))}
                    </div>
                    <Button size="sm" className="w-full h-7 text-xs" onClick={handleCreate}>
                      Créer et ajouter
                    </Button>
                  </div>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
