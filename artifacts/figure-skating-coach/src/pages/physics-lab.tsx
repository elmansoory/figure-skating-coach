import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JumpLab } from "@/components/physics/jump-lab";
import { SpinLab } from "@/components/physics/spin-lab";
import { IceLab } from "@/components/physics/ice-lab";

export default function PhysicsLab() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Physics Lab</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          A simplified biomechanical model of jumps and spins: projectile motion under gravity, a segmental model of
          the moment of inertia, conservation of angular momentum in the air, and blade–ice friction. Results are
          estimates for teaching and what-if analysis, not measurements of a specific skater.
        </p>
      </div>

      <Tabs defaultValue="jump">
        <TabsList>
          <TabsTrigger value="jump">Jumps</TabsTrigger>
          <TabsTrigger value="spin">Spins</TabsTrigger>
          <TabsTrigger value="ice">Blade & ice</TabsTrigger>
        </TabsList>
        <TabsContent value="jump" className="pt-4"><JumpLab /></TabsContent>
        <TabsContent value="spin" className="pt-4"><SpinLab /></TabsContent>
        <TabsContent value="ice" className="pt-4"><IceLab /></TabsContent>
      </Tabs>
    </div>
  );
}
