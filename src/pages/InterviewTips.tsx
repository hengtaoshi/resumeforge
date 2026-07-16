import { useState } from 'react'

const COMPANY_STYLES: Record<string, { focus: string; tips: string[] }> = {
  通用: { focus: '通用面试技巧', tips: [] },
  '字节跳动': { focus: '高并发·始终创业·数据驱动', tips: ['字节面试通常4-5轮，技术面深度高', '看重"始终创业"——主动性和承担意愿', '数据驱动：回答尽量用数据说话', '系统设计面常考高并发、海量数据场景', '行为面问"最有挑战的项目"出现频率极高'] },
  '阿里巴巴': { focus: '体系化思考·方法论·复盘', tips: ['阿里重视"体系化思考"——不只讲做了什么，要讲为什么做、怎么做', '价值观考察贯穿全程，了解"六脉神剑"', '技术面关注底层原理和边界条件', '复盘思维：主动讲项目中的失败和改进', '多轮交叉面，抗压能力很重要'] },
  腾讯: { focus: '产品思维·用户导向·长线', tips: ['腾讯非常看重产品思维，即使是技术岗', '回答体现对用户体验的思考', '长线思维：讲项目时展示技术规划', '技术面常有"开放设计题"', '不强调加班，更看重产出质量'] },
  美团: { focus: '实战落地·执行力', tips: ['美团重视实战能力，少谈理论多讲落地', '关注ROI意识——你做的东西带来了什么价值', '技术面偏实战，结合具体业务场景提问', '"长期有耐心"是价值观关键词', '经验匹配度很重要，突出相关领域经验'] },
  '外企(微软/谷歌/亚马逊)': { focus: '英语·行为面试·通用能力', tips: ['亚马逊：准备Leadership Principles行为面试', '谷歌：通用认知能力(gCA)面试+算法', '微软：技术面深度高，看重解决问题思路', '英语面试：准备英文自我介绍和项目介绍', '行为面试用STAR/SOAR结构描述项目'] },
}

type Question = {
  q: string
  a: string
  tips: string
  avoid: string
}

type Category = {
  title: string
  icon: string
  desc: string
  items: Question[]
}

