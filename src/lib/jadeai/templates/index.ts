// Auto-generated template index
import type { ComponentType } from 'react';
import type { Resume } from './resume-types';

import { AcademicTemplate } from './academic'
import { ArchitectTemplate } from './architect'
import { ArtisticTemplate } from './artistic'
import { AtsTemplate } from './ats'
import { BerlinTemplate } from './berlin'
import { BlocksTemplate } from './blocks'
import { BoldTemplate } from './bold'
import { CardTemplate } from './card'
import { ClassicTemplate } from './classic'
import { CleanTemplate } from './clean'
import { CoderTemplate } from './coder'
import { CompactTemplate } from './compact'
import { ConsultantTemplate } from './consultant'
import { CorporateTemplate } from './corporate'
import { CreativeTemplate } from './creative'
import { DesignerTemplate } from './designer'
import { DeveloperTemplate } from './developer'
import { ElegantTemplate } from './elegant'
import { EngineerTemplate } from './engineer'
import { EuroTemplate } from './euro'
import { ExecutiveTemplate } from './executive'
import { FinanceTemplate } from './finance'
import { FormalTemplate } from './formal'
import { GradientTemplate } from './gradient'
import { InfographicTemplate } from './infographic'
import { JapaneseTemplate } from './japanese'
import { LegalTemplate } from './legal'
import { LuxeTemplate } from './luxe'
import { MagazineTemplate } from './magazine'
import { MaterialTemplate } from './material'
import { MedicalTemplate } from './medical'
import { MetroTemplate } from './metro'
import { MinimalTemplate } from './minimal'
import { ModernTemplate } from './modern'
import { MosaicTemplate } from './mosaic'
import { NeonTemplate } from './neon'
import { NordicTemplate } from './nordic'
import { ProfessionalTemplate } from './professional'
import { RetroTemplate } from './retro'
import { RibbonTemplate } from './ribbon'
import { RoseTemplate } from './rose'
import { ScientistTemplate } from './scientist'
import { SidebarTemplate } from './sidebar'
import { StartupTemplate } from './startup'
import { SwissTemplate } from './swiss'
import { TeacherTemplate } from './teacher'
import { TimelineTemplate } from './timeline'
import { TwoColumnTemplate } from './two-column'
import { WatercolorTemplate } from './watercolor'
import { ZigzagTemplate } from './zigzag'

export {
  AcademicTemplate,
  ArchitectTemplate,
  ArtisticTemplate,
  AtsTemplate,
  BerlinTemplate,
  BlocksTemplate,
  BoldTemplate,
  CardTemplate,
  ClassicTemplate,
  CleanTemplate,
  CoderTemplate,
  CompactTemplate,
  ConsultantTemplate,
  CorporateTemplate,
  CreativeTemplate,
  DesignerTemplate,
  DeveloperTemplate,
  ElegantTemplate,
  EngineerTemplate,
  EuroTemplate,
  ExecutiveTemplate,
  FinanceTemplate,
  FormalTemplate,
  GradientTemplate,
  InfographicTemplate,
  JapaneseTemplate,
  LegalTemplate,
  LuxeTemplate,
  MagazineTemplate,
  MaterialTemplate,
  MedicalTemplate,
  MetroTemplate,
  MinimalTemplate,
  ModernTemplate,
  MosaicTemplate,
  NeonTemplate,
  NordicTemplate,
  ProfessionalTemplate,
  RetroTemplate,
  RibbonTemplate,
  RoseTemplate,
  ScientistTemplate,
  SidebarTemplate,
  StartupTemplate,
  SwissTemplate,
  TeacherTemplate,
  TimelineTemplate,
  TwoColumnTemplate,
  WatercolorTemplate,
  ZigzagTemplate,
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  component: ComponentType<{ resume: Resume }>;
}

