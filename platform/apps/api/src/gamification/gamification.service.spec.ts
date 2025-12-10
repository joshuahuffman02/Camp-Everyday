import { GamificationService } from "./gamification.service";

describe("GamificationService helpers", () => {
  const prismaMock = {} as any;
  const service = new GamificationService(prismaMock);

  it("computes level progress with next threshold", () => {
    const levels = [
      { level: 1, minXp: 0, name: "New Recruit" },
      { level: 2, minXp: 200, name: "Operator" },
      { level: 3, minXp: 600, name: "Specialist" },
    ];

    const result = (service as any).computeLevel(450, levels);

    expect(result.level).toBe(2);
    expect(result.nextLevel).toBe(3);
    expect(result.progressToNext).toBeCloseTo((450 - 200) / (600 - 200));
  });

  it("clamps XP with rules", () => {
    const resolve = (service as any).resolveXpAmount.bind(service);

    expect(resolve(undefined, { minXp: 10, maxXp: 50, defaultXp: 25 })).toBe(25);
    expect(resolve(5, { minXp: 10, maxXp: 50, defaultXp: 25 })).toBe(10);
    expect(resolve(80, { minXp: 10, maxXp: 50, defaultXp: 25 })).toBe(50);
  });

  it("honors role allow lists", () => {
    const roleAllowed = (service as any).roleAllowed.bind(service);

    expect(roleAllowed({ enabledRoles: [] }, "front_desk")).toBe(true);
    expect(roleAllowed({ enabledRoles: ["manager"] }, "front_desk")).toBe(false);
    expect(roleAllowed({ enabledRoles: ["manager", "maintenance"] }, "maintenance")).toBe(true);
  });
});

