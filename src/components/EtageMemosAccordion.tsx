import { Link } from '@tanstack/react-router'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { MemoCard } from '@/components/MemoCard'
import { usePlotEtageMemos } from '@/lib/queries/usePlotEtageMemos'
import type { MemoWithPhotos } from '@/lib/queries/useMemos'

interface EtageMemosAccordionProps {
  etages: { id: string; nom: string }[]
  plotId: string
  chantierId: string
}

export function EtageMemosAccordion({ etages, plotId, chantierId }: EtageMemosAccordionProps) {
  const etageIds = etages.map((e) => e.id)
  const { data: memos = [] } = usePlotEtageMemos(plotId, etageIds)

  const memosByEtage = memos.reduce<Record<string, MemoWithPhotos[]>>((acc, memo) => {
    const key = memo.etage_id
    if (!key) return acc
    if (!acc[key]) acc[key] = []
    acc[key].push(memo)
    return acc
  }, {})

  const etagesWithMemos = etages.filter((e) => memosByEtage[e.id]?.length)

  if (etagesWithMemos.length === 0) return null

  return (
    <div className="px-4 pt-3">
      <h2 className="text-base font-semibold text-foreground mb-3">Mémos</h2>
      <Accordion type="multiple">
        {etagesWithMemos.map((etage) => {
          const etageMemos = memosByEtage[etage.id]
          return (
            <AccordionItem key={etage.id} value={etage.id}>
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  {etage.nom}
                  <Badge variant="secondary">{etageMemos.length} mémo{etageMemos.length > 1 ? 's' : ''}</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {etageMemos.map((memo) => (
                    <Link
                      key={memo.id}
                      to="/chantiers/$chantierId/plots/$plotId/$etageId/memos"
                      params={{ chantierId, plotId, etageId: etage.id }}
                      className="block"
                    >
                      <MemoCard memo={memo} />
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
