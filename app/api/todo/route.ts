import type { Todo } from "@/types";
import { todos } from "./data";

export function GET() {
	return new Response(JSON.stringify(todos));
}

export async function POST(req: Request) {
	const todo: Todo = await req.json();
	todos.push(todo);
	return new Response(JSON.stringify(todo));
}
