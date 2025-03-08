'use client'

import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useCluster } from "@/components/cluster/cluster-data-access";
import { useTransactionToast } from "@/components/ui/ui-layout";
import { useMemo } from "react";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api'
import type { DasApiAsset, DasApiAssetList } from '@metaplex-foundation/digital-asset-standard-api'
import { publicKey } from "@metaplex-foundation/umi";
import type { GhostKidSwapResponse } from "@/app/api/ghostkid/swap/route";

const KIDS_TOKEN_MINT = '4peG5vF6VXbUt8PPA5LDbtdeRAPBGGrspDMW3ot6TdeX'
const GHOST_KID_COLLECTION_ADDRESS = 'FSw4cZhK5pMmhEDenDpa3CauJ9kLt5agr2U1oQxaH2cv'
const POOL_ADDRESS = 'JCSbaLqdn6nKtTVTUjAaxsv28TBhmpypcY3VAqdGKWLA';

export function useGhostKidSwap() {
	const { connection } = useConnection();
	const { publicKey: walletPublicKey, signTransaction } = useWallet();
	const { cluster } = useCluster();
	const transactionToast = useTransactionToast();
	const umi = useMemo(() => createUmi(connection.rpcEndpoint), [connection.rpcEndpoint]).use(dasApi())

	const kidsATA = useMemo(() => {
		if (!walletPublicKey) return null;
		return getAssociatedTokenAddressSync(
			new PublicKey(KIDS_TOKEN_MINT),
			walletPublicKey
		);
	}, [walletPublicKey])

	const kidsTokenBalance = useQuery({
		queryKey: ["kids-token-balance", walletPublicKey, cluster],
		queryFn: async () => {
			if (!walletPublicKey || !kidsATA) return 0;

			try {
				const tokenAccountInfo = await connection.getTokenAccountBalance(kidsATA);
				return tokenAccountInfo.value.uiAmount || 0;
			} catch (error) {
				console.error("Failed to fetch KIDSS token balance:", error);
				return 0;
			}
		},
		enabled: !!walletPublicKey && !!kidsATA,
		retry: 2,
		retryDelay: 1000,
	});

	const getGhostKidsFromPool = useQuery({
		queryKey: ['ghostkid', 'get-ghost-kids-from-pool', { cluster }],
		queryFn: async () => {
			const assets: DasApiAssetList = await umi.rpc.getAssetsByOwner({
				owner: publicKey(POOL_ADDRESS),
			})

			const ghostKidsInPool = assets.items.filter(item => {
				if (!item.grouping.length) {
					return false
				}

				return item.grouping[0].group_key === 'collection' &&
					item.grouping[0].group_value === GHOST_KID_COLLECTION_ADDRESS
			})

			return ghostKidsInPool
		},
		retry: 2,
		retryDelay: 1000
	});

	const ghostKidSwap = useMutation({
		mutationKey: ['ghostkid', 'swap', { cluster }],
		mutationFn: async (selectedNFT: DasApiAsset) => {
			if (!walletPublicKey || !signTransaction) {
				throw new Error('Wallet not connected')
			}

			try {
				// get swap transaction from ghostkid backend
				const result = await fetch("/api/ghostkid/swap", {
					method: "POST",
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						"withdrawer": walletPublicKey.toBase58(),
						"nftMints": [selectedNFT.id]
					}),
				});

				if (!result.ok) {
					throw new Error('Cannot initiate swap')
				}

				const ghostkidSwapResponse: GhostKidSwapResponse = await result.json();

				// convert from response to Transaction in Solana
				const swapTxBuffer = Buffer.from(ghostkidSwapResponse.transactions[0], 'base64')
				const tx = Transaction.from(swapTxBuffer)

				// sign transaction
				const signedTx = await signTransaction(tx)

				// send and confirm transaction
				const latestBlockHash = await connection.getLatestBlockhash()
				const rawTx = signedTx.serialize()
				const txId = await connection.sendRawTransaction(rawTx, {
					skipPreflight: true,
					maxRetries: 3,
				})

				await connection.confirmTransaction({
					blockhash: latestBlockHash.blockhash,
					lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
					signature: txId,
				})

				return txId
			} catch (error) {
				throw new Error(`cannot swap Ghost Kid: ${error}`)
			}
		},
		onSuccess: (txId: string) => {
			console.log(`https://xray.helius.xyz/tx/${txId}`)
		},
		onError: (error, variables, context) => {
			console.error(error)
		},
	});

	return {
		kidsATA,
		kidsTokenBalance,
		getGhostKidsFromPool,
		ghostKidSwap,
	}
}
