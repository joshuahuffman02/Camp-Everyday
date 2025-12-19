import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

from agents import Agent, ModelSettings, Runner, set_default_openai_api
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX
from agents.mcp import MCPServerStdio
from openai.types.shared import Reasoning

load_dotenv(override=True)
set_default_openai_api(os.getenv("OPENAI_API_KEY"))

ROLE_LIST = [
    "Project Manager",
    "Product Strategist",
    "UX Researcher",
    "Interaction Designer",
    "Visual Designer",
    "Frontend Engineer",
    "Backend Engineer",
    "Mobile Engineer",
    "Data Engineer",
    "Analytics Analyst",
    "AI Engineer",
    "Payments Specialist",
    "Security Lead",
    "DevOps Engineer",
    "QA Engineer",
    "Performance Engineer",
    "Integrations Engineer",
    "Technical Writer",
    "Support Ops",
    "Release Manager",
]


def build_role_instructions(role_name: str) -> str:
    return (
        f"{RECOMMENDED_PROMPT_PREFIX}"
        f"You are the {role_name}.\n"
        "Your only source of truth is REQUIREMENTS.md and AGENT_TASKS.md.\n"
        "Only complete the tasks listed for your role.\n"
        "Do not assume requirements that are not written.\n\n"
        "Execution rules:\n"
        "- Use Codex MCP for file edits and creation.\n"
        "- Always call codex with {\"approval-policy\":\"never\",\"sandbox\":\"workspace-write\"}.\n"
        "- Keep outputs concise and implementation-ready.\n"
        "- If a task is ambiguous, ask the Project Manager for clarification.\n\n"
        "When complete, hand off to the Project Manager with transfer_to_project_manager_agent."
    )


def resolve_task() -> str:
    if len(sys.argv) > 1:
        return " ".join(sys.argv[1:])

    task_path = Path(__file__).with_name("TASK.md")
    if task_path.exists():
        return task_path.read_text(encoding="utf-8")

    return (
        "Define a scoped engineering task, list required roles, and produce deliverables."
    )


def resolve_active_roles() -> list[str]:
    roles_env = os.getenv("AGENT_ROLES", "")
    roles = [role.strip() for role in roles_env.split(",") if role.strip()]
    if not roles:
        return []
    return roles


async def main() -> None:
    async with MCPServerStdio(
        name="Codex CLI",
        params={"command": "npx", "args": ["-y", "codex", "mcp"]},
        client_session_timeout_seconds=360000,
    ) as codex_mcp_server:
        specialist_agents = []
        for role in ROLE_LIST:
            if role == "Project Manager":
                continue
            specialist_agents.append(
                Agent(
                    name=role,
                    instructions=build_role_instructions(role),
                    model="gpt-5",
                    mcp_servers=[codex_mcp_server],
                )
            )

        active_roles = resolve_active_roles()
        active_roles_text = ", ".join(active_roles) if active_roles else "auto"

        project_manager_agent = Agent(
            name="Project Manager",
            instructions=(
                f"{RECOMMENDED_PROMPT_PREFIX}"
                "You are the Project Manager.\n\n"
                "Objective:\n"
                "Create clear, auditable tasking for a multi-agent workflow and orchestrate handoffs.\n\n"
                "Deliverables (write in repo root):\n"
                "- REQUIREMENTS.md: concise product goals, constraints, and target users.\n"
                "- TEST.md: acceptance criteria and verification steps.\n"
                "- AGENT_TASKS.md: one section per role with specific file paths and deliverables.\n\n"
                "Active roles: "
                f"{active_roles_text}\n\n"
                "Process:\n"
                "- Only assign roles listed in Active roles if it is not 'auto'.\n"
                "- When 'auto', choose the smallest set of roles that can complete the task.\n"
                "- Provide exact file paths and deliverable names per role.\n"
                "- Do not create extra files beyond the three required at this step.\n"
                "- Use Codex MCP for file edits with {\"approval-policy\":\"never\",\"sandbox\":\"workspace-write\"}.\n\n"
                "Handoffs:\n"
                "- After the three files exist, hand off to each required role.\n"
                "- Wait for each role to complete its assigned deliverables.\n"
                "- When all assigned roles complete, return a short status summary.\n"
            ),
            model="gpt-5",
            model_settings=ModelSettings(reasoning=Reasoning(effort="medium")),
            handoffs=specialist_agents,
            mcp_servers=[codex_mcp_server],
        )

        for agent in specialist_agents:
            agent.handoffs = [project_manager_agent]

        task_list = resolve_task()
        result = await Runner.run(project_manager_agent, task_list, max_turns=40)
        print(result.final_output)


if __name__ == "__main__":
    asyncio.run(main())
