import React from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ResumeSection, SectionType } from '@/types/resume'
import { SECTION_ICONS, SECTION_LABELS, ADDABLE_SECTIONS, TrashIcon } from './SectionRenderers'

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const clone = [...arr]; const [removed] = clone.splice(from, 1); clone.splice(to, 0, removed); return clone
}

interface SortableSectionItemProps {
  section: ResumeSection; deleteMode: boolean; isSelected: boolean
  onToggleSelect: (id: string) => void; onToggleVisibility: (sectionId: string) => void
}

const SortableSectionItem = ({ section, deleteMode, isSelected, onToggleSelect, onToggleVisibility }: SortableSectionItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-default transition-colors ${deleteMode && isSelected ? 'bg-red-50 ring-1 ring-red-200' : isDragging ? 'bg-gray-100 shadow-md' : 'hover:bg-gray-50'}`}>
      <button {...attributes} {...listeners} className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"><i className="ph-light ph-list text-sm"></i></button>
      {deleteMode && <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(section.id)} className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-400" />}
      <i className={`ph-light ${SECTION_ICONS[section.type]} text-base text-gray-500`}></i>
      <span className="flex-1 text-sm text-gray-700 truncate">{SECTION_LABELS[section.type]}</span>
      <button onClick={() => onToggleVisibility(section.id)} className={`p-1 rounded hover:bg-gray-200 ${section.isVisible ? 'text-gray-500' : 'text-gray-300'}`} title={section.isVisible ? '隐藏' : '显示'}>
        <i className={`ph-light text-base ${section.isVisible ? 'ph-eye' : 'ph-eye-slash'}`}></i>
      </button>
    </div>
  )
}

interface SidebarProps {
  width?: number; sortedSections: ResumeSection[]; deleteMode: boolean; selectedForDelete: string[]; showAddDropdown: boolean
  setDeleteMode: (v: boolean) => void; setSelectedForDelete: (v: string[] | ((prev: string[]) => string[])) => void
  setShowDeleteConfirm: (v: boolean) => void; setShowAddDropdown: (v: boolean) => void
  handleDragEnd: (event: DragEndEvent) => void
  toggleSelectForDelete: (id: string) => void; handleToggleVisibility: (sectionId: string) => void
  handleDeleteSelected: () => void; addSection: (type: SectionType) => void
}

export default function EditorSidebar(props: SidebarProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const { sortedSections, deleteMode, selectedForDelete, showAddDropdown, setDeleteMode, setSelectedForDelete,
    setShowAddDropdown, handleDragEnd, toggleSelectForDelete, handleToggleVisibility, handleDeleteSelected, addSection } = props

  return (
    <div className="border-r bg-white flex flex-col shrink-0" style={{ width: props.width || 200 }}>
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <h3 className="font-semibold text-gray-800 text-xs">版块</h3>
        <button onClick={() => { setDeleteMode(!deleteMode); setSelectedForDelete([]) }}
          className={`p-1 rounded-lg transition-colors ${deleteMode ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-100'}`} title={deleteMode ? '退出删除模式' : '删除版块'}>
          <TrashIcon size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-0.5">{sortedSections.map(section => (
              <SortableSectionItem key={section.id} section={section} deleteMode={deleteMode}
                isSelected={selectedForDelete.includes(section.id)} onToggleSelect={toggleSelectForDelete} onToggleVisibility={handleToggleVisibility} />
            ))}</div>
          </SortableContext>
        </DndContext>
      </div>
      <div className="p-2 border-t space-y-1.5">
        <div className="relative">
          <button onClick={() => setShowAddDropdown(!showAddDropdown)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-teal-400 hover:text-[#D4875E] transition-colors">
            <i className="ph-light ph-plus text-base"></i>添加版块
          </button>
          {showAddDropdown && (<><div className="fixed inset-0 z-10" onClick={() => setShowAddDropdown(false)} />
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border rounded-lg shadow-lg z-20 overflow-hidden">
              {ADDABLE_SECTIONS.map(s => (
                <button key={s.type} onClick={() => { addSection(s.type); setShowAddDropdown(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <i className={`ph-light ${SECTION_ICONS[s.type]} text-base text-gray-500`}></i>{s.label}
                </button>
              ))}
            </div></>)}
        </div>
        {deleteMode && (
          <button onClick={handleDeleteSelected} disabled={selectedForDelete.length === 0}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedForDelete.length > 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            <TrashIcon size={14} />删除选中 ({selectedForDelete.length})
          </button>
        )}
      </div>
    </div>
  )
}
