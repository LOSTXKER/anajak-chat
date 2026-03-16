export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">นโยบายความเป็นส่วนตัว</h1>
      <p className="mt-2 text-sm text-muted-foreground">ปรับปรุงล่าสุด: 16 มีนาคม 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/80">
        <section>
          <h2 className="text-base font-medium text-foreground">1. ข้อมูลที่เราเก็บรวบรวม</h2>
          <p className="mt-2">
            เมื่อคุณติดต่อเราผ่านช่องทางแชท (Facebook Messenger, LINE, Instagram) เราจะเก็บรวบรวมข้อมูลดังนี้:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>ชื่อโปรไฟล์และรูปโปรไฟล์จากแพลตฟอร์มที่คุณใช้ติดต่อ</li>
            <li>ข้อความ รูปภาพ และไฟล์ที่คุณส่งมาในการสนทนา</li>
            <li>ข้อมูลการสั่งซื้อสินค้าและบริการ</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">2. วัตถุประสงค์ในการใช้ข้อมูล</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>ตอบกลับข้อความและให้บริการลูกค้า</li>
            <li>ดำเนินการตามคำสั่งซื้อ</li>
            <li>ปรับปรุงคุณภาพการให้บริการ</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">3. การแบ่งปันข้อมูล</h2>
          <p className="mt-2">
            เราไม่ขาย ไม่แลกเปลี่ยน และไม่เปิดเผยข้อมูลส่วนบุคคลของคุณให้บุคคลภายนอก
            ยกเว้นกรณีที่จำเป็นเพื่อให้บริการ (เช่น บริษัทขนส่ง) หรือตามที่กฎหมายกำหนด
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">4. การเก็บรักษาข้อมูล</h2>
          <p className="mt-2">
            ข้อมูลของคุณถูกเก็บอย่างปลอดภัยบนเซิร์ฟเวอร์ที่มีการเข้ารหัส
            และเราจะเก็บรักษาข้อมูลตราบเท่าที่จำเป็นเพื่อให้บริการ
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">5. สิทธิ์ของคุณ</h2>
          <p className="mt-2">คุณมีสิทธิ์:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>ขอเข้าถึงข้อมูลส่วนบุคคลของคุณ</li>
            <li>ขอแก้ไขหรือลบข้อมูลของคุณ</li>
            <li>ยกเลิกการติดต่อสื่อสารได้ทุกเมื่อ</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">6. ติดต่อเรา</h2>
          <p className="mt-2">
            หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัว สามารถติดต่อเราผ่านช่องทางแชทของเพจ
            หรือส่งอีเมลมาที่ผู้ดูแลระบบ
          </p>
        </section>
      </div>
    </div>
  );
}
