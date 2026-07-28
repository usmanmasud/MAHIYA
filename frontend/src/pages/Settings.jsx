import { Card, Disclaimer } from '../components/ui';

export default function Settings() {
  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#e8e3dc]">Settings</h1>
        <p className="text-sm text-[#555] mt-1">Platform configuration</p>
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <p className="text-xs text-[#555] uppercase tracking-wide font-medium mb-3">Platform</p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-[#ccc]">
              <span className="text-[#666]">Version</span>
              <span>1.0.0-mvp</span>
            </div>
            <div className="flex justify-between text-[#ccc]">
              <span className="text-[#666]">AI Model</span>
              <span>Gemma 4 (local)</span>
            </div>
            <div className="flex justify-between text-[#ccc]">
              <span className="text-[#666]">Storage</span>
              <span>Local SQLite</span>
            </div>
            <div className="flex justify-between text-[#ccc]">
              <span className="text-[#666]">Languages</span>
              <span>English, Hausa</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-xs text-[#555] uppercase tracking-wide font-medium mb-3">Clinical Guidelines</p>
          <div className="space-y-2 text-sm text-[#666]">
            <p>· WHO Maternal Health Guidelines</p>
            <p>· Nigeria FMOH Emergency Obstetric Care</p>
            <p>· Integrated Management of Childhood Illness</p>
          </div>
        </Card>

        <Card className="p-5">
          <Disclaimer />
        </Card>
      </div>
    </div>
  );
}
