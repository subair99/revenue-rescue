import asyncio
import json
import os
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Telemetry env vars required by CALL-E
CALLE_ENV = {
    **os.environ,
    "CALLE_SOURCE": "skills_sh",
    "CALLE_INTEGRATION": "skills_sh_skill",
    "CALLE_INTEGRATION_VERSION": "0.1.0"
}

async def test_mcp_call():
    print("🔌 Connecting to CALL-E MCP server via stdio...")
    server_params = StdioServerParameters(
        command="calle",
        env=CALLE_ENV
    )
    
    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                # 1. Initialize the session
                await session.initialize()
                print("✅ MCP Session initialized successfully!")
                
                # 2. Verify tools are available
                tools = await session.list_tools()
                tool_names = [t.name for t in tools.tools]
                print(f"🛠️ Available tools: {tool_names}")
                
                if "plan_call" not in tool_names:
                    print("❌ ERROR: 'plan_call' not found in tools!")
                    return

                # 3. Attempt to plan a real call
                print("\n📞 Attempting to plan a call to +2348143662172...")
                plan_args = {
                    "to_phones": ["+2348143662172"],
                    "goal": "Test call from Revenue Rescue MCP integration.",
                    "user_input": "Please call me to test the connection."
                }
                
                result = await session.call_tool("plan_call", arguments=plan_args)
                
                # Parse the response
                response_text = result.content[0].text
                response_data = json.loads(response_text)
                
                print("✅ plan_call successful!")
                print(f"Plan ID: {response_data.get('plan_id')}")
                print(f"Ready to run: {response_data.get('ready_to_run')}")
                
                if response_data.get("ready_to_run"):
                    print("\n🚀 CALL PLANNED SUCCESSFULLY! The CALL-E dashboard should now show this call.")
                else:
                    print(f"\n⚠️ Call needs more info: {response_data.get('clarifying_questions')}")
                    
    except Exception as e:
        print(f"❌ MCP Connection/Call failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_mcp_call())