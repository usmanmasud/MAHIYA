import {
  Wifi,
  Brain,
  FileText,
  Languages,
  ShieldCheck,
  ArrowRight,
  Activity,
} from 'lucide-react';

const features = [
  {
    icon: Wifi,
    title: 'Fully Offline',
    desc: 'Works without internet. All data stays on the device — no cloud dependency.',
  },
  {
    icon: Brain,
    title: 'Local AI Inference',
    desc: 'Gemma 4 runs on-device to analyse symptoms and surface danger signs instantly.',
  },
  {
    icon: FileText,
    title: 'Structured Referrals',
    desc: 'Generates complete referral documents ready to hand to the receiving facility.',
  },
  {
    icon: Languages,
    title: 'Hausa & English',
    desc: 'Designed for frontline workers in Northern Nigeria — in the language they use.',
  },
  {
    icon: ShieldCheck,
    title: 'Clinical Guidelines',
    desc: 'Responses are grounded in verified maternal and neonatal care protocols via RAG.',
  },
  {
    icon: Activity,
    title: 'Case Tracking',
    desc: 'Log, monitor, and review every case with a full audit trail stored locally.',
  },
];

export default function Landing({ onEnter }) {
  return (
    <div className="min-h-screen bg-[#f8f7f5] text-[#1a1a1a] flex flex-col">

      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#e8e6e1]">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-[#2d6a4f]" strokeWidth={2} />
          <span className="font-semibold text-base tracking-tight">Mahiya Edge</span>
        </div>
        <button
          onClick={onEnter}
          className="text-sm font-medium text-[#2d6a4f] hover:underline underline-offset-4"
        >
          Sign in
        </button>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-20 max-w-2xl mx-auto">
        <span className="text-xs font-medium tracking-widest uppercase text-[#2d6a4f] mb-6">
          Offline Clinical Intelligence
        </span>
        <h1 className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight mb-6">
          Clinical support for<br />frontline workers
        </h1>
        <p className="text-[#555] text-lg leading-relaxed mb-10 max-w-lg">
          Mahiya Edge helps CHEWs, nurses, and midwives in rural Northern Nigeria
          recognise maternal and neonatal danger signs — without internet, without delay.
        </p>
        <button
          onClick={onEnter}
          className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-[#245c43] transition-colors"
        >
          Open the platform
          <ArrowRight size={16} />
        </button>
      </section>

      {/* Divider */}
      <div className="w-full border-t border-[#e8e6e1]" />

      {/* Features */}
      <section className="max-w-5xl mx-auto w-full px-6 py-20">
        <p className="text-xs font-medium tracking-widest uppercase text-[#999] mb-12 text-center">
          What it does
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col gap-3">
              <div className="w-9 h-9 rounded-md bg-[#eaf2ed] flex items-center justify-center">
                <Icon size={18} className="text-[#2d6a4f]" strokeWidth={1.75} />
              </div>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-sm text-[#666] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="w-full border-t border-[#e8e6e1]" />

      {/* Safety note */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <ShieldCheck size={20} className="text-[#2d6a4f] mx-auto mb-4" strokeWidth={1.75} />
        <p className="text-sm text-[#666] leading-relaxed">
          Mahiya Edge supports clinical decision-making. It does not diagnose, prescribe,
          or replace professional medical judgment. All outputs include an explicit safety disclaimer.
        </p>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#e8e6e1] px-8 py-5 flex items-center justify-between text-xs text-[#aaa]">
        <span>Mahiya Edge</span>
        <span>Built for Northern Nigeria</span>
      </footer>

    </div>
  );
}
