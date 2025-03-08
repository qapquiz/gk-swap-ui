import { NextResponse } from 'next/server';

// example response
// {"transactions":["AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAsXabJzdBwrx05QFWBwkMfgK1llZ5XrYrT6mmKlJFH/dFdVg4Lhsl1GM7d3okXPB/5MuKgU04fFS1XR94T1CjJXTU9sDLBLxWDdRNWNyGn/B3jnxuFcbFEIA+QIcAsU9Dp3YAslC5fHoZAz74B/eiEK1yJizM+uoMVr1JBIIZRVldJvH6O6JemJdT/BXuHF3w9DvQsZ/rvQkUcBhqo+cIIbMoX0pJZn0dRGJvYYV1hx8xwMCXp+bG67NhgKynwX9peHsRKLrVLXs87/teboq5eSp44u5fsz2OkVwh0qiO7NrZW8QwhHVtFIALN9VMJ6lAXhbgkhLl4KSPS9rrEWjxh+r8FhKAPnMnoGahKQzNQqU99TRbWlyB2og/u5ljPgAApd/j/GO0+M5HoQb1/wJbh8GbkBRXeLtpXD9yccVZtMcYn/hQIeDZK6j8VjkFN5L43RXZbYJaZveC/Ndz0tPQKFKwx4NuaTJ976H3Ee1fZ+iAiAOlDQ+rj2RbYn3Chcn33EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAvQVxTJ10aCNI64ekwyR/CrXXMChT3MwexNDeHncYmATjHfSmOIZ/pkmfxygwZcNOg9KtJmZR26WDY5eOHyltQjJclj04kifG7PRApFI4NgwtaE5na/xCEBI572Nvp+FkIr/iUw/pnwBY6MPI0oz00Z/A6oWQXMV60uBQnvZum7QMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAACYYiheNxCpDVHZ5HAt6andXp/cisgdLSrNHh3cgk/sTzO0TXenNzzoCxRV8suIXPrHh2eDwL1p1LWw9nYUqzGQtwZbHj0XxFOJ1Sf2sEw81YuGxzGqD9tUm20bwD+ClGBqfVFxh70WY12tQEVf3CwMEkxo8hVnWl27rLXwgAAAAG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqeBYYFVGjc4I/eWB1gt3v+juUgNRKC4HR7CFqRd94GjhBBEACQOAGgYAAAAAABEABQLAJwkADwYAAwATDBYADRUCCgELAAQGEwMHCQUIDhIUFg8MFRAI88Dkt3XW8Gc="],"txsBlockHeights":[303718684]}
export type GhostKidSwapResponse = {
	transactions: Array<string>;
	txsBlockHeights: Array<number>;
}

export interface GhostKidSwapRequest {
	withdrawer: string;
	nftMints: Array<string>
}

export async function POST(request: Request) {
	try {
		// Validate content type
		const contentType = request.headers.get('content-type');
		if (contentType !== 'application/json') {
			return NextResponse.json(
				{ error: 'Invalid content type. Expected application/json' },
				{ status: 400 }
			);
		}

		// Parse and validate request body
		let body: GhostKidSwapRequest;
		try {
			body = await request.json();
		} catch (parseError) {
			return NextResponse.json(
				{ error: 'Invalid JSON in request body' },
				{ status: 400 }
			);
		}

		// Validate body contents (add more specific validation as needed)
		if (!body.withdrawer || !body.nftMints) {
			return NextResponse.json(
				{ error: 'Missing required fields in request body' },
				{ status: 400 }
			);
		}


		// Proxy the request to the external API
		const result = await fetch("https://app.ghostkid.io/api/hybrid-actions/withdraw", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body)
		});

		// Handle non-200 responses from the external API
		if (!result.ok) {
			const errorText = await result.text();
			return NextResponse.json(
				{
					error: 'External API request failed',
					status: result.status,
					details: errorText
				},
				{ status: result.status }
			);
		}

		// Parse and return the response
		const jsonResponse = await result.json() as GhostKidSwapResponse;

		return NextResponse.json(jsonResponse, {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		});

	} catch (error) {
		// Catch any unexpected errors
		console.error('Swap API error:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}
