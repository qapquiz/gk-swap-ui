'use client'

import Image from "next/image"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useGhostKidSwap } from "./ghostkid-swap-data-access"
import { useMemo, useState } from "react"
import type { DasApiAsset } from '@metaplex-foundation/digital-asset-standard-api'

export default function GhostKidSwapFeature() {
	const [selectedNFT, setSelectedNFT] = useState<DasApiAsset | undefined>(undefined)
	const { publicKey } = useWallet()
	const {
		kidsTokenBalance,
		ghostKidSwap,
	} = useGhostKidSwap()

	const nftMint = useMemo(() => {
		return selectedNFT?.id ?? ""
	}, [selectedNFT])

	const handleSwap = () => {
		if (selectedNFT) {
			ghostKidSwap.mutate(selectedNFT)
		}
	}

	return publicKey ? (
		<div className="font-mono flex flex-col gap-4 m-6">
			<div className="text-xl">
				<a className="font-bold underline" href="https://gmgn.ai/sol/token/4peG5vF6VXbUt8PPA5LDbtdeRAPBGGrspDMW3ot6TdeX">$KIDS</a> balance: {kidsTokenBalance.data?.toFixed(2) || '0.00'}
			</div>
			<div className="flex flex-col gap-1">
				<span className="font-bold">NFT Mint Address</span>
				<input
					disabled={true}
					type="text"
					placeholder="NFT Mint Address"
					className="input input-bordered w-full"
					value={nftMint}
				/>
			</div>
			<button
				type='button'
				className="font-bold btn btn-xs lg:btn-md btn-outline"
				onClick={handleSwap}
				disabled={!selectedNFT || ghostKidSwap.isPending}
			>
				{ghostKidSwap.isPending ? 'SWAPPING...' : 'SWAP'}
			</button>
			<div className="flex flex-col gap-2">
				<div className="flex flex-col">
					<span className="text-xl">
						Choose Ghost Kid you want to swap.
					</span>
					<span className="text-xs text-gray-500">POOL ADDRESS: JCSbaLqdn6nKtTVTUjAaxsv28TBhmpypcY3VAqdGKWLA</span>
				</div>
				<div className="p-2 border rounded-lg">
					<GhostKidsInPool
						selectedNFT={selectedNFT}
						onSelect={(item: DasApiAsset) => {
							setSelectedNFT(item)
						}}
					/>
				</div>
			</div>
		</div>
	) : (
		<div className="m-8">
			<p className="text-xl font-mono">Please connect your wallet to interact</p>
		</div>
	)
}

export function GhostKidsInPool({ selectedNFT, onSelect }: { selectedNFT: DasApiAsset | undefined, onSelect: (item: DasApiAsset) => void }) {
	const {
		getGhostKidsFromPool,
	} = useGhostKidSwap()

	if (getGhostKidsFromPool.isLoading) {
		return (
			<div className="p-4 flex items-center justify-center">
				<span className="loading loading-spinner loading-lg" />
			</div>
		)
	}

	if (!getGhostKidsFromPool.data) {
		return (
			<div>
				<span>Not found GhostKids in the pool.</span>
			</div>
		)
	}

	return (
		<div className="grid grid-cols-6 gap-2">
			{
				getGhostKidsFromPool.data?.map((item, _index) => (
					<NFTItem
						key={item.id}
						item={item}
						selectedNFT={selectedNFT}
						onSelect={onSelect}
					/>
				))
			}
		</div>
	)
}

export function NFTItem({ item, selectedNFT, onSelect }: { item: DasApiAsset, selectedNFT: DasApiAsset | undefined, onSelect: (item: DasApiAsset) => void }) {
	const onClick = () => { onSelect(item) }

	return (
		<Image
			className={selectedNFT?.id === item.id ? "border-4 border-yellow-400 rounded-lg" : "rounded-lg"}
			alt={`Ghost Kid ${item.content.metadata.name} image`}
			//@ts-ignore
			src={item.content.files?.[0]?.cdn_uri ?? ''}
			width="100"
			height="100"
			onClick={onClick}
		/>
	)
}