const DATA: Category[] = [
  {
    title: '离职原因',
    icon: '🚪',
    desc: '面试官想知道：你的稳定性、离职风险、和岗位的匹配度',
    items: [
      {
        q: '为什么离开上一家公司？',
        a: '上一家公司业务比较成熟，发展空间有限。我希望能在一个更大的平台上继续深耕，发挥我已有的经验，同时接触更有挑战性的业务。贵公司的这个岗位正好符合我的发展方向。',
        tips: '用"客观事实 + 成长诉求 + 与新岗位的连接"的公式。不要抱怨前公司。',
        avoid: '× 工资太低、加班太多、老板不好\n× 公司业务不行、管理混乱\n× 说"个人原因"却不展开',
      },
      {
        q: '为什么中间有空窗期？',
        a: '离职后我花时间复盘了之前的项目经验，考取了XX证书/系统学习了XX技术，同时也认真思考了下一份工作的方向。我不希望仓促入职，而是找到真正匹配的岗位再出发。',
        tips: '把空窗期包装成"充电+复盘"，展示你不是找不到工作，而是有选择地找工作。',
        avoid: '× "一直没找到合适的"\n× "休息了一下"',
      },
      {
        q: '为什么考虑我们公司？',
        a: '我关注贵公司很久了，特别是X产品/X业务的发展。我在上一家公司积累了X经验，这个能力正好能在这里发挥。而且贵公司的技术栈/业务方向和我未来的规划很契合。',
        tips: '面试前做功课：公司最近的产品、融资、新闻。具体提到某个产品/业务线。',
        avoid: '× "公司大、福利好"\n× "朋友推荐"\n× "我需要一份工作"',
      },
    ],
  },
  {
    title: '优缺点',
    icon: '⚖️',
    desc: '面试官在考察你的自我认知和成长型思维',
    items: [
      {
        q: '你最大的优点是什么？',
        a: '我的优势是把想法快速落地。在上一家公司，我发现用户留存有个瓶颈，主动做了一个A/B测试方案，一周内上线，最终让转化率提升了15%。我习惯用数据驱动决策，而不是只凭感觉。',
        tips: '用"特质 + 具体案例 + 量化结果"公式。选与岗位最相关的优点。',
        avoid: '× 只说"学习能力强"却没有案例\n× 背准备好的台词',
      },
      {
        q: '你最大的缺点是什么？',
        a: '我过去决策时追求完美信息，导致推进偏慢。后来我给自己定了规则：先花30分钟收集核心信息，用简单框架做决策，快速验证。现在决策速度和准确率都明显提升。',
        tips: '选真实但不致命的缺点，重点展示改进过程和成果。',
        avoid: '× "我太完美主义了"\n× "我工作太拼了"\n× 说"不喜欢团队合作"',
      },
    ],
  },
  {
    title: '团队冲突',
    icon: '🤝',
    desc: '面试官想看你如何处理分歧、沟通协作能力',
    items: [
      {
        q: '和同事意见不合怎么办？',
        a: '我会先认真听完对方的观点，理解他的出发点和顾虑。然后用数据或事实来说明我的方案为什么更优。如果双方都有道理，可以小范围做A/B测试验证。就算最终没采纳我的方案，我也会全力配合执行。',
        tips: '尊重对方 + 用数据说话 + 目标是解决问题。',
        avoid: '× "直接找领导评理"\n× "听他的，我不争"',
      },
      {
        q: '和上级意见不一致怎么处理？',
        a: '我会先执行上级的决定，因为他对全局信息掌握更全面。同时用数据整理好自己的想法，在合适场合（周会、1on1）以建议方式提出来。',
        tips: '先执行，在合适的时机用数据说话。',
        avoid: '× 当场顶撞\n× "我都听领导的"',
      },
      {
        q: '如何与难以合作的人共事？',
        a: '先站在对方角度想他为什么这样，然后找一个共同目标作为切入点，把关系从"对立"转向"一起解决问题"。日常也通过非工作交流建立信任。',
        tips: '同理心优先 + 找共同目标 + 建立信任。',
        avoid: '× "避开这种人"\n× "直接怼回去"',
      },
    ],
  },
  {
    title: '压力管理',
    icon: '💪',
    desc: '面试官想知道你在高压下的表现和应对策略',
    items: [
      {
        q: '如何应对紧急截止日期？',
        a: '先拆解任务，列出关键路径和优先级。把非核心工作暂缓或请同事协助。同时和上级沟通进度，让他知道风险和预期。上次项目截止日期提前了一周，我通过重新排期最终按时交付了核心功能。',
        tips: '展示拆解问题 + 沟通 + 执行的能力框架。',
        avoid: '× "加班搞定"（只有蛮力）\n× "压力太大受不了"',
      },
      {
        q: '同时接到多个任务怎么处理？',
        a: '先评估每个任务的紧急性和重要性，用四象限法排优先级。紧急且重要的优先处理，重要不紧急的排计划。同时主动和相关方沟通预期时间。',
        tips: '展示你的任务管理方法论（四象限等）。',
        avoid: '× "一个个做完"\n× "做不完就加班"',
      },
    ],
  },
  {
    title: '失败经历',
    icon: '📉',
    desc: '面试官想考察你的诚实度、复盘能力和成长心态',
    items: [
      {
        q: '说一个你犯过的错误？',
        a: '有一次我高估了自己对某个技术的掌握程度，承诺了比较激进的交付时间。后来发现实现难度比预期大很多。我及时向团队说明情况并重新排期。这次之后，我对不熟悉的技术会先做POC评估再给排期。',
        tips: '真诚承认 + 分析原因 + 具体改进 + 不再犯。',
        avoid: '× "工作太认真导致身体不好"\n× "都是别人的错"',
      },
      {
        q: '项目中发现方向错了怎么办？',
        a: '第一时间止损，评估偏差有多大，然后和团队同步情况调整方案。比起硬撑到项目结束，我更愿意早点承认问题并纠正。',
        tips: '展示决策能力和止损意识。',
        avoid: '× "继续做下去"\n× "不知道该怎么办"',
      },
    ],
  },
  {
    title: '职业规划',
    icon: '🎯',
    desc: '面试官想知道你是否有清晰的方向，是否和公司需求一致',
    items: [
      {
        q: '你未来3-5年的规划是什么？',
        a: '短期我希望在X领域深耕，把技术/业务做深做透，成为团队里可以依赖的专家。长期希望能带小团队，把经验复制出去。贵公司正好能提供这样的发展路径。',
        tips: '和岗位发展方向对齐。不要太具体（"3年当经理"），也不要太模糊（"好好学习"）。',
        avoid: '× "3年当上经理"\n× "还没想好"\n× "干到退休"',
      },
      {
        q: '你对薪资的期望？',
        a: '我目前的薪资在X左右。我了解贵公司这个岗位的市场区间大概在X到Y，这个范围对我来说是合理的。我更看重的是岗位本身的发展空间和成长机会。',
        tips: '提前调研市场薪资，给出范围而不是固定数字，强调更看重发展。',
        avoid: '× 说离谱的高价\n× "你们给多少就多少"',
      },
    ],
  },
]

