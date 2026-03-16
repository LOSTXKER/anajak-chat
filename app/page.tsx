import Link from "next/link";
import {
  MessageSquare,
  Zap,
  BarChart3,
  Shield,
  ArrowRight,
  MessagesSquare,
  Bot,
  Users,
} from "lucide-react";

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
        <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
      </div>
      <h3 className="text-base font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-light tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <span className="text-base font-semibold tracking-tight">Anajak Chat</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              เริ่มต้นใช้งาน
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-24 md:pt-32">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            พร้อมใช้งาน
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            จัดการทุกแชท
            <br />
            <span className="text-zinc-400 dark:text-zinc-500">ในที่เดียว</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
            รวม Facebook Messenger, LINE, Instagram ไว้ในกล่องข้อความเดียว 
            ตอบลูกค้าได้เร็วขึ้น ไม่พลาดทุกข้อความ
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              เริ่มต้นฟรี
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>

        {/* Chat Preview */}
        <div className="mx-auto mt-16 max-w-xl">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm shadow-sm dark:bg-zinc-800">
                  สวัสดีค่ะ สนใจเสื้อรุ่นใหม่ มีไซส์ L ไหมคะ?
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <div className="rounded-2xl rounded-br-sm bg-zinc-900 px-4 py-2.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
                  มีค่ะ ไซส์ L มีทุกสี ส่งรูปให้ดูเลยนะคะ
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm shadow-sm dark:bg-zinc-800">
                  ขอสีดำกับสีขาวค่ะ ราคาเท่าไหร่?
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
              <div className="flex-1 rounded-lg bg-white px-3 py-2 text-sm text-zinc-400 dark:bg-zinc-800">
                พิมพ์ข้อความ...
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
                <ArrowRight className="h-4 w-4 text-white dark:text-zinc-900" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-100 bg-zinc-50/50 py-16 dark:border-zinc-800/50 dark:bg-zinc-900/30">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-8 px-6">
          <StatItem value="Realtime" label="ข้อความอัพเดททันที" />
          <StatItem value="3+" label="ช่องทางเชื่อมต่อ" />
          <StatItem value="AI" label="ตอบอัตโนมัติ" />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-2xl font-semibold tracking-tight">ทุกอย่างที่ต้องการ</h2>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            เครื่องมือจัดการแชทที่ออกแบบมาเพื่อธุรกิจไทย
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={MessagesSquare}
            title="รวมทุกช่องทาง"
            description="Facebook Messenger, LINE OA, Instagram DM รวมไว้ในกล่องข้อความเดียว"
          />
          <FeatureCard
            icon={Zap}
            title="Realtime"
            description="ข้อความใหม่แสดงทันทีโดยไม่ต้องรีเฟรช พร้อมแจ้งเตือนอัตโนมัติ"
          />
          <FeatureCard
            icon={Bot}
            title="AI Smart Reply"
            description="AI ช่วยแนะนำคำตอบ ตอบอัตโนมัตินอกเวลาทำการ ด้วย Google Gemini"
          />
          <FeatureCard
            icon={Users}
            title="จัดการลูกค้า"
            description="ข้อมูลลูกค้า ประวัติแชท แท็ก และ segment อัตโนมัติ"
          />
          <FeatureCard
            icon={BarChart3}
            title="วิเคราะห์ผลงาน"
            description="รายงานประสิทธิภาพ SLA ปริมาณงาน และ conversion จากโฆษณา"
          />
          <FeatureCard
            icon={Shield}
            title="ปลอดภัย"
            description="เข้ารหัสข้อมูล ระบบ authentication มาตรฐาน สิทธิ์ตามบทบาท"
          />
        </div>
      </section>

      {/* Channels */}
      <section className="border-t border-zinc-100 bg-zinc-50/50 py-20 dark:border-zinc-800/50 dark:bg-zinc-900/30">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-md text-center">
            <h2 className="text-2xl font-semibold tracking-tight">ช่องทางที่รองรับ</h2>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              เชื่อมต่อง่ายแค่ไม่กี่คลิก
            </p>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            {[
              { name: "Facebook Messenger", status: "พร้อมใช้" },
              { name: "LINE Official Account", status: "พร้อมใช้" },
              { name: "Instagram DM", status: "พร้อมใช้" },
              { name: "WhatsApp", status: "เร็วๆ นี้" },
            ].map((ch) => (
              <div
                key={ch.name}
                className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white px-8 py-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="text-sm font-medium">{ch.name}</span>
                <span className={`text-xs ${ch.status === "พร้อมใช้" ? "text-emerald-600" : "text-zinc-400"}`}>
                  {ch.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-2xl font-semibold tracking-tight">พร้อมเริ่มต้น?</h2>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            ใช้งานฟรี ไม่ต้องใส่บัตรเครดิต ตั้งค่าเสร็จภายไม่กี่นาที
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            สร้างบัญชีฟรี
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8 dark:border-zinc-800/50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <MessageSquare className="h-4 w-4" />
            <span>Anajak Chat</span>
          </div>
          <div className="flex gap-6 text-sm text-zinc-400">
            <Link href="/privacy" className="transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
              นโยบายความเป็นส่วนตัว
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
