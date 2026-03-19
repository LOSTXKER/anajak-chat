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
  Check,
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
    <div className="group relative rounded-2xl border bg-card p-7 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold tracking-tight text-gradient-primary md:text-5xl">{value}</div>
      <div className="mt-2 text-sm font-medium text-muted-foreground">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Floating Nav */}
      <nav className="sticky top-0 z-50 px-4 pt-4">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-2xl border bg-background/70 px-5 shadow-sm shadow-black/5 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/25">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold tracking-tight">Anajak Chat</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20"
            >
              เริ่มต้นใช้งาน
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-glow-primary" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-24 md:pt-32">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              พร้อมใช้งาน
            </div>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              จัดการทุกแชท
              <br />
              <span className="text-gradient-primary">ในที่เดียว</span>
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              รวม Facebook Messenger, LINE, Instagram ไว้ในกล่องข้อความเดียว
              ตอบลูกค้าได้เร็วขึ้น ไม่พลาดทุกข้อความ
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
              >
                เริ่มต้นฟรี
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border px-7 py-3 text-sm font-semibold transition-colors hover:bg-muted/50"
              >
                เข้าสู่ระบบ
              </Link>
            </div>
          </div>

          {/* Chat Preview */}
          <div className="mx-auto mt-16 max-w-xl">
            <div className="rounded-2xl border bg-card p-6 shadow-xl shadow-black/5 md:p-8">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5" />
                  <div className="rounded-2xl rounded-bl-lg bg-muted/60 px-4 py-2.5 text-sm">
                    สวัสดีค่ะ สนใจเสื้อรุ่นใหม่ มีไซส์ L ไหมคะ?
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <div className="rounded-2xl rounded-br-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    มีค่ะ ไซส์ L มีทุกสี ส่งรูปให้ดูเลยนะคะ
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5" />
                  <div className="rounded-2xl rounded-bl-lg bg-muted/60 px-4 py-2.5 text-sm">
                    ขอสีดำกับสีขาวค่ะ ราคาเท่าไหร่?
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3 border-t pt-4">
                <div className="flex-1 rounded-xl bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
                  พิมพ์ข้อความ...
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-sm shadow-primary/25">
                  <ArrowRight className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30 py-16 dark:bg-card/30">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-8 px-6">
          <StatItem value="Realtime" label="ข้อความอัพเดททันที" />
          <StatItem value="3+" label="ช่องทางเชื่อมต่อ" />
          <StatItem value="AI" label="ตอบอัตโนมัติ" />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="mx-auto max-w-md text-center">
          <p className="mb-3 text-sm font-semibold text-primary">ฟีเจอร์</p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">ทุกอย่างที่ต้องการ</h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
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
      <section className="border-t bg-muted/20 py-24 dark:bg-card/20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-md text-center">
            <p className="mb-3 text-sm font-semibold text-primary">ช่องทาง</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">ช่องทางที่รองรับ</h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              เชื่อมต่อง่ายแค่ไม่กี่คลิก
            </p>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            {[
              { name: "Facebook Messenger", ready: true },
              { name: "LINE Official Account", ready: true },
              { name: "Instagram DM", ready: true },
              { name: "WhatsApp", ready: false },
            ].map((ch) => (
              <div
                key={ch.name}
                className="group flex flex-col items-center gap-3 rounded-2xl border bg-card px-8 py-6 transition-all duration-300 hover:shadow-md hover:shadow-primary/5 hover:border-primary/20"
              >
                <span className="text-sm font-semibold">{ch.name}</span>
                {ch.ready ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                    <Check className="h-3 w-3" />
                    พร้อมใช้
                  </span>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">เร็วๆ นี้</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-glow-primary opacity-50" />
        <div className="relative mx-auto max-w-lg px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">พร้อมเริ่มต้น?</h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            ใช้งานฟรี ไม่ต้องใส่บัตรเครดิต ตั้งค่าเสร็จภายไม่กี่นาที
          </p>
          <Link
            href="/register"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
          >
            สร้างบัญชีฟรี
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/25">
              <MessageSquare className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Anajak Chat</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="font-medium transition-colors hover:text-foreground">
              นโยบายความเป็นส่วนตัว
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
