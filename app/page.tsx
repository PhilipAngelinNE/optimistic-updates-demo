"use client";

import type { Todo } from "@/types";
import { type DefaultError, useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const QUERY_KEY = ["todos"];

/**
 * Simulate traffic time.
 */
function sleep(): Promise<unknown> {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve(1);
		}, 1000);
	});
}

export default function Home() {
	const [enableOptimistic, setEnableOptimistic] = useState<boolean>(true);
	const [input, setInput] = useState<string>("");

	const { data, isLoading } = useQuery<Todo[]>({
		queryKey: QUERY_KEY,
		queryFn: async () => {
			await sleep();
			const res = await fetch("http://localhost:3000/api/todo");
			return res.json();
		},
	});

	console.log(data);

	const addMutation = useMutation<
		Todo,
		DefaultError,
		{ input: string; id: string; throwError?: boolean },
		{ previousTodos: Todo[] }
	>({
		mutationFn: async ({ input, id, throwError }) => {
			await sleep();
			if (throwError) {
				throw new Error("We caused an intentional error.");
			}
			const res = await fetch("http://localhost:3000/api/todo", {
				method: "POST",
				body: JSON.stringify({ title: input, id } satisfies Todo),
			});
			return res.json();
		},
		onMutate: enableOptimistic
			? async (newTodo, context) => {
					// Cancel any outgoing refetches
					// (so they don't overwrite our optimistic update)
					await context.client.cancelQueries({ queryKey: QUERY_KEY });

					// Snapshot the previous value
					const previousTodos: Todo[] = context.client.getQueryData(QUERY_KEY) ?? [];

					// Optimistically update to the new value
					context.client.setQueryData(QUERY_KEY, (old: Todo[]) => [
						...old,
						{ title: newTodo.input, id: newTodo.id } satisfies Todo,
					]);

					// Return a result with the snapshotted value
					return { previousTodos };
			  }
			: undefined,
		// If the mutation fails,
		// use the result returned from onMutate to roll back
		onError: (_err, _newTodo, onMutateResult, context) => {
			context.client.setQueryData(QUERY_KEY, onMutateResult?.previousTodos ?? []);
		},
		// Always refetch after error or success:
		onSettled: (_data, _error, _variables, _onMutateResult, context) =>
			context.client.invalidateQueries({ queryKey: QUERY_KEY }),
		onSuccess: () => setInput(""),
	});

	return (
		<div className="h-full w-full flex flex-col justify-center items-center gap-8">
			<h1 className="font-bold text-6xl mb-8">Optimistic updates demo</h1>
			<form
				className="flex gap-4"
				onSubmit={e => {
					e.preventDefault();
					addMutation.mutate({ input, id: uuidv4() });
				}}
			>
				<input
					type="text"
					placeholder="Do chores"
					className="border rounded-md px-2 py-1"
					onChange={e => setInput(e.target.value)}
					value={input}
				/>
				<button type="submit" className="bg-white text-background font-bold p-2 rounded-md">
					Optimistic
				</button>
				<button
					type="button"
					className="bg-red-500 font-bold p-2 rounded-md"
					onClick={() => addMutation.mutate({ input, id: uuidv4(), throwError: true })}
				>
					Error
				</button>
				<div className="flex items-center gap-1">
					<input
						id="enable-optimistic"
						type="checkbox"
						checked={enableOptimistic}
						onChange={e => setEnableOptimistic(e.target.checked)}
					/>
					<label htmlFor="enable-optimistic">Enable optimistic</label>
				</div>
			</form>
			{isLoading && <p className="font-semibold">Loading...</p>}
			<div className="flex flex-wrap gap-4 max-w-8/12">
				{data?.map(({ id, title }) => (
					<div key={id} className="border py-6 px-12 font-semibold rounded-md flex flex-col gap-2">
						<p>{title}</p>
						<p className="text-xs">{id}</p>
					</div>
				))}
			</div>
		</div>
	);
}
