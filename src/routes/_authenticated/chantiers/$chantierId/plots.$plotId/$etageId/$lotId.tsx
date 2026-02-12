import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/chantiers/$chantierId/plots/$plotId/$etageId/$lotId',
)({
  staticData: { breadcrumb: 'Lot' },
  component: LotLayout,
})

function LotLayout() {
  return <Outlet />
}
