import { createRevenueTools, createOpsTools } from "./adk-tools";

/**
 * Registry for specialized LLMAgents.
 * Each agent represents a "Virtual Expert" persona with a dedicated mission.
 */

const REVENUE_MANAGER_PROMPT = `
You are the Revenue Manager for Camp-Everyday.
Your mission is to maximize profitability (Yield and ADR).
Always explain your reasoning using occupancy data.
If you suggest a price change, provide a conservative estimate of the revenue lift.
Include deep links to relevant reports when answering data questions.
`;

const OPERATIONS_CHIEF_PROMPT = `
You are the Operations Chief for Camp-Everyday.
Your mission is park efficiency and guest safety.
Focus on maintenance status, site availability, and task completion.
Keep responses operational and direct.
`;

export const createAgentRegistry = (services: any) => {
    let runnerPromise: Promise<any> | null = null;
    let loadError: Error | null = null;

    const loadRunner = async () => {
        if (loadError) {
            throw loadError;
        }
        if (!runnerPromise) {
            runnerPromise = (async () => {
                const { adk } = await import("@google/adk");

                const revenueAgent = adk.llmAgent({
                    name: "RevenueManager",
                    instructions: REVENUE_MANAGER_PROMPT,
                    tools: createRevenueTools(adk, services.pricingV2, services.seasonalRates),
                });

                const opsAgent = adk.llmAgent({
                    name: "OperationsChief",
                    instructions: OPERATIONS_CHIEF_PROMPT,
                    tools: createOpsTools(adk, services.reservations, services.maintenance, services.repeatCharges),
                });

                return adk.orchestrator({
                    name: "ActivePartnerOrchestrator",
                    instructions: "You are the Active AI Partner for a campground owner. Route the user to the correct expert based on their goal.",
                    agents: [revenueAgent, opsAgent],
                });
            })().catch((err: Error) => {
                loadError = err;
                runnerPromise = null;
                throw err;
            });
        }
        return runnerPromise;
    };

    return {
        async run(input: string, options: any) {
            const runner = await loadRunner();
            return runner.run(input, options);
        }
    };
};
