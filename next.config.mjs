/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.helius-rpc.com',
				port: '',
				pathname: '/cdn-cgi/image/**',
			}
		]
	}
}

export default nextConfig
