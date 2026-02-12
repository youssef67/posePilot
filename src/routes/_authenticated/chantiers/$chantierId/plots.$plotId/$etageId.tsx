import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/chantiers/$chantierId/plots/$plotId/$etageId',
)({
  staticData: { breadcrumb: 'Étage' },
  component: EtageLayout,
})

function EtageLayout() {
  return <Outlet />
}
