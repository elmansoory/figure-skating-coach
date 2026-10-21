import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JumpLab } from "@/components/physics/jump-lab";
import { SpinLab } from "@/components/physics/spin-lab";
import { IceLab } from "@/components/physics/ice-lab";

export default function PhysicsLab() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">مختبر الفيزياء</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          نموذج ميكانيكا حيوية مبسّط للقفزات والدورانات: حركة المقذوفات تحت تأثير الجاذبية، ونموذج مجزّأ لعزم
          القصور الذاتي لأجزاء الجسم، وحفظ الزخم الزاوي في الهواء، واحتكاك الشفرة بالجليد. النتائج تقديرات
          للتعليم وتحليل سيناريوهات «ماذا لو»، وليست قياسات لمتزلج بعينه.
        </p>
      </div>

      <Tabs defaultValue="jump">
        <TabsList>
          <TabsTrigger value="jump">القفزات</TabsTrigger>
          <TabsTrigger value="spin">الدورانات</TabsTrigger>
          <TabsTrigger value="ice">الشفرة والجليد</TabsTrigger>
        </TabsList>
        <TabsContent value="jump" className="pt-4"><JumpLab /></TabsContent>
        <TabsContent value="spin" className="pt-4"><SpinLab /></TabsContent>
        <TabsContent value="ice" className="pt-4"><IceLab /></TabsContent>
      </Tabs>
    </div>
  );
}