export const TEMPLATES: Record<string, TemplateDefinition> = {
  'academic': { id: 'academic', name: '学术', description: '学术风格，适合科研教育', color: '#92400e', component: AcademicTemplate },
  'architect': { id: 'architect', name: '建筑师', description: '建筑师风格，结构感强', color: '#a16207', component: ArchitectTemplate },
  'artistic': { id: 'artistic', name: '艺术', description: '艺术风格，创意设计', color: '#6d28d9', component: ArtisticTemplate },
  'ats': { id: 'ats', name: 'ATS优化', description: 'ATS优化排版，提高通过率', color: '#059669', component: AtsTemplate },
  'berlin': { id: 'berlin', name: '柏林', description: '柏林风格，前卫大胆', color: '#f59e0b', component: BerlinTemplate },
  'blocks': { id: 'blocks', name: '积木', description: '积木风格，清晰模块化', color: '#37352f', component: BlocksTemplate },
  'bold': { id: 'bold', name: '大胆', description: '大胆醒目，视觉冲击力强', color: '#dc2626', component: BoldTemplate },
  'card': { id: 'card', name: '卡片', description: '卡片设计，模块清晰', color: '#0f172a', component: CardTemplate },
  'classic': { id: 'classic', name: '经典', description: '经典简洁布局，适合各类职业', color: '#1a1a2e', component: ClassicTemplate },
  'clean': { id: 'clean', name: '简洁', description: '干净整洁，清晰易读', color: '#0f172a', component: CleanTemplate },
  'coder': { id: 'coder', name: '程序员', description: '程序员风格，代码元素', color: '#18181b', component: CoderTemplate },
  'compact': { id: 'compact', name: '紧凑', description: '紧凑排版，信息密度高', color: '#4b5563', component: CompactTemplate },
  'consultant': { id: 'consultant', name: '咨询', description: '咨询风格，逻辑清晰', color: '#1e293b', component: ConsultantTemplate },
  'corporate': { id: 'corporate', name: '企业', description: '企业风格，规范专业', color: '#1e3a8a', component: CorporateTemplate },
  'creative': { id: 'creative', name: '创意', description: '创意不规则布局，展现个性', color: '#7c3aed', component: CreativeTemplate },
  'designer': { id: 'designer', name: '设计师', description: '设计师风格，创意视觉', color: '#db2777', component: DesignerTemplate },
  'developer': { id: 'developer', name: '开发者', description: '开发者风格，技术感十足', color: '#2563eb', component: DeveloperTemplate },
  'elegant': { id: 'elegant', name: '优雅', description: '优雅精致排版，气质出众', color: '#475569', component: ElegantTemplate },
  'engineer': { id: 'engineer', name: '工程师', description: '工程师风格，技术扎实', color: '#0369a1', component: EngineerTemplate },
  'euro': { id: 'euro', name: '欧式', description: '欧式简洁，干净利落', color: '#0369a1', component: EuroTemplate },
  'executive': { id: 'executive', name: '高管', description: '高管风范，彰显领导力', color: '#1e293b', component: ExecutiveTemplate },
  'finance': { id: 'finance', name: '金融', description: '金融风格，严谨稳重', color: '#065f46', component: FinanceTemplate },
  'formal': { id: 'formal', name: '正式', description: '正式庄重，适合传统行业', color: '#334155', component: FormalTemplate },
  'gradient': { id: 'gradient', name: '渐变', description: '渐变色彩，现代动感', color: '#4f46e5', component: GradientTemplate },
  'infographic': { id: 'infographic', name: '信息图', description: '信息图风格，数据可视化', color: '#0891b2', component: InfographicTemplate },
  'japanese': { id: 'japanese', name: '和风', description: '和风设计，东方美学', color: '#be123c', component: JapaneseTemplate },
  'legal': { id: 'legal', name: '法律', description: '法律风格，严谨规范', color: '#1e3a5f', component: LegalTemplate },
  'luxe': { id: 'luxe', name: '奢华', description: '奢华风格，高端大气', color: '#1e1b4b', component: LuxeTemplate },
  'magazine': { id: 'magazine', name: '杂志', description: '杂志风格，视觉丰富', color: '#be123c', component: MagazineTemplate },
  'material': { id: 'material', name: 'Material', description: 'Material Design，层次分明', color: '#1976d2', component: MaterialTemplate },
  'medical': { id: 'medical', name: '医疗', description: '医疗风格，亲和专业', color: '#0e7490', component: MedicalTemplate },
  'metro': { id: 'metro', name: 'Metro', description: 'Metro风格，磁贴设计', color: '#0078d4', component: MetroTemplate },
  'minimal': { id: 'minimal', name: '极简', description: '极简留白设计，突出内容', color: '#f8f9fa', component: MinimalTemplate },
  'modern': { id: 'modern', name: '现代', description: '现代渐变风格，色彩鲜明', color: '#e94560', component: ModernTemplate },
  'mosaic': { id: 'mosaic', name: '马赛克', description: '马赛克风格，创意拼接', color: '#4f46e5', component: MosaicTemplate },
  'neon': { id: 'neon', name: '霓虹', description: '霓虹风格，炫酷科技', color: '#22d3ee', component: NeonTemplate },
  'nordic': { id: 'nordic', name: '北欧', description: '北欧极简，清新自然', color: '#1e3a5f', component: NordicTemplate },
  'professional': { id: 'professional', name: '专业', description: '专业稳重布局，商务首选', color: '#1e40af', component: ProfessionalTemplate },
  'retro': { id: 'retro', name: '复古', description: '复古风格，怀旧经典', color: '#b45309', component: RetroTemplate },
  'ribbon': { id: 'ribbon', name: '绶带', description: '绶带装饰，独特个性', color: '#be185d', component: RibbonTemplate },
  'rose': { id: 'rose', name: '玫瑰', description: '玫瑰风格，优雅浪漫', color: '#9d174d', component: RoseTemplate },
  'scientist': { id: 'scientist', name: '科学家', description: '科学家风格，学术严谨', color: '#0f766e', component: ScientistTemplate },
  'sidebar': { id: 'sidebar', name: '侧边栏', description: '侧边栏布局，信息分区', color: '#1e40af', component: SidebarTemplate },
  'startup': { id: 'startup', name: '创业', description: '创业公司风格，充满活力', color: '#ea580c', component: StartupTemplate },
  'swiss': { id: 'swiss', name: '瑞士', description: '瑞士风格，极简排版', color: '#dc2626', component: SwissTemplate },
  'teacher': { id: 'teacher', name: '教师', description: '教师风格，亲切温和', color: '#0d9488', component: TeacherTemplate },
  'timeline': { id: 'timeline', name: '时间线', description: '时间线布局，突出职业轨迹', color: '#7c3aed', component: TimelineTemplate },
  'two-column': { id: 'two-column', name: '双栏', description: '双栏分区设计，信息层次分明', color: '#0f3460', component: TwoColumnTemplate },
  'watercolor': { id: 'watercolor', name: '水彩', description: '水彩风格，柔和雅致', color: '#4c1d95', component: WatercolorTemplate },
  'zigzag': { id: 'zigzag', name: '锯齿', description: '锯齿布局，动感活泼', color: '#0891b2', component: ZigzagTemplate },
};

export const TEMPLATE_LIST: TemplateDefinition[] = Object.values(TEMPLATES);

export function getTemplate(id: string): TemplateDefinition {
  return TEMPLATES[id] || TEMPLATES['classic'];
}
