import asyncio

from agents.mcp import MCPServerStdio


async def main() -> None:
    async with MCPServerStdio(
        name="Codex CLI",
        params={"command": "npx", "args": ["-y", "codex", "mcp"]},
        client_session_timeout_seconds=360000,
    ):
        print("Codex MCP server started.")


if __name__ == "__main__":
    asyncio.run(main())
