import { useState } from 'react'
import { Plus, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FabMenuItem {
  icon: LucideIcon
  label: string
  onClick: () => void
}

interface FabProps {
  onClick?: () => void
  className?: string
  icon?: React.ReactNode
  menuItems?: FabMenuItem[]
}

export function Fab({ onClick, className, icon, menuItems }: FabProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const hasMenu = menuItems && menuItems.length > 0

  function handleFabClick() {
    if (hasMenu) {
      setMenuOpen((prev) => !prev)
    } else {
      onClick?.()
    }
  }

  function handleItemClick(item: FabMenuItem) {
    setMenuOpen(false)
    item.onClick()
  }

  return (
    <>
      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
          data-testid="fab-overlay"
        />
      )}

      <div className={cn('fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3', className)}>
        {/* Menu items */}
        {menuOpen && menuItems?.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleItemClick(item)}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg transition-transform active:scale-95 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}

        {/* FAB button */}
        <button
          type="button"
          onClick={handleFabClick}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ajouter'}
        >
          {hasMenu ? (
            menuOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />
          ) : (
            icon ?? <Plus className="h-6 w-6" />
          )}
        </button>
      </div>
    </>
  )
}
