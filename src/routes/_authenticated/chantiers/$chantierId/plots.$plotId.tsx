import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/chantiers/$chantierId/plots/$plotId',
)({
  staticData: { breadcrumb: 'Plot' },
  component: PlotLayout,
})

function PlotLayout() {
  return <Outlet />
}
