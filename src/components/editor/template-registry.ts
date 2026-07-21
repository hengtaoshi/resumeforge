import type { ComponentType } from 'react'
import type { Resume } from '@/lib/jadeai/templates/resume-types'

export interface RegisteredTemplate {
  id: string
  name: string
  description: string
  component: ComponentType<{ resume: Resume }>
}

const registry: RegisteredTemplate[] = []

export function registerTemplate(t: RegisteredTemplate): void {
  const idx = registry.findIndex((r) => r.id === t.id);
  if (idx >= 0) registry[idx] = t;
  else registry.push(t);
}

export function getRegisteredTemplates(): RegisteredTemplate[] {
  return [...registry]
}

export function getTemplate(id: string): RegisteredTemplate | undefined {
  return registry.find((t) => t.id === id)
}

export async function initTemplates(): Promise<void> {
  const results = await Promise.allSettled([
    import('@/lib/jadeai/templates/academic').then(m => m.AcademicTemplate),
    import('@/lib/jadeai/templates/architect').then(m => m.ArchitectTemplate),
    import('@/lib/jadeai/templates/artistic').then(m => m.ArtisticTemplate),
    import('@/lib/jadeai/templates/ats').then(m => m.AtsTemplate),
    import('@/lib/jadeai/templates/berlin').then(m => m.BerlinTemplate),
    import('@/lib/jadeai/templates/blocks').then(m => m.BlocksTemplate),
    import('@/lib/jadeai/templates/bold').then(m => m.BoldTemplate),
    import('@/lib/jadeai/templates/card').then(m => m.CardTemplate),
    import('@/lib/jadeai/templates/classic').then(m => m.ClassicTemplate),
    import('@/lib/jadeai/templates/clean').then(m => m.CleanTemplate),
    import('@/lib/jadeai/templates/coder').then(m => m.CoderTemplate),
    import('@/lib/jadeai/templates/compact').then(m => m.CompactTemplate),
    import('@/lib/jadeai/templates/consultant').then(m => m.ConsultantTemplate),
    import('@/lib/jadeai/templates/corporate').then(m => m.CorporateTemplate),
    import('@/lib/jadeai/templates/creative').then(m => m.CreativeTemplate),
    import('@/lib/jadeai/templates/designer').then(m => m.DesignerTemplate),
    import('@/lib/jadeai/templates/developer').then(m => m.DeveloperTemplate),
    import('@/lib/jadeai/templates/elegant').then(m => m.ElegantTemplate),
    import('@/lib/jadeai/templates/engineer').then(m => m.EngineerTemplate),
    import('@/lib/jadeai/templates/euro').then(m => m.EuroTemplate),
    import('@/lib/jadeai/templates/executive').then(m => m.ExecutiveTemplate),
    import('@/lib/jadeai/templates/finance').then(m => m.FinanceTemplate),
    import('@/lib/jadeai/templates/formal').then(m => m.FormalTemplate),
    import('@/lib/jadeai/templates/gradient').then(m => m.GradientTemplate),
    import('@/lib/jadeai/templates/infographic').then(m => m.InfographicTemplate),
    import('@/lib/jadeai/templates/japanese').then(m => m.JapaneseTemplate),
    import('@/lib/jadeai/templates/legal').then(m => m.LegalTemplate),
    import('@/lib/jadeai/templates/luxe').then(m => m.LuxeTemplate),
    import('@/lib/jadeai/templates/magazine').then(m => m.MagazineTemplate),
    import('@/lib/jadeai/templates/material').then(m => m.MaterialTemplate),
    import('@/lib/jadeai/templates/medical').then(m => m.MedicalTemplate),
    import('@/lib/jadeai/templates/metro').then(m => m.MetroTemplate),
    import('@/lib/jadeai/templates/minimal').then(m => m.MinimalTemplate),
    import('@/lib/jadeai/templates/modern').then(m => m.ModernTemplate),
    import('@/lib/jadeai/templates/mosaic').then(m => m.MosaicTemplate),
    import('@/lib/jadeai/templates/neon').then(m => m.NeonTemplate),
    import('@/lib/jadeai/templates/nordic').then(m => m.NordicTemplate),
    import('@/lib/jadeai/templates/professional').then(m => m.ProfessionalTemplate),
    import('@/lib/jadeai/templates/retro').then(m => m.RetroTemplate),
    import('@/lib/jadeai/templates/ribbon').then(m => m.RibbonTemplate),
    import('@/lib/jadeai/templates/rose').then(m => m.RoseTemplate),
    import('@/lib/jadeai/templates/scientist').then(m => m.ScientistTemplate),
    import('@/lib/jadeai/templates/sidebar').then(m => m.SidebarTemplate),
    import('@/lib/jadeai/templates/startup').then(m => m.StartupTemplate),
    import('@/lib/jadeai/templates/swiss').then(m => m.SwissTemplate),
    import('@/lib/jadeai/templates/teacher').then(m => m.TeacherTemplate),
    import('@/lib/jadeai/templates/timeline').then(m => m.TimelineTemplate),
    import('@/lib/jadeai/templates/two-column').then(m => m.TwoColumnTemplate),
    import('@/lib/jadeai/templates/watercolor').then(m => m.WatercolorTemplate),
    import('@/lib/jadeai/templates/zigzag').then(m => m.ZigzagTemplate),
  ])

  const defs = [
    { id: 'academic', name: '学术', description: '学术风格，适合科研教育' },
    { id: 'architect', name: '建筑师', description: '建筑师风格，结构感强' },
    { id: 'artistic', name: '艺术', description: '艺术风格，创意设计' },
    { id: 'ats', name: 'ATS优化', description: 'ATS优化排版，提高通过率' },
    { id: 'berlin', name: '柏林', description: '柏林风格，前卫大胆' },
    { id: 'blocks', name: '积木', description: '积木风格，清晰模块化' },
    { id: 'bold', name: '大胆', description: '大胆醒目，视觉冲击力强' },
    { id: 'card', name: '卡片', description: '卡片设计，模块清晰' },
    { id: 'classic', name: '经典', description: '经典简洁布局，适合各类职业' },
    { id: 'clean', name: '简洁', description: '干净整洁，清晰易读' },
    { id: 'coder', name: '程序员', description: '程序员风格，代码元素' },
    { id: 'compact', name: '紧凑', description: '紧凑排版，信息密度高' },
    { id: 'consultant', name: '咨询', description: '咨询风格，逻辑清晰' },
    { id: 'corporate', name: '企业', description: '企业风格，规范专业' },
    { id: 'creative', name: '创意', description: '创意不规则布局，展现个性' },
    { id: 'designer', name: '设计师', description: '设计师风格，创意视觉' },
    { id: 'developer', name: '开发者', description: '开发者风格，技术感十足' },
    { id: 'elegant', name: '优雅', description: '优雅精致排版，气质出众' },
    { id: 'engineer', name: '工程师', description: '工程师风格，技术扎实' },
    { id: 'euro', name: '欧式', description: '欧式简洁，干净利落' },
    { id: 'executive', name: '高管', description: '高管风范，彰显领导力' },
    { id: 'finance', name: '金融', description: '金融风格，严谨稳重' },
    { id: 'formal', name: '正式', description: '正式庄重，适合传统行业' },
    { id: 'gradient', name: '渐变', description: '渐变色彩，现代动感' },
    { id: 'infographic', name: '信息图', description: '信息图风格，数据可视化' },
    { id: 'japanese', name: '和风', description: '和风设计，东方美学' },
    { id: 'legal', name: '法律', description: '法律风格，严谨规范' },
    { id: 'luxe', name: '奢华', description: '奢华风格，高端大气' },
    { id: 'magazine', name: '杂志', description: '杂志风格，视觉丰富' },
    { id: 'material', name: 'Material', description: 'Material Design，层次分明' },
    { id: 'medical', name: '医疗', description: '医疗风格，亲和专业' },
    { id: 'metro', name: 'Metro', description: 'Metro风格，磁贴设计' },
    { id: 'minimal', name: '极简', description: '极简留白设计，突出内容' },
    { id: 'modern', name: '现代', description: '现代渐变风格，色彩鲜明' },
    { id: 'mosaic', name: '马赛克', description: '马赛克风格，创意拼接' },
    { id: 'neon', name: '霓虹', description: '霓虹风格，炫酷科技' },
    { id: 'nordic', name: '北欧', description: '北欧极简，清新自然' },
    { id: 'professional', name: '专业', description: '专业稳重布局，商务首选' },
    { id: 'retro', name: '复古', description: '复古风格，怀旧经典' },
    { id: 'ribbon', name: '绶带', description: '绶带装饰，独特个性' },
    { id: 'rose', name: '玫瑰', description: '玫瑰风格，优雅浪漫' },
    { id: 'scientist', name: '科学家', description: '科学家风格，学术严谨' },
    { id: 'sidebar', name: '侧边栏', description: '侧边栏布局，信息分区' },
    { id: 'startup', name: '创业', description: '创业公司风格，充满活力' },
    { id: 'swiss', name: '瑞士', description: '瑞士风格，极简排版' },
    { id: 'teacher', name: '教师', description: '教师风格，亲切温和' },
    { id: 'timeline', name: '时间线', description: '时间线布局，突出职业轨迹' },
    { id: 'two-column', name: '双栏', description: '双栏分区设计，信息层次分明' },
    { id: 'watercolor', name: '水彩', description: '水彩风格，柔和雅致' },
    { id: 'zigzag', name: '锯齿', description: '锯齿布局，动感活泼' },
  ]

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') registerTemplate({ ...defs[i], component: r.value })
  })
}