function QuestionCard({ q, idx }: { q: Question; idx: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center shrink-0">
          {idx + 1}
        </span>
        <span className="flex-1 text-sm font-medium text-slate-800">{q.q}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3">
          <div>
            <div className="text-xs font-semibold text-teal-600 mb-1">推荐回答</div>
            <div className="text-sm text-slate-700 bg-teal-50 rounded-lg p-3 leading-relaxed">{q.a}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-semibold text-emerald-600 mb-1">✓ 核心技巧</div>
              <div className="text-xs text-slate-600 bg-emerald-50 rounded-lg p-3 leading-relaxed">{q.tips}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-rose-600 mb-1">✗ 避免踩坑</div>
              <div className="text-xs text-slate-600 bg-rose-50 rounded-lg p-3 leading-relaxed whitespace-pre-line">{q.avoid}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function InterviewTips() {
  const [activeCat, setActiveCat] = useState(0)
  const [activeCompany, setActiveCompany] = useState('通用')
  const cat = DATA[activeCat]
  const companyStyle = COMPANY_STYLES[activeCompany]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">面试技巧</h1>
        <p className="text-sm text-slate-500">非技术类面试高频问题应答策略，基于真实面试经验整理</p>
      </div>

      {/* Company style selector */}
      <div className="mb-6">
        <p className="text-xs font-medium text-slate-500 mb-2">企业面试风格</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(COMPANY_STYLES).map(name => (
            <button key={name} onClick={() => setActiveCompany(name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                activeCompany === name ? 'bg-sky-500 text-white border-sky-500' : 'border-slate-200 text-slate-500 hover:border-sky-300'
              }`}>{name}</button>
          ))}
        </div>
        {activeCompany !== '通用' && (
          <div className="mt-3 p-4 bg-sky-50 rounded-xl">
            <p className="text-sm font-semibold text-sky-700 mb-1">{activeCompany} — {companyStyle.focus}</p>
            <ul className="space-y-1">
              {companyStyle.tips.map((t, i) => <li key={i} className="text-xs text-sky-600 flex items-start gap-2"><span className="mt-1 w-1 h-1 rounded-full bg-sky-400 flex-shrink-0" />{t}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {DATA.map((c, i) => (
          <button
            key={i}
            onClick={() => setActiveCat(i)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              i === activeCat
                ? 'bg-teal-500 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-600'
            }`}
          >
            <span>{c.icon}</span>
            <span>{c.title}</span>
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">{cat.icon}</span>
          <h2 className="text-lg font-semibold text-slate-800">{cat.title}</h2>
        </div>
        <p className="text-sm text-slate-500 mt-1">{cat.desc}</p>
      </div>

      <div className="space-y-3">
        {cat.items.map((q, i) => (
          <QuestionCard key={i} q={q} idx={i} />
        ))}
      </div>

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <strong>💡 核心原则：</strong>回答非技术问题用 <strong>STAR 法则</strong>（Situation-Task-Action-Result），
        描述具体经历而非假设，用量化结果说话。提前准备 4-7 个故事，覆盖领导力、解决问题、团队冲突、失败经历等场景。
      </div>
    </div>
  )
}
