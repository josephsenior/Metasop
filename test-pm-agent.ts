import { productManagerAgent } from "./lib/metasop/agents/product-manager";
import { AgentContext } from "./lib/metasop/types";
import * as dotenv from "dotenv";

dotenv.config();

async function test() {
  const context: AgentContext = {
    user_request: "Create a simple todo app with React and TypeScript",
    previous_artifacts: {},
  };

  try {
    console.log("Starting Product Manager agent test...");
    const result = await productManagerAgent(context);
    console.log("SUCCESS!");
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("FAILED!");
    console.error(error);
  }
}

test();
