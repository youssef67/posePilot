import type { ReactNode } from 'react'
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DragHandleProps = { attributes: Record<string, any>; listeners: Record<string, any> }

interface SortableTaskListProps<T> {
  items: T[]
  keyExtractor: (item: T) => string
  onReorder: (reorderedItems: T[]) => void
  renderItem: (item: T, dragHandleProps: DragHandleProps) => ReactNode
}

function SortableItem<T>({
  id,
  item,
  renderItem,
}: {
  id: string
  item: T
  renderItem: SortableTaskListProps<T>['renderItem']
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div ref={setNodeRef} style={style}>
      {renderItem(item, { attributes, listeners: listeners ?? {} })}
    </div>
  )
}

export function SortableTaskList<T>({
  items,
  keyExtractor,
  onReorder,
  renderItem,
}: SortableTaskListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex(
      (item) => keyExtractor(item) === active.id,
    )
    const newIndex = items.findIndex((item) => keyExtractor(item) === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    onReorder(reordered)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext
        items={items.map(keyExtractor)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item) => (
          <SortableItem
            key={keyExtractor(item)}
            id={keyExtractor(item)}
            item={item}
            renderItem={renderItem}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}
