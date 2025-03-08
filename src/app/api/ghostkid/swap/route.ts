export type GhostKidSwapResponse = {
	transactions: Array<string>;
	txsBlockHeights: Array<string>;
}

export async function POST(request: Request) {
	const body = await request.json()

	const result = await fetch("https://app.ghostkid.io/api/hybrid-actions/withdraw", {
		method: "POST",
		body: JSON.stringify(body)
	});

	const jsonResponse = (await result.json()) as GhostKidSwapResponse;

	return Response.json(jsonResponse)
}
