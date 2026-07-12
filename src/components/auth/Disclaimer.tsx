import { useState } from 'react'

type Page = 'terms' | 'privacy'

export default function Disclaimer({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState<Page>('terms')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-[520px] max-h-[85vh] overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
        {/* Tabs */}
        <div className="flex border-b border-slate-200 shrink-0">
          <button
            onClick={() => setPage('terms')}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors ${page === 'terms' ? 'text-sky-600 border-b-2 border-sky-500' : 'text-slate-400 hover:text-slate-600'}`}
          >服务条款</button>
          <button
            onClick={() => setPage('privacy')}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors ${page === 'privacy' ? 'text-sky-600 border-b-2 border-sky-500' : 'text-slate-400 hover:text-slate-600'}`}
          >隐私政策</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-600 leading-relaxed" style={{ maxHeight: 'calc(85vh - 130px)' }}>
          {page === 'terms' ? <Terms /> : <Privacy />}
        </div>

        <div className="px-6 pb-5 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors">我知道了</button>
        </div>
      </div>
    </div>
  )
}

function Terms() {
  return (
    <>
      <h2 className="text-base font-semibold text-slate-800">服务条款</h2>
      <p>欢迎使用 ResumeForge。使用本服务前请仔细阅读以下条款。</p>

      <h3 className="font-medium text-slate-700">1. 服务说明</h3>
      <p>ResumeForge 是一款简历优化与求职辅助工具，提供以下功能：简历编辑与排版、AI 驱动的简历优化建议、岗位匹配分析、求职信生成、面试模拟等。本服务通过 AI 技术辅助用户优化简历，AI 生成的内容仅供参考，用户应对最终内容自行审核。</p>

      <h3 className="font-medium text-slate-700">2. 账号管理</h3>
      <p>用户需使用邮箱注册账号。用户应妥善保管账号信息，对账号下的一切活动负责。如发现账号异常，请及时联系我们。用户不得将账号转让、出借或用于任何商业用途。</p>

      <h3 className="font-medium text-slate-700">3. 用户行为规范</h3>
      <p>用户承诺：不利用本服务从事任何违法违规活动；不伪造、篡改简历信息；不侵犯他人知识产权；不传播恶意内容、病毒或干扰系统运行；不尝试破解、逆向工程本服务。违反上述规范可能导致账号被暂停或终止。</p>

      <h3 className="font-medium text-slate-700">4. 知识产权</h3>
      <p>本服务的软件、界面设计、商标等知识产权归开发团队所有。用户在使用本服务过程中创建的简历内容，其知识产权归用户所有。用户授予我们在法律允许范围内为提供和改善服务所需的必要使用权限。</p>

      <h3 className="font-medium text-slate-700">5. 免责声明</h3>
      <p>本服务按「现状」提供。在法律允许的最大范围内，我们不对服务的不间断性、准确性或适用性作任何明示或暗示的保证。我们不承担因使用本服务而产生的任何直接、间接、附带或后果性损害的责任，包括但不限于因简历内容导致的求职机会损失。</p>

      <h3 className="font-medium text-slate-700">6. 第三方服务</h3>
      <p>本服务可能集成第三方 AI 模型提供商（如 Anthropic、OpenAI、DeepSeek 等）。AI 模型提供商可能处理您提交的内容以生成回复。我们不对第三方服务的内容、隐私实践或行为承担责任。</p>

      <h3 className="font-medium text-slate-700">7. 条款变更</h3>
      <p>我们保留随时修改本条款的权利。重大变更将通过应用内通知或电子邮件告知。修改后继续使用本服务即表示接受新条款。</p>

      <p className="text-xs text-slate-400 pt-2">最后更新：2026 年 7 月</p>
    </>
  )
}

function Privacy() {
  return (
    <>
      <h2 className="text-base font-semibold text-slate-800">隐私政策</h2>
      <p>我们重视您的隐私。本政策说明我们如何收集、使用和保护您的个人信息。</p>

      <h3 className="font-medium text-slate-700">1. 收集的信息</h3>
      <p><strong>您主动提供的信息：</strong>邮箱地址（用于登录）、简历内容（包括个人信息、教育经历、工作经历、技能等）、求职偏好设置。</p>
      <p><strong>自动收集的信息：</strong>应用版本号、操作系统信息、功能使用频率（仅用于改善服务质量）。</p>
      <p><strong>我们不会收集的信息：</strong>精确位置信息、通讯录、照片等无关数据。</p>

      <h3 className="font-medium text-slate-700">2. 信息的用途</h3>
      <p>我们收集的信息仅用于：提供和改进简历优化服务；处理登录请求；根据您的偏好生成个性化内容；改善用户体验。</p>
      <p>我们不会将您的个人信息用于任何其他目的，不会出售您的数据给第三方。</p>

      <h3 className="font-medium text-slate-700">3. 数据存储与传输</h3>
      <p>您的数据通过加密连接（HTTPS）传输。登录凭证使用操作系统级加密（Windows DPAPI）存储在本地设备。简历数据可同步至我们的服务器以实现跨设备访问，传输和存储均经过加密。</p>

      <h3 className="font-medium text-slate-700">4. 数据保留与删除</h3>
      <p>我们仅在提供服务所必需的期限内保留您的数据。您可随时删除您的简历数据。如需注销账号，请联系我们，我们将在合理时间内处理。</p>

      <h3 className="font-medium text-slate-700">5. 数据共享</h3>
      <p>我们仅在以下情况下共享您的信息：经您明确同意；法律要求；为保护我们的合法权益。AI 功能中，您提交的内容可能会发送至您选择的 AI 提供商进行处理，但我们不会将您的个人信息出售或出租给第三方。</p>

      <h3 className="font-medium text-slate-700">6. 您的权利</h3>
      <p>您有权访问、更正、删除您的个人信息；有权撤回同意；有权注销账号。您可通过应用内设置或联系我们行使上述权利。</p>

      <h3 className="font-medium text-slate-700">7. 联系我们</h3>
      <p>如您对隐私政策有任何疑问，可通过应用内的反馈功能联系我们。</p>

      <p className="text-xs text-slate-400 pt-2">最后更新：2026 年 7 月</p>
    </>
  )
}
